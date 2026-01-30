const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

function environment() {
  return new checkoutNodeJssdk.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET,
  );
}

function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

function convertToPaypalAmount(amount, currency) {
  //Dung chuan USD moi duoc
  if (currency === "VND" || currency == "vnd") {
    return {
      currency_code: "USD",
      value: (Number(amount) / 24000).toFixed(2),
    };
  }

  return {
    currency_code: "USD",
    value: Number(amount).toFixed(2),
  };
}

module.exports = {
  paypalClient: { client },
  checkoutNodeJssdk,
  convertToPaypalAmount,
};
