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
