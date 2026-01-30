const axios = require("axios");

const LMS_BASE = process.env.LMS_BASE || "http://local.openedx.io:8000";
const PAYMENT_TOKEN = process.env.CUSC_PAYMENT_API_TOKEN || "";

// Helper nội bộ
function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function lmsHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (PAYMENT_TOKEN) headers["X-CUSC-PAYMENT-TOKEN"] = PAYMENT_TOKEN;
  return headers;
}

// Các hàm nghiệp vụ
async function lookupUser(username) {
  if (!username) throw new Error("Thiếu username để tra cứu user");
  const url = `${LMS_BASE}/api/cusc-edx-api/users/lookup/?username=${encodeURIComponent(username)}`;
  log("CALL LMS users.lookup:", url);
  const res = await axios.get(url, { headers: lmsHeaders() });
  const data = res.data;
  if (!data.count || data.count < 1)
    throw new Error(`Không tìm thấy user "${username}"`);
  return data.results[0];
}

async function fetchOrderDetail(orderId) {
  if (!orderId) throw new Error("Thiếu orderId");

  const url = `${LMS_BASE}/api/cusc-edx-api/orders/${orderId}/`;
  log("CALL LMS orders.detail:", url);

  const res = await axios.get(url, {
    headers: lmsHeaders(),
  });

  return res.data;
}

async function fetchCoursePricing(courseId, mode) {
  const url = `${LMS_BASE}/api/cusc-edx-api/course-pricing/${encodeURIComponent(courseId)}/${mode ? `?mode=${mode}` : ""}`;
  const res = await axios.get(url, { headers: lmsHeaders() });
  const data = res.data;
  const chosen = mode
    ? data.modes.find((m) => m.mode_slug === mode)
    : data.modes.find((m) => m.mode_slug === "verified") || data.modes[0];
  return {
    courseId: data.course_id,
    mode: chosen.mode_slug,
    price: chosen.price,
    currency: chosen.currency,
    raw: chosen,
    mode_display_name: chosen.mode_display_name,
  };
}

async function fetchCourseDetail(courseId) {
  const url = `${LMS_BASE}/api/cusc-edx-api/course-detail/${encodeURIComponent(courseId)}/`;
  const res = await axios.get(url, { headers: lmsHeaders() });
  return res.data;
}

async function createOrderInLms({
  courseId,
  username,
  userId,
  amount,
  currency,
  nextUrl,
  extraData = {},
}) {
  const url = `${LMS_BASE}/api/cusc-edx-api/orders/create/`;
  const body = {
    course_id: courseId,
    amount,
    currency,
    external_order_id: `NODE-DEMO-${Date.now()}`,
    username,
    extra_data: { source: "node-demo", next: nextUrl, ...extraData },
  };
  if (userId) body.user_id = userId;
  const res = await axios.post(url, body, { headers: lmsHeaders() });
  return res.data;
}

async function markOrderPaid(orderId) {
  const url = `${LMS_BASE}/api/cusc-edx-api/orders/${orderId}/status/`;
  const body = {
    status: "paid",
    payment_info: { gateway: "demo-gateway", note: "Thanh toán giả lập" },
  };
  const res = await axios.post(url, body, { headers: lmsHeaders() });
  return res.data;
}

// Export các hàm
module.exports = {
  lookupUser,
  fetchCoursePricing,
  fetchCourseDetail,
  createOrderInLms,
  markOrderPaid,
  fetchOrderDetail,
  LMS_BASE,
};
