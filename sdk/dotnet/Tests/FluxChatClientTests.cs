using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FluxChat;
using FluxChat.Exceptions;
using Moq;
using Moq.Protected;
using Xunit;

namespace FluxChat.Tests
{
    public class FluxChatClientTests
    {
        // ─── Helper : crée un HttpClient mocké avec Enveloppe ─────────────────
        private static FluxChatClient CreateClientWithMock(
            HttpStatusCode statusCode,
            object? data = null,
            string? message = null,
            bool success = true)
        {
            var envelope = new
            {
                success = success,
                data = data,
                message = message
            };
            var json = JsonSerializer.Serialize(envelope);
            var handler = new Mock<HttpMessageHandler>();

            handler.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = statusCode,
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                });

            var httpClient = new HttpClient(handler.Object);
            return new FluxChatClient("test-api-key", httpClient);
        }

        // ─── Constructeur ─────────────────────────────────────────────────────

        [Fact]
        public void Constructor_ThrowsArgumentException_WhenApiKeyIsEmpty()
        {
            Assert.Throws<ArgumentException>(() => new FluxChatClient(""));
        }

        // ─── AskAsync ─────────────────────────────────────────────────────────

        [Fact]
        public async Task AskAsync_ReturnsResponse_WhenSuccessful()
        {
            var client = CreateClientWithMock(HttpStatusCode.OK, data: new
            {
                reply = "Bonjour !",
                conversationId = "conv-123"
            });

            var result = await client.AskAsync("Bonjour");

            Assert.Equal("Bonjour !", result.Reply);
            Assert.Equal("conv-123", result.ConversationId);
        }

        [Fact]
        public async Task AskAsync_ThrowsFluxChatApiException_OnHttpError()
        {
            var client = CreateClientWithMock(HttpStatusCode.Unauthorized, success: false, message: "Invalid API key");

            var ex = await Assert.ThrowsAsync<FluxChatApiException>(
                () => client.AskAsync("test"));
            
            Assert.Equal(401, ex.StatusCode);
            Assert.Equal("Invalid API key", ex.ApiMessage);
        }

        // ─── TestKeyAsync ─────────────────────────────────────────────────────

        [Fact]
        public async Task TestKeyAsync_ReturnsKeyInfo_WhenKeyIsValid()
        {
            var client = CreateClientWithMock(HttpStatusCode.OK, data: new
            {
                organizationId = "org-123",
                scopes = new[] { "ask", "knowledge" }
            });

            var result = await client.TestKeyAsync();
            Assert.Equal("org-123", result.OrganizationId);
            Assert.Contains("ask", result.Scopes);
        }

        [Fact]
        public async Task TestKeyAsync_ThrowsFluxChatApiException_WhenKeyIsInvalid()
        {
            var client = CreateClientWithMock(HttpStatusCode.Unauthorized, success: false, message: "Forbidden");

            await Assert.ThrowsAsync<FluxChatApiException>(
                () => client.TestKeyAsync());
        }

        // ─── Knowledge CRUD ───────────────────────────────────────────────────

        [Fact]
        public async Task GetKnowledgeAsync_ReturnsItems()
        {
            var client = CreateClientWithMock(HttpStatusCode.OK, data: new[]
            {
                new { id = "1", title = "FAQ", content = "Contenu FAQ" }
            });

            var kb = client.Knowledge("test-jwt");
            var items = await kb.ListAsync();

            Assert.Single(items);
            Assert.Equal("FAQ", items[0].Title);
        }

        [Fact]
        public async Task CreateKnowledgeAsync_ReturnsCreatedItem()
        {
            var client = CreateClientWithMock(HttpStatusCode.OK, data: new
            {
                id = "2",
                title = "Nouveau",
                content = "Mon contenu"
            });

            var kb = client.Knowledge("test-jwt");
            var item = await kb.CreateAsync("Nouveau", "Mon contenu");

            Assert.Equal("2", item.Id);
            Assert.Equal("Nouveau", item.Title);
        }
        
        [Fact]
        public async Task DeleteKnowledgeAsync_Succeeds()
        {
            // DELETE renvoie généralement un 204 No Content, ou une enveloppe vide
            var client = CreateClientWithMock(HttpStatusCode.OK, data: null);

            var kb = client.Knowledge("test-jwt");
            await kb.DeleteAsync("1"); // Ne doit pas lever d'exception
        }
    }
}
