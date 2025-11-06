const express = require("express");
const axios = require("axios");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const LMS_BASE = process.env.LMS_BASE || "http://local.openedx.io:8000";
const PAYMENT_TOKEN = process.env.CUSC_PAYMENT_API_TOKEN || "";
const COURSE_MODE = process.env.COURSE_MODE || "verified";

// Basic helper to log with timestamp
function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

// Express config
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

console.log(PAYMENT_TOKEN)

// =======================
// Helper: call LMS APIs
// =======================

function lmsHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  if (PAYMENT_TOKEN) {
    headers["X-CUSC-PAYMENT-TOKEN"] = PAYMENT_TOKEN;
  }
  return headers;
}

async function lookupUser(username) {
  if (!username) {
    throw new Error("Thiếu username để tra cứu user");
  }
  const url = `${LMS_BASE}/api/cusc-edx-api/users/lookup/?username=${encodeURIComponent(
    username
  )}`;
  log("CALL LMS users.lookup:", url);
  const res = await axios.get(url, { headers: lmsHeaders() });
  const data = res.data;

  if (!data.count || data.count < 1) {
    throw new Error(`Không tìm thấy user với username="${username}"`);
  }
  const user = data.results[0];
  if (!user.is_active) {
    throw new Error(
      `User "${username}" tồn tại nhưng đang bị khóa (is_active=false)`
    );
  }
  return user;
}

async function fetchCoursePricing(courseId, mode) {
  if (!courseId) {
    throw new Error("Thiếu course_id để tra cứu pricing");
  }
  const encodedCourseId = encodeURIComponent(courseId);
  const queryMode = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  const url = `${LMS_BASE}/api/cusc-edx-api/course-pricing/${encodedCourseId}/${queryMode}`;
  log("CALL LMS course-pricing:", url);
  const res = await axios.get(url, { headers: lmsHeaders() });
  const data = res.data;

  if (!data.modes || data.modes.length === 0) {
    throw new Error(`Không tìm thấy pricing cho course "${courseId}"`);
  }

  let chosen;
  if (mode) {
    chosen = data.modes.find((m) => m.mode_slug === mode);
    if (!chosen) {
      throw new Error(
        `Không tìm thấy pricing với mode="${mode}" cho course "${courseId}"`
      );
    }
  } else {
    // fallback: ưu tiên verified nếu không truyền mode
    chosen =
      data.modes.find((m) => m.mode_slug === "verified") || data.modes[0];
  }

  return {
    courseId: data.course_id || courseId,
    mode: chosen.mode_slug,
    displayName: chosen.mode_display_name,
    currency: chosen.currency,
    price: chosen.price, // chuỗi, ví dụ "1200000.00"
    raw: chosen,
  };
}

async function createOrderInLms({
  courseId,
  username,
  userId,
  amount,
  currency,
  nextUrl,
}) {
  const url = `${LMS_BASE}/api/cusc-edx-api/orders/create/`;
  const externalOrderId = `NODE-DEMO-${Date.now()}`;

  const body = {
    course_id: courseId,
    amount: amount,
    currency: currency,
    external_order_id: externalOrderId,
    username: username,
    extra_data: {
      source: "node-demo",
      next: nextUrl || null,
    },
  };

  if (userId) {
    body.user_id = userId;
  }

  log("CALL LMS orders.create:", url, "BODY:", body);
  const res = await axios.post(url, body, { headers: lmsHeaders() });

  return res.data;
}

async function markOrderPaid(orderId) {
  const url = `${LMS_BASE}/api/cusc-edx-api/orders/${orderId}/status/`;

  const body = {
    status: "paid",
    payment_info: {
      gateway: "demo-gateway",
      note: "Thanh toán giả lập từ Node.js demo app",
    },
  };

  log("CALL LMS orders.status (paid):", url, "BODY:", body);
  const res = await axios.post(url, body, { headers: lmsHeaders() });
  return res.data;
}

// =======================
// Routes
// =======================

app.get("/", (req, res) => {
  res.send(
    "Node payment demo is running. Truy cập /checkout với query thích hợp."
  );
});

/**
 * Demo checkout:
 *
 * Ví dụ URL được LMS redirect sang:
 *   http://localhost:3000/checkout?course_id=course-v1%3ACTU%2BCT100%2B2025_T3&user=student01&next=http%3A%2F%2Flocal.openedx.io%2Fcourses%2Fcourse-v1%3ACTU%2BCT100%2B2025_T3%2Fabout
 */
app.get("/checkout", async (req, res) => {
  const courseId = req.query.course_id;
  const username = req.query.user;
  const nextUrl = req.query.next;

  log(">> /checkout params:", { courseId, username, nextUrl });

  if (!courseId || !username || !nextUrl) {
    return res
      .status(400)
      .send("Thiếu course_id, user hoặc next trong query string.");
  }

  try {
    // 1) Tra cứu user
    const user = await lookupUser(username);

    // 2) Tra cứu pricing
    const pricing = await fetchCoursePricing(courseId, COURSE_MODE);

    // 3) Tạo order "pending" trong LMS
    const order = await createOrderInLms({
      courseId,
      username,
      userId: user.id,
      amount: pricing.price,
      currency: pricing.currency,
      nextUrl,
    });

    // 4) Render trang thanh toán demo
    res.render("checkout", {
      title: "Demo Thanh Toán CUSC",
      courseId,
      username,
      user,
      pricing,
      order,
      nextUrl,
      lmsBase: LMS_BASE,
    });
  } catch (err) {
    log("ERROR trong /checkout:", err.message);
    const detail = err.response && err.response.data ? err.response.data : null;
    return res.status(500).render("error", {
      title: "Lỗi khi chuẩn bị thanh toán",
      message: err.message || "Đã xảy ra lỗi không xác định.",
      detail,
    });
  }
});

/**
 * POST /simulate-success
 *
 * Body JSON: { orderId, nextUrl }
 * - Gọi LMS orders/<id>/status với status="paid"
 * - Trả JSON để client redirect về nextUrl
 */
app.post("/simulate-success", async (req, res) => {
  const { orderId, nextUrl } = req.body || {};

  if (!orderId) {
    return res.status(400).json({
      ok: false,
      error: "Thiếu orderId trong body",
    });
  }

  try {
    const result = await markOrderPaid(orderId);
    return res.json({
      ok: true,
      redirect: nextUrl || null,
      lmsResult: result,
    });
  } catch (err) {
    log("ERROR trong /simulate-success:", err.message);
    const detail = err.response && err.response.data ? err.response.data : null;
    return res.status(500).json({
      ok: false,
      error: err.message || "Lỗi khi cập nhật trạng thái order",
      detail,
    });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send("Not found.");
});

app.listen(PORT, () => {
  log(`Node payment demo listening on http://localhost:${PORT}`);
  log(`LMS_BASE = ${LMS_BASE}`);
});
