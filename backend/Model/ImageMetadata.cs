using Newtonsoft.Json;

namespace Backend.Model;

public class ImageMetadata
{
    [JsonProperty("id")] public string Id { get; set; }
    [JsonProperty("userId")] public string UserId { get; set; }
    [JsonProperty("name")] public string Name { get; set; }
    [JsonProperty("url")] public string Url { get; set; }
    [JsonProperty("caption")] public string? Caption { get; set; }

    [JsonProperty("tags")] public string[] Tags { get; set; }
    [JsonProperty("uploadedAt")] public DateTime UploadedAt { get; set; }
}
