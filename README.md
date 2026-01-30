# Payment service
A standalone Payment Service for integrating external payment gateways with Open edX (Tutor).  
The system consists of a Node.js backend and a React frontend, communicating with the LMS via APIs to create orders, process payments, and enroll learners after successful transactions.

## Features
- Create and manage payment orders for Open edX.  
- Supported payment gateways (Sandbox environments):  
  - VNPay  
  - PayPal  
  - MoMo  
- Automatic order status update and course enrollment after successful payment.  
- Simple, extensible checkout UI.  
- Designed for development, demo, and research environments.  

## Payment Flow Overview
1.	LMS redirects the user to the checkout page
2.	Frontend requests the backend to:  
    •	Create an order in Open edX  
    •	Initialize payment with the selected gateway  
3.	User completes payment on the third-party gateway
4.	Backend processes return/IPN callbacks
5.	Order is marked as paid and the learner is enrolled in the course

## Project Structure
openedx-payment-service/  
├── backend/        # Node.js payment service  
├── frontend/       # React checkout UI  
└── README.md  


## Requirements
Node.js ≥ 18  
npm  
Tutor (Open edX Devstack)  

## Installation
### 1. Install dependencies

#### Backend
```bash
cd backend
npm i
```

#### Frontend
```bash
cd frontend
npm i
```

### 2. Backend Configuration
Create .env file
```bash
cd backend
nano .env
```
Copy and adjust the following configuration:

```bash
# Server
PORT=3000

# Open edX LMS base URL
LMS_BASE=http://local.openedx.io:8000

# Shared secret between LMS and Payment Service
CUSC_PAYMENT_API_TOKEN=123

# Default course mode
COURSE_MODE=verified

# ======================
# VNPay (Sandbox)
# ======================
VNP_TMN_CODE=
VNP_HASH_SECRET=
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# Callback URLs
# When testing locally, use ngrok:
#   ngrok http 3000
CLIENT_URL=http://localhost:3000
VNP_RETURN_URL=http://localhost:3000/vnpay_return
VNP_IPN_URL=http://localhost:3000/vnpay_ipn

# ======================
# PayPal (Sandbox)
# ======================
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# ======================
# MoMo (Sandbox)
# ======================
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
```
⚠️ Notes: Do not commit .env files to the repository.

## How to use
1. Build the frontend
```bash
cd frontend
npm run build
```
2. Start Open edX (Tutor), open a new terminal:
```bash
tutor dev start
```
3. Ensure the LMS is accessible at:
```bash
http://local.openedx.io:8000
```

4. Start the payment backend, open another terminal:
```bash
cd backend
npm start
```
5. The backend will be available at:
```bash
http://localhost:3000
```

6. Access the checkout page

## Sandbox Notes
- PayPal: Full-featured sandbox, requires only test accounts
- VNPay / MoMo: Sandbox credentials must be provided by the payment provider
- MoMo Production: Requires a registered business entity

