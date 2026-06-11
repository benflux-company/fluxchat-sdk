import Foundation

/// Client principal FluxChat pour Swift (iOS & macOS).
///
/// ```swift
/// let client = FluxChatClient(apiKey: "sk-...")
///
/// let response = try await client.ask(message: "Bonjour !")
/// print(response.text)
///
/// let items = try await client.knowledge.list()
/// ```
public final class FluxChatClient {
    private let http: HTTPHelper

    /// Client pour les opérations Knowledge Base.
    public let knowledge: KnowledgeClient

    /// Initialise un nouveau client FluxChat.
    /// - Parameters:
    ///   - apiKey: Votre clé API FluxChat.
    ///   - baseURL: URL de base optionnelle (défaut : `https://api.fluxchat.io/v1`).
    ///   - session: `URLSession` optionnel (pour les tests).
    public init(
        apiKey: String,
        baseURL: String? = nil,
        session: URLSession = .shared
    ) {
        let helper = HTTPHelper(
            apiKey: apiKey,
            baseURL: baseURL ?? "https://api.fluxchat.io/v1",
            session: session
        )
        self.http = helper
        self.knowledge = KnowledgeClient(http: helper)
    }

    // MARK: - Core

    /// Envoie un message à FluxChat et retourne la réponse.
    public func ask(
        message: String,
        context: String? = nil,
        conversationId: String? = nil
    ) async throws -> AskResponse {
        let body = AskRequest(message: message, context: context, conversationId: conversationId)
        return try await http.post("/ask", body: body)
    }

    /// Vérifie la clé API et retourne les informations associées.
    public func testKey() async throws -> KeyInfo {
        return try await http.get("/test-key")
    }
}
