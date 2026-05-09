using Newtonsoft.Json;

namespace Backend.Model;
public class User
{
    [JsonProperty("id")] public string Id { get; set; } = Guid.NewGuid().ToString();
    [JsonProperty("username")] public string Username { get; set; }
    [JsonProperty("password")] public string Password { get; set; }
}

