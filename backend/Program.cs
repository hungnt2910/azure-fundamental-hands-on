using Azure;
using Azure.AI.Vision.ImageAnalysis;
using Azure.Storage.Blobs;
using Backend.Model;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Azure.Cosmos;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using User = Backend.Model.User;
using ImageMetadata = Backend.Model.ImageMetadata;
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

// Cosmos DB Configuration
var cosmosConnString = builder.Configuration["Azure:CosmosDb:ConnectionString"];
var cosmosDbName = builder.Configuration["Azure:CosmosDb:DatabaseName"];
var cosmosClient = new CosmosClient(cosmosConnString);
builder.Services.AddSingleton(cosmosClient);

// JWT Configuration
var jwtKey = builder.Configuration["Jwt:Key"];
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();


// KHO LƯU TRỮ TRONG BỘ NHỚ (Dữ liệu sẽ mất khi restart server)
var imageMetadataList = new List<dynamic>
{
    new { id = "1", name = "Azure Landscape", url = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", tags = new[] { "nature", "azure" }, uploadedAt = DateTime.UtcNow },
    new { id = "2", name = "Tech Cloud", url = "https://images.unsplash.com/photo-1451187580459-43490279c0fa", tags = new[] { "cloud", "tech" }, uploadedAt = DateTime.UtcNow }
};


app.MapHub<ImageHub>("/hubs/images");

// ==========================================
// API: AUTHENTICATION
// ==========================================
app.MapPost("/api/auth/register", async (AuthRequest req, CosmosClient client) =>
{
    var container = client.GetContainer(cosmosDbName, "Users");
    var newUser = new User { Username = req.Username, Password = req.Password };
    await container.CreateItemAsync(newUser, new PartitionKey(newUser.Username));
    return Results.Ok(new { message = "Register success" });
});

app.MapPost("/api/auth/login", async (AuthRequest req, CosmosClient client) =>
{
    var container = client.GetContainer(cosmosDbName, "Users");

    var query = new QueryDefinition("SELECT * FROM c WHERE c.username = @u AND c.password = @p")
        .WithParameter("@u", req.Username).WithParameter("@p", req.Password);

    var iterator = container.GetItemQueryIterator<Backend.Model.User>(query);
    if (iterator.HasMoreResults)
    {
        var response = await iterator.ReadNextAsync();
        var user = response.FirstOrDefault();
        if (user != null)
        {
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Username)
            };
            var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
                issuer: builder.Configuration["Jwt:Issuer"],
                audience: builder.Configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), SecurityAlgorithms.HmacSha256)
            );
            var tokenString = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
            return Results.Ok(new { token = tokenString });
        }
    }
    return Results.Unauthorized();
});

// API: Lấy danh sách ảnh
app.MapGet("/api/images", async(HttpContext context, CosmosClient client) =>
{
    //return Results.Ok(imageMetadataList.OrderByDescending(x => x.uploadedAt));

    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var container = client.GetContainer(cosmosDbName, "Images");

    var query = new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId")
        .WithParameter("@userId", userId);

    var iterator = container.GetItemQueryIterator<ImageMetadata>(query);
    var results = new List<ImageMetadata>();

    while (iterator.HasMoreResults)
    {
        var response = await iterator.ReadNextAsync();
        results.AddRange(response.ToList());
    }
    return Results.Ok(results.OrderByDescending(x => x.UploadedAt));
}).RequireAuthorization();


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
    HttpContext context,
    BlobServiceClient blobServiceClient,
    CosmosClient cosmosClient,
    IConfiguration configuration,
    IHubContext<ImageHub> hubContext) =>
{
    // Xác thực và lấy userId từ token JWT
    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
    {
        return Results.Unauthorized();
    }

    if (!request.HasFormContentType)
        return Results.BadRequest("Invalid form content.");

    // Lấy file upload
    var form = await request.ReadFormAsync();
    var files = form.Files;

    if (files.Count == 0)
        return Results.BadRequest("No images uploaded.");

    var uploadedResults = new List<ImageMetadata>();

    // Cấu hình Blob Storage
    string containerName =
        configuration["Azure:AzureBlob:ContainerName"]!;

    var containerClient =
        blobServiceClient.GetBlobContainerClient(containerName);

    await containerClient.CreateIfNotExistsAsync();

    // Cấu hình Cosmos DB
    string cosmosDbName = configuration["CosmosDb:DatabaseName"]!;
    var cosmosContainer = cosmosClient.GetContainer(cosmosDbName, "Images");

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

        var newImage = new ImageMetadata
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Name = file.FileName,
            Url = imageUrl,
            Tags = tags.ToArray(),
            UploadedAt = DateTime.UtcNow
        };

        // Lưu metadata image vào Cosmos DB
        //imageMetadataList.Add(newImage);
        await cosmosContainer.CreateItemAsync(newImage, new PartitionKey(userId));

        uploadedResults.Add(newImage);
    }
// Todo: implemnt Azure SignalR Service để gửi thông báo real-time về client khi có ảnh mới được upload
    await hubContext.Clients.All
        .SendAsync("ReceiveNewImages", uploadedResults);

    return Results.Ok(uploadedResults);
})
.DisableAntiforgery()
.RequireAuthorization();

app.Run();

// Định nghĩa Hub cho SignalR
public class ImageHub : Microsoft.AspNetCore.SignalR.Hub { }
