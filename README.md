# Payment service

## Install library for backend and frontend

### Backend
```bash
cd backend
npm i
```

### Frontend
```bash
cd frontend
npm i
```

### Create .env for backend
```bash
cd backend
nano .env
```
Copy && paste

```bash
# Port where this demo server will listen
PORT=3000

# Base URL of LMS (Tutor/Open edX)
LMS_BASE=http://local.openedx.io:8000

# Shared secret between Node.js and LMS (X-CUSC-PAYMENT-TOKEN)
CUSC_PAYMENT_API_TOKEN=123

# Default course mode when looking up pricing (usually "verified")
COURSE_MODE=verified

# VNPay Sandbox Config
VNP_TMN_CODE=[]
VNP_HASH_SECRET=[]
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

#callback URLs - bạn sẽ dùng ngrok public URL thay cho localhost 
# khi test trên môi trường localhost -> chay terminal: ngrok http 3000
CLIENT_URL=http://localhost:3000
VNP_RETURN_URL=http://localhost:3000/vnpay_return
VNP_IPN_URL=http://localhost:3000/vnpay_ipn


#Paypal
PAYPAL_CLIENT_ID=[]
PAYPAL_CLIENT_SECRET=[]

#MoMo
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=[]
MOMO_SECRET_KEY=[]
```


## How to use
1. Build react frontend
```bash
cd frontend
npm run build
```
2. Run tutor dev
open new terminal
```bash
tutor dev start
```
3. Run backend
open new terminal
```bash
cd backend
npm start
```
4. Done

