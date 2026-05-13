#!Stage1: Build từ image gốc
FROM node:20-alpine as build-stage
# Đặt thư mục làm việc bên trong container app
WORKDIR /app
# Copy file cấu hình
COPY package*.json ./
# Cài đặt thư viện cần thiết
RUN npm install
# Copy toàn bộ code
COPY . .
# Build dự án để tạo file dist
RUN npm run build

#!Stage2: Dùng Nginx để serve frontend
FROM nginx:stable-alpine

# Copy file config.conf thay cho file default của Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy tệp tin đã build từ stage 1 vào thư mục phục vụ của Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Mở cổng 80
EXPOSE 80
# Chạy Nginx
CMD ["nginx", "-g", "daemon off;"]