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

Ứng dụng đang chạy ở chế độ **Demo Offline**:
- **Lưu trữ**: Ảnh được lưu tạm thời vào Dictionary trong RAM của Backend.
- **Phục vụ ảnh**: Backend cung cấp ảnh qua endpoint `/api/images/{id}/content`.
- **AI Tagging**: Tags được giả lập (Random) để demo giao diện.
- **Lưu ý**: Dữ liệu sẽ mất sau khi restart container.

---

## ☁️ Hướng dẫn chi tiết triển khai 7 dịch vụ Azure (Step-by-Step)

Team Cloud thực hiện theo các bước sau để chuyển đổi từ Demo sang Cloud thật:

### 1. Azure Blob Storage (Lưu trữ ảnh)
*   **Bước 1**: Tạo `Storage Account` trên Azure Portal.
*   **Bước 2**: Vào mục **Containers** -> Tạo container tên `images`.
*   **Bước 3**: Chỉnh **Change Access Level** của container `images` thành `Blob` (để Frontend có thể xem ảnh qua URL).
*   **Bước 4**: Vào **Access Keys** -> Copy `Connection String`.
*   **Bước 5**: Dán vào `Azure:BlobStorage:ConnectionString` trong `appsettings.json`.
*   **Bước 6**: Trong `Program.cs`, uncomment đoạn code liên quan đến `BlobServiceClient` và `UploadAsync`.

### 2. Azure AI Vision (Tự động gán nhãn)
*   **Bước 1**: Tạo tài nguyên `Computer Vision` hoặc `Azure AI Services`.
*   **Bước 2**: Lấy `Key` và `Endpoint` từ mục **Keys and Endpoint**.
*   **Bước 3**: Dán vào `Azure:AIVision` trong `appsettings.json`.
*   **Bước 4**: Trong `Program.cs`, uncomment đoạn code gọi `visionClient.AnalyzeAsync`.

### 3. Azure Cosmos DB (Lưu Metadata vĩnh viễn)
*   **Bước 1**: Tạo `Azure Cosmos DB for NoSQL`.
*   **Bước 2**: Tạo Database tên `ImageGallery` và Container tên `Metadata` (Partition key là `/id`).
*   **Bước 3**: Lấy `Endpoint` và `Primary Key` dán vào `appsettings.json`.
*   **Bước 4**: Thay thế logic lưu vào `imageMetadataList` bằng `container.CreateItemAsync()`.

### 4. Azure Functions (Xử lý Thumbnail)
*   **Bước 1**: Tạo project `Azure Function` trong VS Code hoặc Visual Studio.
*   **Bước 2**: Chọn template `Blob Trigger`, trỏ vào path `images/{name}`.
*   **Bước 3**: Viết code resize ảnh và lưu vào container `thumbnails`.
*   **Bước 4**: Deploy lên Azure Function App.

### 5. Azure Key Vault (Bảo mật thông tin)
*   **Bước 1**: Tạo `Key Vault`.
*   **Bước 2**: Vào **Secrets** -> Tạo các secret cho ConnectionString, Keys.
*   **Bước 3**: Trong code Backend, sử dụng gói `Azure.Extensions.AspNetCore.Configuration.Secrets` để load cấu hình trực tiếp từ Vault.

### 4. Azure Application Insights (Giám sát)
*   **Bước 1**: Tạo tài nguyên `Application Insights`.
*   **Bước 2**: Lấy `ConnectionString` dán vào `appsettings.json`.
*   **Bước 3**: Backend sẽ tự động đẩy log lên nhờ cấu hình `AddApplicationInsightsTelemetry()`.

### 7. Azure Static Web Apps (Hosting Frontend)
*   **Bước 1**: Push code lên GitHub.
*   **Bước 2**: Tạo `Static Web App` trên Azure, chọn Repo và nhánh `master`.
*   **Bước 3**: Build Presets: Chọn `Angular`.
*   **Bước 4**: App location: `/frontend`, Output location: `dist/frontend/browser`.
*   **Bước 5**: Chờ GitHub Actions hoàn tất và truy cập URL của Azure cung cấp.

---

## 🛠️ Cấu trúc dự án
- `/frontend`: Angular 19+ (SCSS, Standalone).
- `/backend`: .NET 10 Minimal API.
- `/terraform`: Infrastructure as Code (IaC).

---
*Dự án hoàn thành bởi Team Azure Fundamental.*
