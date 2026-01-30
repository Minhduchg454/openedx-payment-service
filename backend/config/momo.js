module.exports = {
  sandbox: {
    endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
  },
};
