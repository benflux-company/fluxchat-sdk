package com.fluxchat

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AskRequest(
    val message: String,
    val context: String? = null,
    @SerialName("conversation_id") val conversationId: String? = null
)

@Serializable
data class AskResponse(
    val text: String,
    @SerialName("conversation_id") val conversationId: String? = null
)

@Serializable
data class KeyInfo(
    val valid: Boolean,
    val plan: String? = null
)

@Serializable
data class KnowledgeItem(
    val id: String? = null,
    val title: String,
    val content: String
)

@Serializable
data class KnowledgeRequest(
    val title: String,
    val content: String
)
