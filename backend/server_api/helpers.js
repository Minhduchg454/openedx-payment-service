const lmsApi = require("./lms_api");

async function handleOrderSuccess(orderId) {
  await lmsApi.markOrderPaid(orderId);
  const order = await lmsApi.fetchOrderDetail(orderId);
  const course = await lmsApi.fetchCourseDetail(order.course_id);

  await lmsApi.sendMail({
    to: [order.email],
    subject: "Thanh toán thành công – bắt đầu học ngay",
    template: "emails/order_success.html",
    context: {
      name: order.username,
      order_id: order.id,
      course_name: course.display_name,
      amount: Number(order.amount).toLocaleString("vi-VN"),
      currency: order.currency,
      payment_method_label:
        order.extra_data?.payment_method?.label || "Không xác định",
      result_url: order.extra_data?.next,
      course_createdAt: order.created_at
        ? new Date(order.created_at).toLocaleString("vi-VN")
        : "",
    },
  });

  return order;
}

module.exports = {
  handleOrderSuccess,
};
