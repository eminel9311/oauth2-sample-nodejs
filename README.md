# 🔐 OAuth2 Demo với Super-Cute-App

Đây là hệ thống demo OAuth2 sử dụng Authorization Code Flow với 2 phần:

- `super-cute-app`: OAuth2 Server viết bằng Node.js + Express + oauth2orize
- `client-app`: Ứng dụng frontend React (Vite) với nút "Đăng nhập bằng super-cute-app"

---

## 🧠 Luồng hoạt động (Authorization Code Flow)

1. **Client app** hiển thị nút: `Đăng nhập bằng super-cute-app`.
2. Người dùng click → redirect tới `http://localhost:3000/oauth2/authorize?...`
3. Server hiển thị giao diện đăng nhập vào hệ thống oauth2, người dùng nhập thông tin username/password
4. Server hiển thị giao diện xác nhận quyền truy cập. 
5. Người dùng xác nhận quyền truy cập.(allow or deny)
6. Người dùng cho phép → server redirect về `http://localhost:5173/callback?code=...`
7. Client dùng `code` để đổi lấy `access_token` qua `/oauth2/token`.
8. Dùng `access_token` để gọi các API bảo vệ.

## ## 🧩 Cấu trúc thư mục

```
project-root/
├── super-cute-app/ # OAuth2 Server
│ ├── models/
│ ├── config/oauth2.js
│ ├── routes/index.js
│ ├── .env
│ └── server.js
└── client-app/ # React Client (Vite)
├── src/
│ ├── App.jsx
│ └── main.jsx
├── vite.config.js
└── index.html
```

## 🚀 Hướng dẫn cài đặt và chạy

### 🐳 Chuẩn bị MongoDB bằng Docker

1. Tạo file `.env` trong thư mục `oauth-server-nodejs` (xem ví dụ ở trên).
2. Chạy lệnh sau để khởi động MongoDB:
   ```bash
   cd oauth-server-nodejs
   docker-compose up -d
   ```
3. Sau khi MongoDB đã chạy, tiếp tục các bước cài đặt và chạy server như hướng dẫn phía trên.

### 1. Cài đặt và chạy OAuth2 Server

```bash
# Di chuyển vào thư mục server
cd oauth-server-nodejs

# Cài đặt dependencies
npm install

# Chạy server ở chế độ development
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

### 2. Cài đặt và chạy Client App

```bash
# Di chuyển vào thư mục client
cd oauth2-client

# Cài đặt dependencies
npm install

# Chạy client app
npm run dev
```

Client app sẽ chạy tại `http://localhost:5173`

### 3. Kiểm tra

1. Truy cập: http://localhost:5173

2. Bấm nút 🔐 Đăng nhập bằng super-cute-app

3. Bạn sẽ được redirect đến trang để login vào hệ thống Oauth2

4. Nhập thông tin username/password

5. Bấm "Allow Access" → quay lại client

6. Xem thông tin được trả về từ hệ thống Oauth2

### 4. Demo

## ![alt](https://i.uimgfree.com/file/W2QOH2M05B.png)

## ![alt](https://i.uimgfree.com/file/T6NOJTVED8.png)

## ![alt](https://i.uimgfree.com/file/41288YD11A.png)

![alt](https://i.uimgfree.com/file/0HILDGXQHH.png)
