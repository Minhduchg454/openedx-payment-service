import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCheckoutData,
  simulateSuccess,
  apiCreateVNPayPayment,
  apiCreateMoMoPayment,
  apiCreatePaypalPayment,
  createOrder,
} from "../apis/payment_api";
import { Header, SelectableCardList } from "../components";
import { path } from "../utils/path";
// test moi truong
// http://localhost:5173/checkout?course_id=course-v1%3AHoiDanIT%2BY0001%2B2025_T2&user=minhduchg454&next=http%3A%2F%2Flocal.openedx.io%3A8000%2Fcourses%2Fcourse-v1%3AHoiDanIT%2BY0001%2B2025_T2%2Fabout

/**
 * Mẫu test vnpay
 * ngan hang: NCB
 * so the: 9704198526191432198
 * ten chu the: NGUYEN VAN A
 * ngay phat hanh: 07/15
 * opt: 123456
 */

/**
 * Mau test Paypal
 * email: sb-2lybe49137294@personal.example.com
 * mk: bQ_4UnAF
 */

/**
 * Mau test Momo qua the ngan hang
 * So the:9704 0000 0000 0018
 * Chu the:NGUYEN VAN A
 * Ngay tao: 03/07
 *
 * otp: OTP
 */

export function Checkout() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("wallet");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [paymentLocked, setPaymentLocked] = useState(false);

  const PAYMENT_CONFIG = {
    wallet: {
      id: "wallet",
      label: "Ví điện tử",
      details: [
        { id: "vnpay", label: "VNPay", icon: "/images/VNPay-active.png" },
        { id: "momo", label: "MoMo", icon: "/images/MoMo-active.png" },
        {
          id: "shoppepay",
          label: "ShoppePay",
          icon: "/images/shopee_pay_active.png",
        },
      ],
    },

    international: {
      id: "international",
      label: "Thanh toán quốc tế",
      details: [
        {
          id: "visa",
          label: "Thẻ Visa / MasterCard",
          icon: "/images/visa_mastercard.png",
        },
        {
          id: "paypal",
          label: "PayPal",
          icon: "/images/paypal_active.png",
        },
      ],
    },

    bank: {
      id: "bank",
      label: "Chuyển khoản ngân hàng",
      details: [
        { id: "atm", label: "Thẻ nội địa", icon: "/images/ATM-active.png" },
      ],
    },
  };

  const paymentMethods = Object.values(PAYMENT_CONFIG);
  const currentPaymentDetails = PAYMENT_CONFIG[selectedMethod]?.details || [];

  const buildPaymentMethodLabel = () => {
    const method = PAYMENT_CONFIG[selectedMethod];
    if (!method) return "";

    const detail = method.details.find((d) => d.id === paymentDetail);
    if (!detail) return method.label;

    return `${method.label} - ${detail.label}`;
  };

  useEffect(() => {
    sessionStorage.removeItem("payment_locked");
    sessionStorage.removeItem("payment_order_id");

    fetchCheckoutData()
      .then((res) => {
        setData(res);
        sessionStorage.setItem("checkout_next", res.nextUrl);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Lỗi tải dữ liệu");
        setLoading(false);
      });
  }, []);

  const handleSelectMethod = (methodId) => {
    setSelectedMethod(methodId);
    const details = PAYMENT_CONFIG[methodId]?.details || [];
    setPaymentDetail(details[0]?.id || "");
  };

  if (loading) {
    return <div className="p-8">Đang tải dữ liệu thanh toán...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Lỗi: {error}</div>;
  }

  const { course, pricing, username, nextUrl, lmsBase } = data;

  const handlePay = async () => {
    if (!paymentDetail) {
      alert("Vui lòng chọn phương thức thanh toán");
      return;
    }

    try {
      // 1. TẠO ORDER
      const order = await createOrder({
        courseId: course.course_id,
        username,
        amount: pricing.price,
        currency: pricing.currency,
        paymentMethod: {
          channel: selectedMethod,
          provider: paymentDetail,
          label: buildPaymentMethodLabel(),
        },
        nextUrl,
      });
      setPaymentLocked(true);

      // 1.1 Lưu lại để reload không tạo lại order
      sessionStorage.setItem("payment_order_id", order.id);
      sessionStorage.setItem("payment_locked", "1");

      // 2. Cac phuong thuc thanh toan gia lap
      switch (paymentDetail) {
        case "vnpay": {
          const pay = await apiCreateVNPayPayment({
            orderId: order.id,
            amount: pricing.price,
            bankCode: "NCB",
          });
          window.location.href = pay.paymentUrl;
          return;
        }

        case "paypal": {
          const { approveUrl } = await apiCreatePaypalPayment({
            orderId: order.id,
            amount: pricing.price,
            currency: pricing.currency,
          });
          window.location.href = approveUrl;
          return;
        }

        case "momo": {
          const { redirectUrl } = await apiCreateMoMoPayment({
            orderId: order.id,
            amount: pricing.price,
          });
          window.location.href = redirectUrl;
          return;
        }

        case "shoppepay":
        case "visa":
        case "atm": {
          await simulateSuccess(order.id);
          navigate(`${path.result}?orderId=${order.id}&status=success`, {
            replace: true,
          });
          return;
        }
        default: {
          throw new Error("Phương thức thanh toán không được hỗ trợ");
        }
      }
    } catch (err) {
      const msg =
        err?.message || "Không thể tạo đơn hàng hoặc khởi tạo thanh toán";

      window.location.href = `${path.result}?status=fail&message=${encodeURIComponent(msg)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ===== HEADER ===== */}
      <Header urlExit={nextUrl} />

      {/* ===== MAIN ===== */}
      <main className="flex-1 mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* LEFT: PAYMENT */}
          <section className="md:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-sm font-semibold mb-4">
              Chọn phương thức thanh toán
            </h2>

            <div className="text-sm flex justify-start items-center gap-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`border p-2 rounded-xl flex items-center gap-2 ${
                    selectedMethod === method.id ? "border-cusc_blue" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    disabled={paymentLocked}
                    onChange={() => handleSelectMethod(method.id)}
                  />

                  {method.label}
                </label>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-4">
                Lựa chọn phương thức thanh toán
              </h2>

              <SelectableCardList
                disabled={paymentLocked}
                items={currentPaymentDetails}
                value={paymentDetail}
                onChange={setPaymentDetail}
              />
            </div>
          </section>

          {/* RIGHT: ORDER INFO */}
          <section className="bg-white rounded-xl shadow p-6 ">
            <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>

            {/* COURSE PREVIEW */}
            <div className="mb-4">
              <img
                src={
                  course.image_url
                    ? `${lmsBase}${course.image_url}`
                    : "/images/no_image.png"
                }
                alt={course.display_name}
                className="w-full h-40 object-cover rounded"
              />

              <div className="mt-3 font-medium">{course.display_name}</div>
            </div>

            <hr className="my-4" />

            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Học viên</dt>
                <dd className="font-medium">{username}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-gray-600">Hình thức</dt>
                <dd className="font-medium">
                  {pricing.mode_display_name || "Không xác định"}
                </dd>
              </div>
            </dl>

            <hr className="my-4" />

            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Tổng tiền</span>
              <span className="text-green-600">
                {Number(pricing.price).toLocaleString("vi-VN")}{" "}
                {pricing.currency}
              </span>
            </div>

            <hr className="my-4" />

            <div className="flex justify-end">
              <button
                onClick={handlePay}
                disabled={paymentLocked}
                className={` px-2 py-1 rounded-lg font-bold text-white ${
                  paymentLocked
                    ? "bg-gray-400"
                    : "bg-cusc_blue hover:bg-blue-700"
                }`}
              >
                {paymentLocked ? "Đang xử lý..." : "Thanh toán"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
