const express = require("express");
const router = express.Router();
const lmsApi = require("./server_api/lms_api");
const paymentVnpay = require("./server_api/payment_vnpay");
const paymentPaypal = require("./server_api/payment_paypal");
const paymentMoMo = require("./server_api/payment_momo");

const COURSE_MODE = process.env.COURSE_MODE || "verified";

router.get("/", (req, res) => {
  res.send("Node payment API is running.");
});

router.get("/api/checkout-data", async (req, res) => {
  const { course_id: courseId, user: username, next: nextUrl } = req.query;

  if (!courseId || !username || !nextUrl) {
    return res.status(400).json({ error: "Thiếu tham số query" });
  }

  try {
    const user = await lmsApi.lookupUser(username);
    const pricing = await lmsApi.fetchCoursePricing(courseId, COURSE_MODE);
    const course = await lmsApi.fetchCourseDetail(courseId);

    res.json({
      courseId,
      username,
      user,
      pricing,
      nextUrl,
      course,
      lmsBase: lmsApi.LMS_BASE,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/orders/create", async (req, res) => {
  const { courseId, username, amount, currency, nextUrl, paymentMethod } =
    req.body;

  if (!courseId || !username || !amount) {
    return res.status(400).json({ error: "Thiếu dữ liệu tạo order" });
  }

  try {
    const user = await lmsApi.lookupUser(username);

    const order = await lmsApi.createOrderInLms({
      courseId,
      username,
      userId: user.id,
      amount,
      currency,
      nextUrl,
      extraData: {
        payment_method: {
          channel: paymentMethod.channel,
          provider: paymentMethod.provider,
          label: paymentMethod.label,
        },
      },
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/order-result/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await lmsApi.fetchOrderDetail(orderId);
    const course = await lmsApi.fetchCourseDetail(order.course_id);

    res.json({
      status: order.status === "paid" ? "success" : "fail",
      orderId: order.id,
      user: order.username,
      amount: Number(order.amount),
      currency: order.currency.toUpperCase(),
      paymentMethod: {
        channel: order.extra_data?.payment_method?.channel,
        provider: order.extra_data?.payment_method?.provider,
        label:
          order.extra_data?.payment_method?.label ||
          order.extra_data?.payment_info?.gateway ||
          "Không xác định",
      },
      paidAt: order.updated_at,
      course: {
        name: course.display_name,
        url: order.extra_data?.next,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
});

router.post("/api/simulate-success", async (req, res) => {
  const { orderId, nextUrl } = req.body;

  if (!orderId) {
    return res.status(400).json({ ok: false, error: "Thiếu orderId" });
  }

  try {
    const result = await lmsApi.markOrderPaid(orderId);
    res.json({ ok: true, redirect: nextUrl, lmsResult: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// VNPAY
router.post("/api/vnpay/create-payment", async (req, res) => {
  try {
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    const result = await paymentVnpay.createPaymentVNpay(req.body, ipAddr);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//Vnpay tra ve server giup xac nhan thanh cong va cap nhat
router.get("/vnpay_ipn", async (req, res, next) => {
  try {
    const { isValid, data } = await paymentVnpay.verifyVNPayChecksum(req.query);

    if (!isValid)
      return res.json({ RspCode: "97", Message: "Invalid Checksum" });

    // Nếu thành công
    if (data.vnp_ResponseCode === "00" && data.vnp_TransactionStatus === "00") {
      // TODO: cập nhật trạng thái đơn hàng trong DB
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    } else {
      return res.json({ RspCode: "01", Message: "Transaction Failed" });
    }
  } catch (err) {
    next(err);
  }
});

//vnpay tra ve khach hang
router.get("/vnpay_return", async (req, res) => {
  const { isValid, data } = await paymentVnpay.verifyVNPayChecksum(req.query);

  const frontBase = process.env.CLIENT_URL;
  const returnPath = "/result";

  const orderId = data.vnp_TxnRef;

  let status = "fail";

  if (isValid && data.vnp_ResponseCode === "00") {
    try {
      await lmsApi.markOrderPaid(orderId);
      status = "success";
    } catch (err) {
      console.error("markOrderPaid failed:", err.message);
      status = "fail";
    }
  }

  const qs = new URLSearchParams();
  qs.set("orderId", orderId);
  qs.set("status", status);

  return res.redirect(`${frontBase}${returnPath}?${qs.toString()}`);
});

//paypal
router.post("/api/paypal/create-order", async (req, res) => {
  const { orderId, amount, currency } = req.body;

  const paypalAmount = paymentPaypal.convertToPaypalAmount(amount, currency);
  const request =
    new paymentPaypal.checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: orderId,
        amount: paypalAmount,
      },
    ],
    application_context: {
      return_url: `${process.env.CLIENT_URL}/paypal_return`,
      cancel_url: `${process.env.CLIENT_URL}/result?orderId=${orderId}&status=fail`,
    },
  });

  const response = await paymentPaypal.paypalClient.client().execute(request);
  const approveUrl = response.result.links.find(
    (l) => l.rel === "approve",
  ).href;

  res.json({ approveUrl });
});

router.get("/paypal_return", async (req, res) => {
  const { token } = req.query;

  const request =
    new paymentPaypal.checkoutNodeJssdk.orders.OrdersCaptureRequest(token);
  request.requestBody({});

  try {
    const capture = await paymentPaypal.paypalClient.client().execute(request);
    const orderId = capture.result.purchase_units[0].reference_id;
    await lmsApi.markOrderPaid(orderId);
    res.redirect(
      `${process.env.CLIENT_URL}/result?orderId=${orderId}&status=success`,
    );
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL}/result?status=fail`);
  }
});

//momo
router.post("/api/momo/create-payment", async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    const result = await paymentMoMo.createMoMoPayment({
      orderId,
      amount,
      redirectUrl: `${process.env.CLIENT_URL}/momo_return`,
      ipnUrl: `${process.env.CLIENT_URL}/momo_ipn`,
    });

    // CHỌN URL AN TOÀN
    const redirect = result.payUrl || result.deeplink || result.qrCodeUrl;

    if (!redirect) {
      return res.status(500).json({
        error: "MoMo không trả về URL thanh toán",
        raw: result,
      });
    }

    res.json({ redirectUrl: redirect });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/momo_return", async (req, res) => {
  const isValid = paymentMoMo.verifyMoMoSignature(req.query);

  const { orderId, resultCode } = req.query;

  if (!orderId) {
    return res.redirect(
      `${process.env.CLIENT_URL}/result?status=fail&message=Missing orderId`,
    );
  }

  if (!isValid) {
    return res.redirect(
      `${process.env.CLIENT_URL}/result?status=fail&message=Invalid signature`,
    );
  }

  if (resultCode === "0") {
    try {
      await lmsApi.markOrderPaid(orderId);
      return res.redirect(
        `${process.env.CLIENT_URL}/result?orderId=${orderId}&status=success`,
      );
    } catch (err) {
      return res.redirect(
        `${process.env.CLIENT_URL}/result?orderId=${orderId}&status=fail&message=Enroll failed`,
      );
    }
  }

  return res.redirect(
    `${process.env.CLIENT_URL}/result?orderId=${orderId}&status=fail`,
  );
});

module.exports = router;
