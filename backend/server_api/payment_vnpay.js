const moment = require("moment");
const crypto = require("crypto");
const qs = require("qs");

function sortObject(obj) {
  const sorted = {};
  const keys = [];
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      keys.push(encodeURIComponent(k));
    }
  }
  keys.sort();
  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = encodeURIComponent(obj[keys[i]]).replace(/%20/g, "+");
  }
  return sorted;
}

const createPaymentVNpay = async (body, ipAddr) => {
  const { amount, bankCode, orderInfo, returnPath, orderId } = body;

  if (!amount || isNaN(amount)) {
    const err = new Error("Thiếu hoặc sai định dạng amount");
    err.status = 400;
    throw err;
  }

  const vnp_TmnCode = process.env.VNP_TMN_CODE;
  const vnp_HashSecret = process.env.VNP_HASH_SECRET;
  const vnp_Url = process.env.VNP_URL;
  const vnp_ReturnUrlBase = process.env.VNP_RETURN_URL;
  const vnp_IpnUrl = process.env.VNP_IPN_URL;

  const createDate = moment().format("YYYYMMDDHHmmss");

  const urlObj = new URL(vnp_ReturnUrlBase);
  const ipnObj = new URL(vnp_IpnUrl);
  if (returnPath) urlObj.searchParams.set("returnPath", returnPath);

  const info = orderInfo || `Thanh toan cho ma GD:${orderId}`;

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: info,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_ReturnUrl: urlObj.toString(),
    //vnp_IpnUrl: ipnObj.toString(),
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: createDate,
  };
  if (bankCode) vnp_Params.vnp_BankCode = bankCode;

  // 1) encode & sort theo sample
  vnp_Params = sortObject(vnp_Params);

  // 2) build chuỗi ký KHÔNG encode thêm (vì đã encode tay ở bước trên)
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // 3) gắn signature vào param
  vnp_Params["vnp_SecureHash"] = signed;

  // 4) build URL cuối
  const paymentUrl =
    vnp_Url + "?" + qs.stringify(vnp_Params, { encode: false });

  return { success: true, message: "OK", paymentUrl, orderId };
};

const verifyVNPayChecksum = async (query) => {
  const vnp_Params = {};

  Object.keys(query).forEach((key) => {
    if (key.startsWith("vnp_")) {
      vnp_Params[key] = query[key];
    }
  });

  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sorted = sortObject(vnp_Params);

  const signData = require("qs").stringify(sorted, { encode: false });
  const signed = crypto
    .createHmac("sha512", process.env.VNP_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return { isValid: secureHash === signed, data: sorted };
};

module.exports = {
  createPaymentVNpay,
  verifyVNPayChecksum,
};
