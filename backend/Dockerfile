# syntax=docker/dockerfile:1.7
### Stage 1: cài deps
FROM node:22-alpine AS deps
WORKDIR /app
# Chỉ copy file khai báo để cache tốt hơn
COPY package*.json ./
# Nếu có package-lock.json sẽ dùng npm ci; nếu không có, dùng npm install
# (Bạn có thể giữ dòng ci; nếu không có lockfile, đổi thành `npm install --omit=dev`)
RUN --mount=type=cache,target=/root/.npm \
    sh -c 'if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi'

### Stage 2: runtime gọn nhẹ
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Dùng user không phải root + curl cho healthcheck (tuỳ chọn)
RUN adduser -S -D -H nodeuser && apk add --no-cache curl
# Copy node_modules từ stage deps
COPY --from=deps /app/node_modules ./node_modules
# Copy source (views, mã nguồn, .ejs, v.v.)
COPY . .
USER nodeuser
EXPOSE 3000
# Healthcheck tuỳ chọn: cần có endpoint /health; nếu bạn chưa có, bỏ 2 dòng này
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD curl -fsS http://localhost:3000/health || exit 1
# Chạy theo package.json -> "start": "node server.js"
CMD ["npm", "start"]
