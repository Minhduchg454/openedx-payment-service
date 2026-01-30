export async function fetchCheckoutData() {
  //Lay query string tren url goi api den backend
  const params = window.location.search;
  const res = await fetch(`/api/checkout-data${params}`);
  if (!res.ok) throw new Error("Không lấy được dữ liệu checkout");
  return res.json();
}

export async function simulateSuccess(orderId, nextUrl) {
  const res = await fetch("/api/simulate-success", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, nextUrl }),
  });
  return res.json();
}

export async function apiCreateVNPayPayment(data) {
  const res = await fetch("/api/vnpay/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Create VNPay payment failed");
  }
  return res.json();
}

// Lấy kết quả thanh toán theo orderId
export async function fetchOrderResult(orderId) {
  if (!orderId) {
    throw new Error("Thiếu orderId");
  }

  const res = await fetch(`/api/order-result/${orderId}`);

  if (!res.ok) {
    throw new Error("Không lấy được kết quả thanh toán");
  }

  return res.json();
}

// Tạo order thanh toán
export async function createOrder(data) {
  const res = await fetch("/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Tạo order thất bại");
  }

  return res.json();
}

//PayPal
export async function apiCreatePaypalPayment(data) {
  const res = await fetch("/api/paypal/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Create PayPal payment failed");
  }

  return res.json(); // { approveUrl }
}

// momo
export async function apiCreateMoMoPayment(data) {
  const res = await fetch("/api/momo/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Create MoMo payment failed");
  }

  return res.json(); // { redirectUrl }
}
