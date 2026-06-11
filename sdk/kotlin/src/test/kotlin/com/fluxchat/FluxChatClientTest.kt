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
                json(Json { ignoreUnknownKeys = true })
            }
        }
        return FluxChatClient(apiKey = "test-key", httpClient = httpClient)
    }

    // ─── ask() ────────────────────────────────────────────────────────────────

    @Test
    fun `ask retourne une AskResponse valide`() = runTest {
        val body = Json.encodeToString(AskResponse(text = "Bonjour !", conversationId = "conv-1"))
        val client = buildMockClient(HttpStatusCode.OK, body)

        val result = client.ask("Bonjour")

        assertEquals("Bonjour !", result.text)
        assertEquals("conv-1", result.conversationId)
    }

    @Test
    fun `ask lève FluxChatApiException sur erreur 401`() = runTest {
        val client = buildMockClient(HttpStatusCode.Unauthorized, """{"error":"Invalid key"}""")

        assertFailsWith<FluxChatApiException> {
            client.ask("test")
        }
    }

    // ─── testKey() ────────────────────────────────────────────────────────────

    @Test
    fun `testKey retourne KeyInfo valide`() = runTest {
        val body = Json.encodeToString(KeyInfo(valid = true, plan = "pro"))
        val client = buildMockClient(HttpStatusCode.OK, body)

        val info = client.testKey()

        assertTrue(info.valid)
        assertEquals("pro", info.plan)
    }

    @Test
    fun `testKey lève FluxChatApiException si clé invalide`() = runTest {
        val client = buildMockClient(HttpStatusCode.Unauthorized, """{"error":"Invalid key"}""")

        assertFailsWith<FluxChatApiException> {
            client.testKey()
        }
    }

    // ─── Knowledge CRUD ───────────────────────────────────────────────────────

    @Test
    fun `getKnowledge retourne une liste d items`() = runTest {
        val items = listOf(KnowledgeItem(id = "1", title = "FAQ", content = "Contenu"))
        val body = Json.encodeToString(items)
        val client = buildMockClient(HttpStatusCode.OK, body)

        val result = client.getKnowledge()

        assertEquals(1, result.size)
        assertEquals("FAQ", result[0].title)
    }

    @Test
    fun `createKnowledge retourne l item créé`() = runTest {
        val item = KnowledgeItem(id = "2", title = "Nouveau", content = "Mon contenu")
        val body = Json.encodeToString(item)
        val client = buildMockClient(HttpStatusCode.OK, body)

        val result = client.createKnowledge("Nouveau", "Mon contenu")

        assertEquals("2", result.id)
        assertEquals("Nouveau", result.title)
    }
}
