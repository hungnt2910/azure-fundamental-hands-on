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

### 6. Azure Application Insights (Giám sát)
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

## 🛠️ Chi tiết triển khai Kỹ thuật (FE & BE)

Dưới đây là chi tiết các luồng xử lý và kỹ thuật đã được hiện thực hóa trong dự án:

### 1. Backend (.NET 10 Minimal API)
Toàn bộ logic backend tập trung tại file `backend/Program.cs` để tối ưu hóa hiệu năng và dễ dàng bảo trì.

**Các luồng xử lý chính (Flows):**
*   **Luồng Upload Ảnh (`POST /api/images`):**
    1.  Nhận file từ Client qua `multipart/form-data`.
    2.  **Lưu trữ tạm (In-memory):** Đọc dữ liệu binary (`byte[]`) và lưu vào `imageDataStore` (kiểu `Dictionary`) trong RAM.
    3.  **Định danh:** Sử dụng `Guid.NewGuid()` để tạo ID duy nhất.
    4.  **Giả lập AI Vision:** Sử dụng `Random` để chọn 3 nhãn ngẫu nhiên, sẵn sàng thay thế bằng `ImageAnalysisClient` của Azure.
    5.  **Phản hồi:** Trả về metadata của ảnh cho Client.
*   **Luồng Phục vụ Ảnh (`GET /api/images/{id}/content`):**
    *   Sử dụng `Results.File()` để trả về nội dung ảnh từ RAM dựa trên ID, giúp FE hiển thị ảnh ổn định.
*   **Luồng Lấy danh sách (`GET /api/images`):**
    *   Truy xuất từ `imageMetadataList` và sắp xếp theo thời gian (`OrderByDescending`).

### 2. Frontend (Angular 19+)
Giao diện được module hóa thành các Component standalone tại thư mục `frontend/src/app/components`.

**Kiến trúc và Luồng xử lý:**
*   **Quản lý State và API (`frontend/src/app/services/image.ts`):**
    *   `ImageService` đóng vai trò trung tâm điều phối dữ liệu.
    *   Sử dụng **RxJS Subject** (`imageUploadedSubject`) để phát tín hiệu cập nhật toàn ứng dụng.
*   **Luồng Đẩy ảnh (`frontend/src/app/components/upload/`):**
    *   `upload.ts`: Xử lý logic chọn file, Drag & Drop (`onDrop`) và gọi service upload.
    *   `upload.html`: Giao diện vùng drop-zone và danh sách file chờ.
*   **Luồng Hiển thị và Preview (`frontend/src/app/components/gallery/`):**
    *   `gallery.ts`: Đăng ký nhận dữ liệu từ `ImageService`. Khi có ảnh mới, nó được tự động thêm vào mảng `images` để hiển thị tức thì.
    *   **Modal Preview:** Logic `openPreview` quản lý trạng thái hiển thị ảnh phóng to và khóa cuộn trang (`document.body.style.overflow`).
    *   `gallery.html`: Sử dụng `*ngFor` để render danh sách ảnh và cấu trúc modal preview.

**Thiết kế (UI/UX):**
*   **Layout Tổng thể (`frontend/src/app/app.html`):** Sử dụng cấu trúc container chia hai cột (Upload & Gallery).
*   **CSS/SCSS (`gallery.scss` & `upload.scss`):** Sử dụng Flexbox, Grid và các hiệu ứng Glassmorphism để tạo cảm giác cao cấp.

---

## 🛠️ Cấu trúc dự án
- `/frontend`: Angular 19+ (SCSS, Standalone).
- `/backend`: .NET 10 Minimal API.
- `/terraform`: Infrastructure as Code (IaC).

---
*Dự án hoàn thành bởi Team Azure Fundamental.*
