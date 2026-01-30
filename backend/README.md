# CUSC Node Payment Demo

Demo ứng dụng Node.js giả lập thanh toán để tích hợp với LMS (Tutor / Open edX)
thông qua các API trong `cusc_edx_api`.

## 1. Yêu cầu

- Node.js 18+
- Đã chạy LMS (Tutor) ở `http://local.openedx.io:8000` và đã cài app `cusc_edx_api`.
- Đã cấu hình `CUSC_PAYMENT_API_TOKEN` trong LMS (hoặc để trống để chạy DEV).
- Đã tạo course, user, và pricing (`CourseMode`) giống như trong tài liệu.

## 2. Cấu trúc thư mục

```text
node-payment-demo/
├── package.json
├── server.js
├── .env.example
├── views/
│   ├── checkout.ejs
│   └── error.ejs
```

## 3. Cài đặt

```bash
cd node-payment-demo
npm install
```

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Mở `.env` và chỉnh:

```env
LMS_BASE=http://local.openedx.io:8000
CUSC_PAYMENT_API_TOKEN=<GIỐNG VỚI CẤU HÌNH Ở LMS>
COURSE_MODE=verified
PORT=3000
```

> Lưu ý: nếu trong LMS bạn chưa set `CUSC_PAYMENT_API_TOKEN`, thì Node vẫn gửi
> header nhưng phía LMS sẽ bỏ qua (chế độ DEV). Khi đưa lên môi trường thật,
> bắt buộc phải đặt secret mạnh và giống nhau ở cả Node và LMS.


## 4. Chạy demo

```bash
npm start
```

Server sẽ chạy ở `http://localhost:3000`.

Bạn có thể test nhanh:

```bash
curl http://localhost:3000/
```

Nếu thấy "Node payment demo is running..." là OK.

## 5. Cách LMS gọi sang Node

Phía LMS (template/tutor plugin) bạn sẽ có 1 nút "Thanh toán", ví dụ chuyển hướng tới:

```text
http://localhost:3000/checkout?course_id=course-v1%3ACTU%2BCT100%2B2025_T3&user=student01&next=http%3A%2F%2Flocal.openedx.io%2Fcourses%2Fcourse-v1%3ACTU%2BCT100%2B2025_T3%2Fabout
```

Tức là:

- `course_id`: URL-encoded của course key.
- `user`: username của học viên.
- `next`: URL course/about để redirect về sau khi thanh toán xong.

## 6. Flow xử lý trong Node

Khi truy cập `/checkout`:

1. Node đọc `course_id`, `user`, `next` từ query string.
2. Gọi API LMS:
   - `GET /api/cusc-edx-api/users/lookup/?username=...`
   - `GET /api/cusc-edx-api/course-pricing/<course_id>/?mode=verified`
3. Nếu user và pricing hợp lệ:
   - Gọi `POST /api/cusc-edx-api/orders/create/` để tạo order `pending` trong LMS.
   - Render file `views/checkout.ejs` với thông tin order, course, user, price.
4. Giao diện `checkout.ejs` hiển thị 1 nút **"Giả lập thanh toán thành công"**.
5. Khi nhấn nút này:
   - JS trên trang gọi `POST /simulate-success`.
   - Backend Node gọi `POST /api/cusc-edx-api/orders/<order_id>/status/` với
     body `{ "status": "paid", "payment_info": {...} }`.
   - LMS cập nhật trạng thái order, enroll user vào course (mode verified).
   - Node trả về JSON, JS trên client redirect về `next` (URL course).

Toàn bộ các endpoint phía LMS đều tuân theo tài liệu `cusc_edx_api - HƯỚNG DẪN CÁC API ECOMMERCE`:
- `users.lookup`
- `course-pricing`
- `orders.create`
- `orders.status`
- ...

## 7. Debug

- Nếu `/checkout` bị lỗi:
  - Node sẽ render `views/error.ejs` kèm chi tiết trả về từ LMS (JSON).
- Nếu nút "Giả lập thanh toán" báo lỗi:
  - Xem khung "debug" ở dưới nút.
  - Đồng thời xem log Node.js và log LMS.

Một số chỗ nên kiểm tra:

- `CUSC_PAYMENT_API_TOKEN` ở Node và LMS có trùng nhau không?
- `course_id` có đúng dạng `course-v1:ORG+CODE+RUN` và đã được set pricing chưa?
- User (`student01`) có tồn tại, `is_active=true` không?

## 8. Dùng trong plugin Tutor

Bạn có thể embed đường dẫn checkout này vào template của LMS, ví dụ trong
`course_about.html` hoặc 1 view riêng trong plugin:

```html
<a
  class="btn btn-primary"
  href="http://localhost:3000/checkout?course_id={{ course.id|urlencode }}&user={{ request.user.username|urlencode }}&next={{ request.build_absolute_uri|urlencode }}"
>
  Thanh toán (demo Node.js)
</a>
```

Khi deploy thật, chỉ cần đổi `localhost:3000` thành domain của service Node
(có thể nằm sau reverse proxy Nginx / Traefik / v.v.).
