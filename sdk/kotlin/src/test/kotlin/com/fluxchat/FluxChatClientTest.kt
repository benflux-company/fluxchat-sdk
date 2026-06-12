package com.fluxchat

import io.ktor.client.*
import io.ktor.client.engine.mock.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.utils.io.*
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.test.*

class FluxChatClientTest {

    // ─── Helper : crée un client avec un moteur mock ──────────────────────────

    private val json = Json { ignoreUnknownKeys = true }

    private fun buildMockClient(
        status: HttpStatusCode,
        responseBody: String
    ): FluxChatClient {
        val mockEngine = MockEngine { _ ->
            respond(
                content = ByteReadChannel(responseBody),
                status = status,
                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString())
            )
        }
        val httpClient = HttpClient(mockEngine) {
            install(ContentNegotiation) {
                json(json)
            }
        }
        return FluxChatClient(apiKey = "test-key", httpClient = httpClient)
    }

    private inline fun <reified T> envelope(data: T): String {
        return json.encodeToString(APIEnvelope(success = true, data = data))
    }

    private fun errorEnvelope(message: String): String {
        return json.encodeToString(APIEnvelope<String>(success = false, message = message))
    }

    // ─── ask() ────────────────────────────────────────────────────────────────

    @Test
    fun `ask retourne une AskResponse valide`() = runTest {
        val body = envelope(AskResponse(reply = "Bonjour !", conversationId = "conv-1"))
        val client = buildMockClient(HttpStatusCode.OK, body)

        val result = client.ask("Bonjour")

        assertEquals("Bonjour !", result.reply)
        assertEquals("conv-1", result.conversationId)
    }

    @Test
    fun `ask lève FluxChatApiException sur erreur 401`() = runTest {
        val client = buildMockClient(HttpStatusCode.Unauthorized, errorEnvelope("Invalid key"))

        val e = assertFailsWith<FluxChatApiException> {
            client.ask("test")
        }
        assertEquals(401, e.statusCode)
        assertEquals("Invalid key", e.apiMessage)
    }

    // ─── testKey() ────────────────────────────────────────────────────────────

    @Test
    fun `testKey retourne KeyInfo valide`() = runTest {
        val body = envelope(KeyInfo(organizationId = "org-123", scopes = listOf("ask", "knowledge")))
        val client = buildMockClient(HttpStatusCode.OK, body)

        val info = client.testKey()

        assertEquals("org-123", info.organizationId)
        assertTrue(info.scopes.contains("ask"))
    }

    // ─── Knowledge CRUD ───────────────────────────────────────────────────────

    @Test
    fun `getKnowledge list retourne une liste d items`() = runTest {
        val items = listOf(KnowledgeItem(id = "1", title = "FAQ", content = "Contenu"))
        val body = envelope(items)
        val client = buildMockClient(HttpStatusCode.OK, body)

        val kb = client.knowledge("test-jwt")
        val result = kb.list()

        assertEquals(1, result.size)
        assertEquals("FAQ", result[0].title)
    }

    @Test
    fun `createKnowledge retourne l item créé`() = runTest {
        val item = KnowledgeItem(id = "2", title = "Nouveau", content = "Mon contenu")
        val body = envelope(item)
        val client = buildMockClient(HttpStatusCode.OK, body)

        val kb = client.knowledge("test-jwt")
        val result = kb.create("Nouveau", "Mon contenu")

        assertEquals("2", result.id)
        assertEquals("Nouveau", result.title)
    }
}
