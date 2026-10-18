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
 * @param baseUrl URL de base optionnelle (défaut : https://api.fluxchat-corp.com/api/v2).
 * @param httpClient HttpClient Ktor (injectez un mock pour les tests).
 */
class FluxChatClient(
    private val apiKey: String,
    private val baseUrl: String? = null,
    private val httpClient: HttpClient = buildDefaultClient()
) {
    private val base = baseUrl?.trimEnd('/') ?: "https://api.fluxchat-corp.com/api/v2"

    // ─── Core ─────────────────────────────────────────────────────────────────

    /**
     * Envoie un message à FluxChat et retourne la réponse.
     */
    suspend fun ask(
        message: String,
        context: String? = null,
        conversationId: String? = null,
        sessionId: String? = null
    ): AskResponse = postEnveloped<AskRequest, AskResponse>(
        "$base/public/bot/ask",
        AskRequest(message, context, conversationId, sessionId),
        jwtToken = null
    )

    /**
     * Vérifie que la clé API est valide et retourne les informations associées.
     */
    suspend fun testKey(): KeyInfo = getEnveloped<KeyInfo>("$base/public/bot/test", jwtToken = null)

    /**
     * Capture passivement le contenu d'une page pour la base de connaissance.
     */
    suspend fun capturePage(url: String, title: String, content: String) {
        postVoid("$base/public/bot/pages", CapturePageRequest(url, title, content), jwtToken = null)
    }

    // ─── Knowledge CRUD ───────────────────────────────────────────────────────

    /** Client interne pour la Knowledge Base (nécessite un JWT). */
    inner class KnowledgeClient(private val jwtToken: String) {
        suspend fun list(): List<KnowledgeItem> =
            getEnveloped<List<KnowledgeItem>>("$base/bot/knowledge", jwtToken = jwtToken)

        suspend fun get(id: String): KnowledgeItem =
            getEnveloped<KnowledgeItem>("$base/bot/knowledge/$id", jwtToken = jwtToken)

        suspend fun create(
            title: String,
            content: String,
            category: String? = null,
            keywords: List<String>? = null
        ): KnowledgeItem = postEnveloped<KnowledgeCreateRequest, KnowledgeItem>(
            "$base/bot/knowledge",
            KnowledgeCreateRequest(title, content, category, keywords),
            jwtToken = jwtToken
        )

        suspend fun update(
            id: String,
            title: String? = null,
            content: String? = null,
            category: String? = null,
            keywords: List<String>? = null,
            isActive: Boolean? = null
        ): KnowledgeItem = patchEnveloped<KnowledgePatchRequest, KnowledgeItem>(
            "$base/bot/knowledge/$id",
            KnowledgePatchRequest(title, content, category, keywords, isActive),
            jwtToken = jwtToken
        )

        suspend fun delete(id: String) {
            deleteVoid("$base/bot/knowledge/$id", jwtToken = jwtToken)
        }
    }

    fun knowledge(jwtToken: String): KnowledgeClient {
        return KnowledgeClient(jwtToken)
    }

    // ─── Support : transfert humain et fil du visiteur ────────────────────────

    /**
     * Transfert vers un humain et fil de support du visiteur.
     *
     * Le visiteur n'a ni compte ni session : l'e-mail avec lequel il a demandé
     * un humain est ce qui prouve que le ticket est le sien, en lecture comme
     * en écriture. La recherche est aussi limitée à l'organisation de la clé.
     *
     * Le fil se lit en polling — il n'y a pas de socket sur la surface
     * publique. 5 s est la cadence du widget officiel et celle pour laquelle
     * les quotas de la route sont dimensionnés.
     */
    inner class SupportClient {
        /**
         * Transfère un visiteur à un humain : crée un vrai ticket de support.
         *
         * @param sessionId le même que celui passé à [ask]. S'il est fourni,
         *   tout ce que le bot a déjà dit est recopié dans le ticket, pour que
         *   l'agent prenne la conversation en cours de route.
         */
        suspend fun escalate(
            name: String,
            email: String,
            message: String,
            sessionId: String? = null
        ): EscalateResult = postEnveloped<EscalateRequest, EscalateResult>(
            "$base/public/bot/escalate",
            EscalateRequest(name, email, message, sessionId),
            jwtToken = null
        )

        /**
         * Lit le fil du ticket, chaque ligne étiquetée par rôle.
         *
         * Lève une erreur 404 aussi bien quand le ticket n'existe pas que
         * quand [email] n'est pas celui avec lequel il a été ouvert : les deux
         * cas sont volontairement indiscernables, pour qu'un id deviné
         * n'apprenne rien.
         */
        suspend fun thread(ticketId: String, email: String): TicketThread =
            getEnveloped<TicketThread>(
                "$base/public/bot/tickets/${encode(ticketId)}?email=${encode(email)}",
                jwtToken = null
            )

        /**
         * Poste la réponse du visiteur dans son propre ticket.
         *
         * Une réponse sur un ticket `resolved` le rouvre ; un ticket `closed`
         * refuse l'écriture (403) plutôt que d'avaler un message que personne
         * ne lira.
         */
        suspend fun reply(ticketId: String, email: String, content: String) {
            postVoid(
                "$base/public/bot/tickets/${encode(ticketId)}/messages",
                TicketReplyRequest(email, content),
                jwtToken = null
            )
        }

        /** `+` et `@` doivent survivre encodés, sinon l'API cherche une autre adresse. */
        private fun encode(value: String): String =
            java.net.URLEncoder.encode(value, "UTF-8").replace("+", "%20")
    }

    /**
     * Transfert vers un humain et fil de support.
     *
     * Nécessite que le plan de l'organisation inclue `supportTickets`.
     */
    fun support(): SupportClient = SupportClient()

    // ─── Helpers privés ───────────────────────────────────────────────────────

    private fun HttpRequestBuilder.applyAuth(jwtToken: String?) {
        if (jwtToken != null) {
            header(HttpHeaders.Authorization, "Bearer $jwtToken")
        } else {
            header("X-API-Key", apiKey)
        }
    }

    private suspend fun validateResponse(response: io.ktor.client.statement.HttpResponse) {
        if (!response.status.isSuccess()) {
            val bodyText = try { response.body<String>() } catch (e: Exception) { "" }
            val apiMsg = try {
                val envelope = Json { ignoreUnknownKeys = true }.decodeFromString<APIEnvelope<String>>(bodyText)
                envelope.message ?: bodyText
            } catch (e: Exception) {
                bodyText
            }
            throw FluxChatApiException(response.status.value, apiMsg)
        }
    }

    private suspend inline fun <reified T> getEnveloped(url: String, jwtToken: String?): T {
        try {
            val response = httpClient.get(url) { applyAuth(jwtToken) }
            validateResponse(response)
            val envelope = response.body<APIEnvelope<T>>()
            return envelope.data ?: throw FluxChatNetworkException("Missing data in response envelope")
        } catch (e: FluxChatApiException) { throw e }
        catch (e: Exception) { throw FluxChatNetworkException("Network error on GET $url", e) }
    }

    private suspend inline fun <reified Req, reified Res> postEnveloped(url: String, body: Req, jwtToken: String?): Res {
        try {
            val response = httpClient.post(url) {
                applyAuth(jwtToken)
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            validateResponse(response)
            val envelope = response.body<APIEnvelope<Res>>()
            return envelope.data ?: throw FluxChatNetworkException("Missing data in response envelope")
        } catch (e: FluxChatApiException) { throw e }
        catch (e: Exception) { throw FluxChatNetworkException("Network error on POST $url", e) }
    }

    private suspend inline fun <reified Req> postVoid(url: String, body: Req, jwtToken: String?) {
        try {
            val response = httpClient.post(url) {
                applyAuth(jwtToken)
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            validateResponse(response)
        } catch (e: FluxChatApiException) { throw e }
        catch (e: Exception) { throw FluxChatNetworkException("Network error on POST $url", e) }
    }

    private suspend inline fun <reified Req, reified Res> patchEnveloped(url: String, body: Req, jwtToken: String?): Res {
        try {
            val response = httpClient.patch(url) {
                applyAuth(jwtToken)
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            validateResponse(response)
            val envelope = response.body<APIEnvelope<Res>>()
            return envelope.data ?: throw FluxChatNetworkException("Missing data in response envelope")
        } catch (e: FluxChatApiException) { throw e }
        catch (e: Exception) { throw FluxChatNetworkException("Network error on PATCH $url", e) }
    }

    private suspend fun deleteVoid(url: String, jwtToken: String?) {
        try {
            val response = httpClient.delete(url) { applyAuth(jwtToken) }
            validateResponse(response)
        } catch (e: FluxChatApiException) { throw e }
        catch (e: Exception) { throw FluxChatNetworkException("Network error on DELETE $url", e) }
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
