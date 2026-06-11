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
        // ─── Helper : crée un HttpClient mocké ────────────────────────────────
        private static FluxChatClient CreateClientWithMock(
            HttpStatusCode statusCode,
            object responseBody)
        {
            var json = JsonSerializer.Serialize(responseBody);
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

            // On passe par le constructeur interne pour injecter le handler mocké
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
            var client = CreateClientWithMock(HttpStatusCode.OK, new
            {
                text = "Bonjour !",
                conversationId = "conv-123"
            });

            var result = await client.AskAsync("Bonjour");

            Assert.Equal("Bonjour !", result.Text);
            Assert.Equal("conv-123", result.ConversationId);
        }

        [Fact]
        public async Task AskAsync_ThrowsFluxChatApiException_OnHttpError()
        {
            var client = CreateClientWithMock(HttpStatusCode.Unauthorized, new
            {
                error = "Invalid API key"
            });

            await Assert.ThrowsAsync<FluxChatApiException>(
                () => client.AskAsync("test"));
        }

        // ─── TestKeyAsync ─────────────────────────────────────────────────────

        [Fact]
        public async Task TestKeyAsync_ReturnsTrue_WhenKeyIsValid()
        {
            var client = CreateClientWithMock(HttpStatusCode.OK, new { valid = true });
            var result = await client.TestKeyAsync();
            Assert.True(result);
        }

        [Fact]
        public async Task TestKeyAsync_ReturnsFalse_WhenKeyIsInvalid()
        {
            var client = CreateClientWithMock(HttpStatusCode.Unauthorized, new { valid = false });
            var result = await client.TestKeyAsync();
            Assert.False(result);
        }

        // ─── Knowledge CRUD ───────────────────────────────────────────────────

        [Fact]
        public async Task GetKnowledgeAsync_ReturnsItems()
        {
            var client = CreateClientWithMock(HttpStatusCode.OK, new[]
            {
                new { id = "1", title = "FAQ", content = "Contenu FAQ" }
            });

            var items = await client.GetKnowledgeAsync();
            Assert.Single(items);
            Assert.Equal("FAQ", items[0].Title);
        }

        [Fact]
        public async Task CreateKnowledgeAsync_ReturnsCreatedItem()
        {
            var client = CreateClientWithMock(HttpStatusCode.OK, new
            {
                id = "2",
                title = "Nouveau",
                content = "Mon contenu"
            });

            var item = await client.CreateKnowledgeAsync("Nouveau", "Mon contenu");
            Assert.Equal("2", item.Id);
            Assert.Equal("Nouveau", item.Title);
        }
    }
}
