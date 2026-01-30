const crypto = require("crypto");
const https = require("https");
const momoConfig = require("../config/momo").sandbox;

/**
 * =========================
 * 1. HÀM KÝ CHUNG (DÙNG LẠI)
 * =========================
 */
function signSHA256(rawSignature, secretKey) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
}

/**
 * =================================
 * 2. TẠO THANH TOÁN (CREATE PAYMENT)
 * =================================
 */
function buildCreateRawSignature({
  accessKey,
  amount,
  extraData,
  ipnUrl,
  orderId,
  orderInfo,
  partnerCode,
  redirectUrl,
  requestId,
  requestType,
}) {
  return (
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`
  );
}

async function createMoMoPayment({
  orderId,
  amount,
  redirectUrl,
  ipnUrl,
  orderInfo = "Thanh toán khóa học",
}) {
  const requestId = orderId;
  const requestType = "payWithMethod";
  const extraData = "";
  const autoCapture = true;
  const lang = "vi";

  const rawSignature = buildCreateRawSignature({
    accessKey: momoConfig.accessKey,
    amount,
    extraData,
    ipnUrl,
    orderId,
    orderInfo,
    partnerCode: momoConfig.partnerCode,
    redirectUrl,
    requestId,
    requestType,
  });

  const signature = signSHA256(rawSignature, momoConfig.secretKey);

  const requestBody = JSON.stringify({
    partnerCode: momoConfig.partnerCode,
    partnerName: "CUSC Test",
    storeId: "CUSCStore",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang,
    requestType,
    autoCapture,
    extraData,
    signature,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      momoConfig.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const data = JSON.parse(body);
          if (data.resultCode !== 0) {
            return reject(new Error(data.message || "MoMo create failed"));
          }
          resolve(data); // có payUrl
        });
      },
    );

    req.on("error", reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * ======================================
 * 3. VERIFY KẾT QUẢ (RETURN / IPN)
 * ======================================
 */
function buildVerifyRawSignature(query) {
  const {
    amount,
    extraData = "",
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    payType,
    requestId,
    responseTime,
    resultCode,
    transId,
  } = query;

  return (
    `accessKey=${momoConfig.accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&message=${message}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&orderType=${orderType}` +
    `&partnerCode=${partnerCode}` +
    `&payType=${payType}` +
    `&requestId=${requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=${resultCode}` +
    `&transId=${transId}`
  );
}

function verifyMoMoSignature(query) {
  if (!query.signature) return false;

  const rawSignature = buildVerifyRawSignature(query);
  const expectedSignature = signSHA256(rawSignature, momoConfig.secretKey);

  return query.signature === expectedSignature;
}

module.exports = {
  createMoMoPayment,
  verifyMoMoSignature,
};
