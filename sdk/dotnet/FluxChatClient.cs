using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using FluxChat.Exceptions;

namespace FluxChat
{
    // ─── Enveloppes ────────────────────────────────────────────────────────

    internal class ApiEnvelope<T>
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public T? Data { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }

    // ─── Modèles (Requests & Responses) ───────────────────────────────────

    public class FluxChatResponse
    {
        [JsonPropertyName("reply")]
        public string Reply { get; set; } = string.Empty;

        [JsonPropertyName("conversationId")]
        public string? ConversationId { get; set; }
    }

    public class KeyInfo
    {
        [JsonPropertyName("organizationId")]
        public string OrganizationId { get; set; } = string.Empty;

        [JsonPropertyName("scopes")]
        public string[] Scopes { get; set; } = Array.Empty<string>();
    }

    public class KnowledgeItem
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("keywords")]
        public string[]? Keywords { get; set; }

        [JsonPropertyName("isActive")]
        public bool? IsActive { get; set; }

        [JsonPropertyName("createdAt")]
        public string? CreatedAt { get; set; }
    }

    // ─── Clients ────────────────────────────────────────────────────────

    public class KnowledgeClient
    {
        private readonly FluxChatClient _client;
        private readonly string _jwtToken;

        internal KnowledgeClient(FluxChatClient client, string jwtToken)
        {
            _client = client;
            _jwtToken = jwtToken;
        }

        public async Task<KnowledgeItem[]> ListAsync()
        {
            return await _client.GetEnvelopedAsync<KnowledgeItem[]>("/bot/knowledge", _jwtToken)
                   ?? Array.Empty<KnowledgeItem>();
        }

        public async Task<KnowledgeItem> GetAsync(string id)
        {
            return await _client.GetEnvelopedAsync<KnowledgeItem>($"/bot/knowledge/{id}", _jwtToken);
        }

        public async Task<KnowledgeItem> CreateAsync(
            string title, 
            string content, 
            string? category = null, 
            string[]? keywords = null)
        {
            return await _client.PostEnvelopedAsync<KnowledgeItem>(
                "/bot/knowledge", 
                new { title, content, category, keywords }, 
                _jwtToken);
        }

        public async Task<KnowledgeItem> UpdateAsync(
            string id, 
            string? title = null, 
            string? content = null, 
            string? category = null, 
            string[]? keywords = null, 
            bool? isActive = null)
        {
            return await _client.PatchEnvelopedAsync<KnowledgeItem>(
                $"/bot/knowledge/{id}", 
                new { title, content, category, keywords, isActive }, 
                _jwtToken);
        }

        public async Task DeleteAsync(string id)
        {
            await _client.DeleteVoidAsync($"/bot/knowledge/{id}", _jwtToken);
        }
    }

    /// <summary>Réponse de <see cref="SupportClient.EscalateAsync"/>.</summary>
    public class EscalateResult
    {
        /// <summary>Id du ticket créé — à conserver avec l'e-mail pour suivre le fil.</summary>
        [JsonPropertyName("ticketId")]
        public string TicketId { get; set; } = string.Empty;

        /// <summary>Statut à la création (`open`, ou plus haut sur un plan priority-support).</summary>
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>Une ligne du fil, étiquetée par qui l'a écrite.</summary>
    public class TicketMessage
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        /// <summary>`bot` | `visitor` | `agent`.</summary>
        [JsonPropertyName("role")]
        public string Role { get; set; } = "visitor";

        [JsonPropertyName("createdAt")]
        public string? CreatedAt { get; set; }
    }

    /// <summary>Fil complet d'un ticket, tel que le visiteur le voit.</summary>
    public class TicketThread
    {
        [JsonPropertyName("ticketId")]
        public string TicketId { get; set; } = string.Empty;

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = string.Empty;

        /// <summary>`open` | `in_progress` | `resolved` | `closed`.</summary>
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        /// <summary>Vrai une fois qu'un humain a réellement écrit, pas seulement été assigné.</summary>
        [JsonPropertyName("agentConnected")]
        public bool AgentConnected { get; set; }

        [JsonPropertyName("agentName")]
        public string? AgentName { get; set; }

        /// <summary>`resolved` ou `closed` : le visiteur peut lire mais plus écrire.</summary>
        [JsonPropertyName("closed")]
        public bool Closed { get; set; }

        [JsonPropertyName("messages")]
        public TicketMessage[] Messages { get; set; } = Array.Empty<TicketMessage>();
    }

    /// <summary>
    /// Transfert vers un humain et fil de support du visiteur.
    ///
    /// Le visiteur n'a ni compte ni session : l'e-mail avec lequel il a demandé
    /// un humain est ce qui prouve que le ticket est le sien, en lecture comme
    /// en écriture. La recherche est aussi limitée à l'organisation de la clé API.
    ///
    /// Le fil se lit en polling — il n'y a pas de socket sur la surface publique.
    /// 5 s est la cadence du widget officiel et celle pour laquelle les quotas
    /// de la route sont dimensionnés.
    /// </summary>
    public class SupportClient
    {
        private readonly FluxChatClient _client;

        internal SupportClient(FluxChatClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Transfère un visiteur à un humain : crée un vrai ticket de support.
        /// Passez le même <paramref name="sessionId"/> qu'à AskAsync et tout ce
        /// que le bot a déjà dit est recopié dans le ticket.
        /// </summary>
        public async Task<EscalateResult> EscalateAsync(
            string name,
            string email,
            string message,
            string? sessionId = null)
        {
            var payload = new { name, email, message, sessionId };
            return await _client.PostEnvelopedAsync<EscalateResult>("/public/bot/escalate", payload);
        }

        /// <summary>
        /// Lit le fil du ticket, chaque ligne étiquetée par rôle. Lève une
        /// erreur 404 aussi bien quand le ticket n'existe pas que quand
        /// <paramref name="email"/> n'est pas celui avec lequel il a été ouvert :
        /// les deux cas sont volontairement indiscernables.
        /// </summary>
        public async Task<TicketThread> ThreadAsync(string ticketId, string email)
        {
            var path = $"/public/bot/tickets/{Uri.EscapeDataString(ticketId)}"
                     + $"?email={Uri.EscapeDataString(email)}";
            return await _client.GetEnvelopedAsync<TicketThread>(path);
        }

        /// <summary>
        /// Poste la réponse du visiteur dans son propre ticket. Une réponse sur
        /// un ticket `resolved` le rouvre ; un ticket `closed` refuse
        /// l'écriture (403).
        /// </summary>
        public async Task ReplyAsync(string ticketId, string email, string content)
        {
            var payload = new { email, content };
            await _client.PostVoidAsync(
                $"/public/bot/tickets/{Uri.EscapeDataString(ticketId)}/messages", payload);
        }
    }

    public class FluxChatClient : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _baseUrl;

        public FluxChatClient(string apiKey, string? baseUrl = null)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ArgumentException("API key cannot be null or empty.", nameof(apiKey));

            _apiKey = apiKey;
            _baseUrl = baseUrl?.TrimEnd('/') ?? "https://api.fluxchat-corp.com/api/v2";
            _httpClient = BuildHttpClient();
        }

        // Pour les tests
        internal FluxChatClient(string apiKey, HttpClient httpClient)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ArgumentException("API key cannot be null or empty.", nameof(apiKey));

            _apiKey = apiKey;
            _baseUrl = "https://api.fluxchat-corp.com/api/v2";
            _httpClient = httpClient;
        }

        private static HttpClient BuildHttpClient()
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept
                .Add(new MediaTypeWithQualityHeaderValue("application/json"));
            return client;
        }

        // ─── Core ─────────────────────────────────────────────────────────────

        public async Task<FluxChatResponse> AskAsync(
            string message,
            string? context = null,
            string? conversationId = null,
            string? sessionId = null)
        {
            var payload = new { message, context, conversationId, sessionId };
            return await PostEnvelopedAsync<FluxChatResponse>("/public/bot/ask", payload);
        }

        public async Task<KeyInfo> TestKeyAsync()
        {
            return await GetEnvelopedAsync<KeyInfo>("/public/bot/test");
        }

        public async Task CapturePageAsync(string url, string title, string content)
        {
            var payload = new { url, title, content };
            await PostVoidAsync("/public/bot/pages", payload);
        }

        public KnowledgeClient Knowledge(string jwtToken)
        {
            return new KnowledgeClient(this, jwtToken);
        }

        /// <summary>
        /// Transfert vers un humain et fil de support du visiteur.
        /// Nécessite que le plan de l'organisation inclue `supportTickets`.
        /// </summary>
        public SupportClient Support()
        {
            return new SupportClient(this);
        }

        // ─── Helpers internes (Enveloped) ─────────────────────────────────────

        private HttpRequestMessage CreateRequest(HttpMethod method, string path, string? jwtToken, object? payload = null)
        {
            var req = new HttpRequestMessage(method, $"{_baseUrl}{path}");
            
            if (!string.IsNullOrEmpty(jwtToken))
            {
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);
            }
            else
            {
                req.Headers.Add("X-API-Key", _apiKey);
            }

            if (payload != null)
            {
                var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull });
                req.Content = new StringContent(json, Encoding.UTF8, "application/json");
            }
            
            return req;
        }

        private async Task EnsureSuccessEnvelopedAsync(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                var message = response.ReasonPhrase;
                try
                {
                    var envelope = JsonSerializer.Deserialize<ApiEnvelope<object>>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (envelope != null && !string.IsNullOrEmpty(envelope.Message))
                    {
                        message = envelope.Message;
                    }
                }
                catch { }

                throw new FluxChatApiException((int)response.StatusCode, message ?? body);
            }
        }

        private async Task<T> DecodeEnvelopedAsync<T>(HttpResponseMessage response)
        {
            await EnsureSuccessEnvelopedAsync(response);
            var body = await response.Content.ReadAsStringAsync();
            var envelope = JsonSerializer.Deserialize<ApiEnvelope<T>>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            if (envelope == null || envelope.Data == null)
            {
                throw new FluxChatNetworkException("Missing data in response envelope.");
            }
            return envelope.Data;
        }

        internal async Task<T> GetEnvelopedAsync<T>(string path, string? jwtToken = null)
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Get, path, jwtToken);
                var response = await _httpClient.SendAsync(req);
                return await DecodeEnvelopedAsync<T>(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException($"Network error on GET {path}.", ex);
            }
        }

        internal async Task<T> PostEnvelopedAsync<T>(string path, object payload, string? jwtToken = null)
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Post, path, jwtToken, payload);
                var response = await _httpClient.SendAsync(req);
                return await DecodeEnvelopedAsync<T>(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException($"Network error on POST {path}.", ex);
            }
        }

        internal async Task PostVoidAsync(string path, object payload, string? jwtToken = null)
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Post, path, jwtToken, payload);
                var response = await _httpClient.SendAsync(req);
                await EnsureSuccessEnvelopedAsync(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException($"Network error on POST {path}.", ex);
            }
        }

        internal async Task<T> PatchEnvelopedAsync<T>(string path, object payload, string? jwtToken = null)
        {
            try
            {
                using var req = CreateRequest(new HttpMethod("PATCH"), path, jwtToken, payload);
                var response = await _httpClient.SendAsync(req);
                return await DecodeEnvelopedAsync<T>(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException($"Network error on PATCH {path}.", ex);
            }
        }

        internal async Task DeleteVoidAsync(string path, string? jwtToken = null)
        {
            try
            {
                using var req = CreateRequest(HttpMethod.Delete, path, jwtToken);
                var response = await _httpClient.SendAsync(req);
                await EnsureSuccessEnvelopedAsync(response);
            }
            catch (HttpRequestException ex)
            {
                throw new FluxChatNetworkException($"Network error on DELETE {path}.", ex);
            }
        }

        public void Dispose() => _httpClient.Dispose();
    }
}
