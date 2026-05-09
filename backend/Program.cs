using Microsoft.AspNetCore.Mvc;
using Azure.Storage.Blobs;
using Azure.AI.Vision.ImageAnalysis;
using Azure;
using Microsoft.Azure.Cosmos;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApplicationInsightsTelemetry();

/* 
 * ☁️ GUIDE: ĐĂNG KÝ AZURE SERVICES 
 * 1. Uncomment các dòng dưới đây sau khi đã cấu hình Connection String trong appsettings.json
 * 2. Cài đặt các NuGet package: Azure.Storage.Blobs, Azure.AI.Vision.ImageAnalysis
 */
// builder.Services.AddSingleton(x => new BlobServiceClient(builder.Configuration.GetConnectionString("AzureBlobStorage")));
// builder.Services.AddSingleton(x => new ImageAnalysisClient(new Uri(builder.Configuration["AzureAI:Endpoint"]), new AzureKeyCredential(builder.Configuration["AzureAI:Key"])));


// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy => policy.WithOrigins("http://localhost:4200", "http://localhost:8080")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials()); // Quan trọng cho SignalR
});

builder.Services.AddSignalR();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAngular");


// KHO LƯU TRỮ TRONG BỘ NHỚ (Dữ liệu sẽ mất khi restart server)
var imageMetadataList = new List<dynamic>
{
    new { id = "1", name = "Azure Landscape", url = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", tags = new[] { "nature", "azure" }, uploadedAt = DateTime.UtcNow },
    new { id = "2", name = "Tech Cloud", url = "https://images.unsplash.com/photo-1451187580459-43490279c0fa", tags = new[] { "cloud", "tech" }, uploadedAt = DateTime.UtcNow }
};

// Lưu trữ byte ảnh trong RAM để phục vụ demo
var imageDataStore = new Dictionary<string, (byte[] Data, string ContentType)>();

app.MapHub<ImageHub>("/hubs/images");

// API: Lấy danh sách ảnh
app.MapGet("/api/images", () =>
{
    return Results.Ok(imageMetadataList.OrderByDescending(x => x.uploadedAt));
});

// API: Phục vụ nội dung ảnh từ RAM
app.MapGet("/api/images/{id}/content", (string id) =>
{
    if (imageDataStore.TryGetValue(id, out var image))
    {
        return Results.File(image.Data, image.ContentType);
    }
    return Results.NotFound();
});

// API: Upload ảnh
app.MapPost("/api/images", async (HttpRequest request, HttpContext context, IHubContext<ImageHub> hubContext) =>
{
    if (!request.HasFormContentType) return Results.BadRequest("Invalid form content.");

    var form = await request.ReadFormAsync();
    var files = form.Files;
    if (files.Count == 0) return Results.BadRequest("No images uploaded.");

    var uploadedResults = new List<object>();
    var baseUrl = "http://localhost:5000"; 

    foreach (var file in files)
    {
        var id = Guid.NewGuid().ToString();
        
        // Đọc và lưu byte vào RAM
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var fileData = ms.ToArray();
        imageDataStore[id] = (fileData, file.ContentType);

        // Tạo URL trỏ về endpoint nội bộ
        string imageUrl = $"{baseUrl}/api/images/{id}/content";

        // Giả lập AI Vision phân tích tags
        var possibleTags = new[] { "azure", "cloud", "ai-vision", "demo", "landscape", "technology", "nature" };
        var random = new Random();
        var tags = possibleTags.OrderBy(x => random.Next()).Take(3).ToList();

        var newImage = new 
        { 
            id = id, 
            name = file.FileName, 
            url = imageUrl, 
            tags = tags,
            uploadedAt = DateTime.UtcNow 
        };
        
        imageMetadataList.Add(newImage);
        uploadedResults.Add(newImage);
    }

    // BROADCAST: Gửi thông báo tới TẤT CẢ các client đang kết nối
    await hubContext.Clients.All.SendAsync("ReceiveNewImages", uploadedResults);

    return Results.Ok(uploadedResults);
})
.DisableAntiforgery();

app.Run();

// Định nghĩa Hub cho SignalR
public class ImageHub : Microsoft.AspNetCore.SignalR.Hub { }
