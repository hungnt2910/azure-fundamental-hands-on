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

## 💡 Chế độ Demo hiện tại (In-Memory Mode)

Hiện tại, ứng dụng đang chạy ở chế độ **Demo Offline** để nhóm có thể test luồng ngay lập tức mà không cần tài khoản Azure:
- **Lưu trữ ảnh**: Ảnh được đọc thành byte array và lưu trực tiếp vào RAM của Backend (Dictionary). 
- **Phục vụ ảnh**: Backend đóng vai trò như một Image Server, cung cấp ảnh qua endpoint `/api/images/{id}/content`.
- **AI Tagging**: Tags được giả lập (Random) sau khi upload thành công để demo giao diện Grid.
- **Lưu ý**: Dữ liệu sẽ mất sạch sau khi bạn restart hoặc build lại Docker container.

---

## ☁️ Roadmap triển khai 7 dịch vụ Azure

Để chuyển sang dùng Azure thật, Team Cloud cần lưu ý các hướng dẫn sau trong code `backend/Program.cs`:

### 1. Azure Blob Storage (Lưu trữ ảnh vật lý)
- **Nhiệm vụ**: Thay thế việc lưu ảnh vào RAM bằng Cloud Storage.
- **Lưu ý**: Cần tạo Container tên `images` với quyền truy cập "Blob" hoặc dùng SAS Token để Frontend hiển thị được ảnh.

### 2. Azure AI Vision (Tự động gán nhãn AI)
- **Nhiệm vụ**: Thay thế logic Random Tags bằng AI thực tế từ Microsoft.
- **Lưu ý**: Cần tài nguyên `Computer Vision` hoặc `Cognitive Services` trên Azure.

### 3. Azure Cosmos DB (Lưu Metadata vĩnh viễn)
- **Nhiệm vụ**: Lưu thông tin ảnh (ID, Name, Tags, URL) vào NoSQL để không bị mất khi restart server.
- **Lưu ý**: Sử dụng SQL API cho Cosmos DB để tương thích tốt nhất với code mẫu.

### 4. Azure Functions (Xử lý Thumbnail tự động)
- **Nhiệm vụ**: Tự động tạo ảnh nhỏ ngay khi ảnh gốc được upload lên Blob.
- **Lưu ý**: Triển khai theo dạng `Blob Trigger`.

### 5. Azure Key Vault (Bảo mật tuyệt đối)
- **Nhiệm vụ**: Lưu trữ Connection Strings, Key. Không bao giờ được push Key lên GitHub.
- **Lưu ý**: Tích hợp `DefaultAzureCredential` trong code Backend để lấy secret từ Vault.

### 6. Azure Application Insights (Giám sát hệ thống)
- **Nhiệm vụ**: Theo dõi log, hiệu năng và lỗi của cả FE và BE.
- **Lưu ý**: Cấu hình `InstrumentationKey` trong `appsettings.json`.

### 7. Azure Static Web Apps (Hosting Frontend)
- **Nhiệm vụ**: Đưa ứng dụng lên internet với chi phí 0đ.
- **Lưu ý**: Kết nối với GitHub Repo để Azure tự động build & deploy mỗi khi push code.

---

## 🏗️ Kiến trúc & Công nghệ
- **Frontend**: Angular 19+, Glassmorphism UI, Real-time RxJS.
- **Backend**: .NET 10 Minimal API, Multi-upload support.
- **Infrastructure**: Terraform (IaC ready).

---
*Dự án được xây dựng cho mục đích học tập Azure Fundamental.*
