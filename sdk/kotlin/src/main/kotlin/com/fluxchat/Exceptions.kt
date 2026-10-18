package com.fluxchat

/**
 * Levée lorsque l'API FluxChat retourne une erreur HTTP.
 */
class FluxChatApiException(
    val statusCode: Int,
    val apiMessage: String? = null
) : Exception("FluxChat API error $statusCode: ${apiMessage ?: "Unknown error"}")

/**
 * Levée lors d'une erreur réseau (timeout, connexion refusée, etc.).
 */
class FluxChatNetworkException(
    message: String,
    cause: Throwable? = null
) : Exception(message, cause)
