using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluxChat.Exceptions;

namespace FluxChat
{
    public class FluxChatClient : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _baseUrl;

        // Constructeur principal (usage normal)
        public FluxChatClient(string apiKey, string? baseUrl = null)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ArgumentException("API key cannot be null or empty.", nameof(apiKey));

            _apiKey = apiKey;
            _baseUrl = baseUrl?.TrimEnd('/') ?? "https://api.fluxchat.io/v1";
            _httpClient = BuildHttpClient(_apiKey);
        }

        // Constructeur interne pour injection du HttpClient (tests)
        internal FluxChatClient(string apiKey, HttpClient httpClient)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ArgumentException("API key cannot be null or empty.", nameof(apiKey));

            _apiKey = apiKey;
            _baseUrl = "https://api.fluxchat.io/v1";
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        private static HttpClient BuildHttpClient(string apiKey)
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);
            client.DefaultRequestHeaders.Accept
                .Add(new MediaTypeWithQualityHeaderValue("application/json"));
            return client;
        }

        // ─── Core ─────────────────────────────────────────────────────────────

        public async Task<FluxChatResponse> AskAsync(
            string message,
            string? context = null,
            string? conversationId = null)
        {
            var payload = new { message, context, conversation_id = conversationId };
            return await PostAsync<FluxChatResponse>("/ask", payload);
        }

        public async Task<bool> TestKeyAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/test-key");
                return response.IsSuccessStatusCode;
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException("Network error while testing API key.", ex);
            }
        }

        // ─── Knowledge CRUD ───────────────────────────────────────────────────

        public async Task<KnowledgeItem[]> GetKnowledgeAsync()
        {
            return await GetAsync<KnowledgeItem[]>("/knowledge")
                   ?? Array.Empty<KnowledgeItem>();
        }

        public async Task<KnowledgeItem> CreateKnowledgeAsync(string title, string content)
        {
            return await PostAsync<KnowledgeItem>("/knowledge", new { title, content });
        }

        public async Task<KnowledgeItem> UpdateKnowledgeAsync(string id, string title, string content)
        {
            return await PutAsync<KnowledgeItem>($"/knowledge/{id}", new { title, content });
        }

        public async Task DeleteKnowledgeAsync(string id)
        {
            try
            {
                var response = await _httpClient.DeleteAsync($"{_baseUrl}/knowledge/{id}");
                await EnsureSuccessAsync(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException("Network error while deleting knowledge.", ex);
            }
        }

        // ─── Helpers privés ───────────────────────────────────────────────────

        private async Task<T> GetAsync<T>(string path)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}{path}");
                return await DeserializeAsync<T>(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException($"Network error on GET {path}.", ex);
            }
        }

        private async Task<T> PostAsync<T>(string path, object payload)
        {
            try
            {
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{_baseUrl}{path}", content);
                return await DeserializeAsync<T>(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException($"Network error on POST {path}.", ex);
            }
        }

        private async Task<T> PutAsync<T>(string path, object payload)
        {
            try
            {
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PutAsync($"{_baseUrl}{path}", content);
                return await DeserializeAsync<T>(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException($"Network error on PUT {path}.", ex);
            }
        }

        private static async Task EnsureSuccessAsync(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new FluxChatApiException((int)response.StatusCode, body);
            }
        }

        private static async Task<T> DeserializeAsync<T>(HttpResponseMessage response)
        {
            await EnsureSuccessAsync(response);
            var body = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(body, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? throw new FluxChatApiException((int)response.StatusCode, "Empty response body.");
        }

        public void Dispose() => _httpClient.Dispose();
    }
}
