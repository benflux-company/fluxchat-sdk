package com.fluxchat

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class APIEnvelope<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

@Serializable
data class AskRequest(
    val message: String,
    val context: String? = null,
    @SerialName("conversationId") val conversationId: String? = null,
    @SerialName("sessionId") val sessionId: String? = null
)

@Serializable
data class CapturePageRequest(
    val url: String,
    val title: String,
    val content: String
)

@Serializable
data class AskResponse(
    val reply: String,
    @SerialName("conversationId") val conversationId: String? = null
)

@Serializable
data class KeyInfo(
    @SerialName("organizationId") val organizationId: String,
    val scopes: List<String> = emptyList()
)

@Serializable
data class KnowledgeItem(
    val id: String? = null,
    val title: String? = null,
    val content: String? = null,
    val category: String? = null,
    val keywords: List<String>? = null,
    val isActive: Boolean? = null,
    val createdAt: String? = null
)

@Serializable
data class KnowledgeCreateRequest(
    val title: String,
    val content: String,
    val category: String? = null,
    val keywords: List<String>? = null
)

@Serializable
data class KnowledgePatchRequest(
    val title: String? = null,
    val content: String? = null,
    val category: String? = null,
    val keywords: List<String>? = null,
    val isActive: Boolean? = null
)

// ─── Support : transfert humain et fil du visiteur ───────────────────────────

@Serializable
data class EscalateRequest(
    val name: String,
    val email: String,
    val message: String,
    @SerialName("sessionId") val sessionId: String? = null
)

@Serializable
data class TicketReplyRequest(
    val email: String,
    val content: String
)

/** Réponse de [FluxChatClient.SupportClient.escalate]. */
@Serializable
data class EscalateResult(
    /** Id du ticket créé — à conserver avec l'e-mail pour suivre le fil. */
    @SerialName("ticketId") val ticketId: String,
    /** Statut à la création (`open`, ou plus haut sur un plan priority-support). */
    val status: String
)

@Serializable
data class TicketMessage(
    val id: String,
    val content: String,
    /** `bot` | `visitor` | `agent`. */
    val role: String,
    @SerialName("createdAt") val createdAt: String? = null
)

/** Fil complet d'un ticket, tel que le visiteur le voit. */
@Serializable
data class TicketThread(
    @SerialName("ticketId") val ticketId: String,
    val subject: String = "",
    /** `open` | `in_progress` | `resolved` | `closed`. */
    val status: String,
    /** Vrai une fois qu'un humain a réellement écrit, pas seulement été assigné. */
    @SerialName("agentConnected") val agentConnected: Boolean = false,
    @SerialName("agentName") val agentName: String? = null,
    /** `resolved` ou `closed` : le visiteur peut lire mais plus écrire. */
    val closed: Boolean = false,
    val messages: List<TicketMessage> = emptyList()
)
