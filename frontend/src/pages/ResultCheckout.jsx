import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header, OrderSummary } from "../components";
import { fetchOrderResult } from "../apis/payment_api";

export const ResultCheckout = () => {
  const [params] = useSearchParams();

  const orderId = params.get("orderId");
  const statusParam = params.get("status");
  const queryMessage = params.get("message");

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. URL ÉP FAIL → FAIL TUYỆT ĐỐI
    if (statusParam === "fail") {
      setState({
        status: "fail",
        message: queryMessage || "Thanh toán thất bại",
      });
      setLoading(false);
      return;
    }
    // 2. PROCESSING → VẪN LẤY THÔNG TIN ORDER
    if (statusParam === "processing") {
      setLoading(true);
      fetchOrderResult(orderId)
        .then((data) => {
          setState({
            status: "processing",
            course: data.course,
            user: data.user,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: data.paymentMethod,
            message: "Đang chờ xác nhận chuyển khoản",
          });
        })
        .catch(() => {
          setState({
            status: "fail",
            message: "Không lấy được thông tin đơn hàng",
          });
        })
        .finally(() => setLoading(false));
      return;
    }

    // 3. SUCCESS nhưng thiếu orderId → FAIL
    if (statusParam === "success" && !orderId) {
      setState({
        status: "fail",
        message: "Thiếu mã đơn hàng",
      });
      setLoading(false);
      return;
    }

    // 4. Không có orderId → FAIL
    if (!orderId) {
      setState({
        status: "fail",
        message: queryMessage || "Thiếu mã đơn hàng",
      });
      setLoading(false);
      return;
    }

    // 5. CHỈ TỚI ĐÂY MỚI ĐƯỢC TIN BACKEND
    setLoading(true);

    fetchOrderResult(orderId)
      .then((data) => {
        setState({
          status: data.status,
          course: data.course,
          user: data.user,
          amount: data.amount,
          currency: data.currency,
          paidAt: data.paidAt,
          paymentMethod: data.paymentMethod,
          message:
            queryMessage ||
            data.message ||
            (data.status === "fail" ? "Thanh toán thất bại" : ""),
        });
      })
      .catch(() => {
        setState({
          status: "fail",
          message: queryMessage || "Không lấy được kết quả thanh toán",
        });
      })
      .finally(() => setLoading(false));
  }, [orderId, statusParam, queryMessage]);

  useEffect(() => {
    if (statusParam === "success" || statusParam === "fail") {
      sessionStorage.removeItem("payment_locked");
      sessionStorage.removeItem("payment_order_id");
    }
  }, [statusParam, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang xử lý kết quả thanh toán...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Dữ liệu không hợp lệ</p>
      </div>
    );
  }

  const {
    status,
    course,
    user,
    amount,
    currency,
    paidAt,
    message,
    paymentMethod,
  } = state;

  const summaryItems =
    status === "success"
      ? [
          { label: "Khóa học", value: course?.name },
          { label: "Học viên", value: user },
          {
            label: "Ngày mua",
            value: paidAt ? new Date(paidAt).toLocaleString("vi-VN") : "",
          },
          { label: "Loại thanh toán", value: paymentMethod?.label },
          {
            label: "Tổng tiền",
            value: `${amount.toLocaleString("vi-VN")} ${currency}`,
            highlight: true,
          },
        ]
      : [];

  const goCourse = () => {
    window.location.href = course.url;
  };

  const goBack = () => {
    sessionStorage.removeItem("payment_locked");
    sessionStorage.removeItem("payment_order_id");

    const nextFromCheckout = sessionStorage.getItem("checkout_next");
    if (nextFromCheckout) {
      window.location.href = nextFromCheckout;
      return;
    }
    window.location.href = "http://local.openedx.io:8000/";
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col">
      <Header showExit={false} />

      <div className="flex flex-1 justify-center items-center">
        {status === "success" && (
          <div className="w-full max-w-lg flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow">
            <img src="/images/icons-success.svg" className="w-14 h-14" />
            <p className="text-green-500 text-lg font-medium">
              Thanh toán thành công
            </p>

            <dl className="w-full text-sm bg-gray-50 rounded-lg p-4 space-y-3">
              {summaryItems.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <dt className="text-gray-500">{item.label}</dt>
                  <dd
                    className={
                      item.highlight
                        ? "font-semibold text-right"
                        : "font-medium text-right"
                    }
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <button
              onClick={goCourse}
              className="px-4 py-2 bg-cusc_blue text-white rounded-lg font-bold"
            >
              Vào khóa học
            </button>
          </div>
        )}

        {status === "fail" && (
          <div className="w-full max-w-md flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow">
            <img src="/images/pending.svg" className="w-14 h-14" />
            <p className="text-red-500 text-lg">
              {message || "Thanh toán lỗi"}
            </p>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-cusc_blue text-white rounded-lg font-bold"
            >
              Quay lại khóa học
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="w-full max-w-lg flex flex-col gap-4 bg-white p-6 rounded-xl shadow">
            <img src="/images/pending.svg" className="w-14 h-14 mx-auto" />
            <p className="text-yellow-600 text-lg font-medium text-center">
              Chờ xác nhận chuyển khoản
            </p>
            <p className="text-sm text-gray-600 text-center">
              Hệ thống sẽ kích hoạt khóa học ngay sau khi giao dịch được xác
              nhận.
            </p>

            <OrderSummary
              course={course}
              user={user}
              amount={amount}
              currency={currency}
              paymentMethod={paymentMethod}
              paidAt={paidAt}
              showPaidAt
            />

            <button
              onClick={goBack}
              className="px-4 py-2 bg-cusc_blue text-white rounded-lg font-bold"
            >
              Quay lại khóa học
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
