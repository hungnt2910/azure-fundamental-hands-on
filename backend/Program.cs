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

builder.Services.AddSingleton(x =>
    new BlobServiceClient(
        builder.Configuration["Azure:BlobStorage:ConnectionString"]));
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


app.MapHub<ImageHub>("/hubs/images");

// API: Lấy danh sách ảnh
app.MapGet("/api/images", () =>
{
    return Results.Ok(imageMetadataList.OrderByDescending(x => x.uploadedAt));
});

// API: Phục vụ nội dung ảnh từ RAM
//app.MapGet("/api/images/{id}/content", (string id) =>
//{
//    if (imageDataStore.TryGetValue(id, out var image))
//    {
//        return Results.File(image.Data, image.ContentType);
//    }
//    return Results.NotFound();
//});

// API: Upload ảnh
app.MapPost("/api/images",
async (
    HttpRequest request,
    BlobServiceClient blobServiceClient,
    IConfiguration configuration,
    IHubContext<ImageHub> hubContext) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest("Invalid form content.");

    var form = await request.ReadFormAsync();
    var files = form.Files;

    if (files.Count == 0)
        return Results.BadRequest("No images uploaded.");

    var uploadedResults = new List<object>();

    string containerName =
        configuration["Azure:AzureBlob:ContainerName"]!;

    var containerClient =
        blobServiceClient.GetBlobContainerClient(containerName);

    await containerClient.CreateIfNotExistsAsync();

    foreach (var file in files)
    {
        var fileName =
            $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        var blobClient =
            containerClient.GetBlobClient(fileName);

        using var stream = file.OpenReadStream();

        await blobClient.UploadAsync(
            stream,
            overwrite: true);

        string imageUrl = blobClient.Uri.ToString();

        var possibleTags = new[]
        {
            "azure",
            "cloud",
            "blob-storage",
            "technology",
            "demo"
        };

        var random = new Random();
        // todo: Azure AI Vision Integration để tự động gắn thẻ ảnh dựa trên nội dung, hiện tại đang giả lập bằng cách random tag
        var tags = possibleTags
            .OrderBy(x => random.Next())
            .Take(3)
            .ToList();

        var newImage = new
        {
            id = Guid.NewGuid().ToString(),
            name = file.FileName,
            url = imageUrl,
            tags = tags,
            uploadedAt = DateTime.UtcNow
        };
        // Todo: integrate cosmos for storing metadata, currently using in-memory list
        imageMetadataList.Add(newImage);
        uploadedResults.Add(newImage);
    }
// Todo: implemnt Azure SignalR Service để gửi thông báo real-time về client khi có ảnh mới được upload
    await hubContext.Clients.All
        .SendAsync("ReceiveNewImages", uploadedResults);

    return Results.Ok(uploadedResults);
})
.DisableAntiforgery();
app.Run();

// Định nghĩa Hub cho SignalR
public class ImageHub : Microsoft.AspNetCore.SignalR.Hub { }
