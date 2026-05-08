# 🌌 Azure Cloud Image Gallery

Ứng dụng quản lý ảnh hiện đại (Upload & Gallery) được xây dựng để thực hành và trải nghiệm các dịch vụ trong hệ sinh thái **Azure Cloud**.

## 🚀 Hướng dẫn khởi chạy nhanh (Dành cho Team)

Dự án đã được container hóa hoàn toàn bằng Docker. Bạn không cần cài đặt .NET hay Angular thủ công.

1. **Yêu cầu**: Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. **Khởi chạy**: Mở terminal tại thư mục gốc dự án và chạy:
   ```bash
   docker-compose up -d --build
   ```
3. **Truy cập**:
   *   **Frontend**: [http://localhost:8080](http://localhost:8080)
   *   **Backend API**: [http://localhost:5000/api/images](http://localhost:5000/api/images)
   *   **Swagger UI**: [http://localhost:5000/swagger](http://localhost:5000/swagger)

---

## ✨ Điểm nổi bật (Latest Update)

### 1. Giao diện Premium (Glassmorphism)
- **Thiết kế mờ kính**: Sử dụng `backdrop-filter` tạo chiều sâu và vẻ hiện đại.
- **Micro-animations**: Hiệu ứng chuyển động mượt mà cho Modal, Card và nút bấm.
- **Layout ổn định**: Khắc phục hiện tượng xê dịch giao diện (layout shift) bằng `scrollbar-gutter`.

### 2. Chế độ Demo thông minh (Virtual Storage)
- **Real-time In-Memory Storage**: Cho phép upload và hiển thị ảnh thực tế ngay lập tức mà không cần Cloud (lưu tạm trong RAM).
- **Virtual Content Server**: Backend tự đóng vai trò là một "kho lưu trữ tạm thời", phục vụ ảnh qua endpoint chuyên dụng.

---

## 🏗️ Kiến trúc ứng dụng

### 1. Frontend (Angular 19+)
- **Standalone Components**: Không dùng NgModule, giúp code gọn nhẹ và hiện đại.
- **Real-time UI**: Sử dụng RxJS Subject để cập nhật Gallery ngay lập tức khi upload xong.
- **DomSanitizer Integration**: Xử lý an toàn các nguồn dữ liệu ảnh động.

### 2. Backend (.NET 10 Minimal API)
- **Minimal API**: Hiệu năng cao, cấu hình tối giản.
- **In-Memory Logic**: Đã chuẩn bị sẵn các "điểm chờ" (Guide comments) để tích hợp Azure Blob, AI Vision và Cosmos DB.

---

## ☁️ Roadmap triển khai Azure (Dành cho Team Cloud)

Code xử lý đã được chuẩn bị sẵn các hướng dẫn chi tiết trong `backend/Program.cs`.

### 1. Azure Blob Storage (Lưu trữ ảnh)
- **Nhiệm vụ**: Thay thế RAM bằng lưu trữ vật lý trên Cloud.
- **Hướng dẫn**: Xem tại block comment `☁️ GUIDE: ĐĂNG KÝ AZURE SERVICES` trong code backend.

### 2. Azure AI Vision (Tự động gán nhãn)
- **Nhiệm vụ**: Tự động phân tích nội dung ảnh (AI-powered tagging).

### 3. Azure Cosmos DB (Lưu Metadata)
- **Nhiệm vụ**: Lưu thông tin ảnh vĩnh viễn.

---

## 🛠️ Cấu trúc thư mục
- `/frontend`: Mã nguồn Angular (SCSS, TS, HTML).
- `/backend`: Mã nguồn .NET 10 Minimal API.
- `/terraform`: Các file hạ tầng IaC.
- `docker-compose.yml`: File cấu hình chạy toàn bộ hệ thống.

---
*Chúc nhóm hoàn thành xuất sắc dự án Azure Fundamental!*
