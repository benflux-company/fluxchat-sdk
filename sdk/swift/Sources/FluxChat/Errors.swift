import Foundation

// MARK: - FluxChat Error types

/// Erreur levée lorsque l'API FluxChat retourne une réponse non-2xx.
public struct FluxChatApiError: Error, LocalizedError {
    public let statusCode: Int
    public let apiMessage: String

    public var errorDescription: String? {
        "FluxChat API error \(statusCode): \(apiMessage)"
    }
}

/// Erreur levée lors d'un problème réseau (encodage, décodage, transport, etc.).
public struct FluxChatNetworkError: Error, LocalizedError {
    public let message: String
    public let underlying: Error?

    public init(_ message: String, underlying: Error? = nil) {
        self.message = message
        self.underlying = underlying
    }

    public var errorDescription: String? {
        if let u = underlying {
            return "FluxChat network error: \(message) (caused by: \(u.localizedDescription))"
        }
        return "FluxChat network error: \(message)"
    }
}
