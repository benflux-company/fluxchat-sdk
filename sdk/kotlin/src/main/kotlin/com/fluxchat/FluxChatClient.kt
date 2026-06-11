package com.fluxchat

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

/**
 * Client principal pour interagir avec l'API FluxChat.
 *
 * @param apiKey  Votre clé API FluxChat.
 * @param baseUrl URL de base optionnelle (défaut : https://api.fluxchat.io/v1).
 * @param httpClient HttpClient Ktor (injectez un mock pour les tests).
 */
class FluxChatClient(
    private val apiKey: String,
    private val baseUrl: String? = null,
    private val httpClient: HttpClient = buildDefaultClient()
) {
    private val base = baseUrl?.trimEnd('/') ?: "https://api.fluxchat.io/v1"

    // ─── Core ─────────────────────────────────────────────────────────────────

    /**
     * Envoie un message à FluxChat et retourne la réponse.
     */
    suspend fun ask(
        message: String,
        context: String? = null,
        conversationId: String? = null
    ): AskResponse = post("$base/ask", AskRequest(message, context, conversationId))

    /**
     * Vérifie que la clé API est valide et retourne les informations associées.
     */
    suspend fun testKey(): KeyInfo = get("$base/test-key")

    // ─── Knowledge CRUD ───────────────────────────────────────────────────────

    /** Récupère tous les éléments de la base de connaissance. */
    suspend fun getKnowledge(): List<KnowledgeItem> = get("$base/knowledge")

    /** Crée un nouvel élément de connaissance. */
    suspend fun createKnowledge(title: String, content: String): KnowledgeItem =
        post("$base/knowledge", KnowledgeRequest(title, content))

    /** Met à jour un élément de connaissance existant. */
    suspend fun updateKnowledge(id: String, title: String, content: String): KnowledgeItem =
        put("$base/knowledge/$id", KnowledgeRequest(title, content))

    /** Supprime un élément de connaissance. */
    suspend fun deleteKnowledge(id: String) {
        try {
            val response = httpClient.delete("$base/knowledge/$id") {
                header(HttpHeaders.Authorization, "Bearer $apiKey")
            }
            if (!response.status.isSuccess()) {
                throw FluxChatApiException(response.status.value, response.body<String>())
            }
        } catch (e: FluxChatApiException) {
            throw e
        } catch (e: Exception) {
            throw FluxChatNetworkException("Network error while deleting knowledge/$id", e)
        }
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private suspend inline fun <reified T> get(url: String): T {
        try {
            val response = httpClient.get(url) {
                header(HttpHeaders.Authorization, "Bearer $apiKey")
            }
            if (!response.status.isSuccess()) {
                throw FluxChatApiException(response.status.value, response.body<String>())
            }
            return response.body()
        } catch (e: FluxChatApiException) {
            throw e
        } catch (e: Exception) {
            throw FluxChatNetworkException("Network error on GET $url", e)
        }
    }

    private suspend inline fun <reified Req, reified Res> post(url: String, body: Req): Res {
        try {
            val response = httpClient.post(url) {
                header(HttpHeaders.Authorization, "Bearer $apiKey")
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            if (!response.status.isSuccess()) {
                throw FluxChatApiException(response.status.value, response.body<String>())
            }
            return response.body()
        } catch (e: FluxChatApiException) {
            throw e
        } catch (e: Exception) {
            throw FluxChatNetworkException("Network error on POST $url", e)
        }
    }

    private suspend inline fun <reified Req, reified Res> put(url: String, body: Req): Res {
        try {
            val response = httpClient.put(url) {
                header(HttpHeaders.Authorization, "Bearer $apiKey")
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            if (!response.status.isSuccess()) {
                throw FluxChatApiException(response.status.value, response.body<String>())
            }
            return response.body()
        } catch (e: FluxChatApiException) {
            throw e
        } catch (e: Exception) {
            throw FluxChatNetworkException("Network error on PUT $url", e)
        }
    }

    companion object {
        fun buildDefaultClient() = HttpClient(OkHttp) {
            install(ContentNegotiation) {
                json(Json {
                    ignoreUnknownKeys = true
                    coerceInputValues = true
                })
            }
        }
    }
}
