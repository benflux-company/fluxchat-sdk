import Foundation

/// Client principal FluxChat pour Swift (iOS & macOS).
///
/// ```swift
/// let client = FluxChatClient(apiKey: "sk-...")
///
/// // Envoyer un message
/// let response = try await client.ask(message: "Bonjour !")
/// print(response.reply)
///
/// // Vérifier la clé
/// let info = try await client.testKey()
/// print(info.organizationId)
///
/// // CRUD Knowledge (avec JWT)
/// let kb = client.knowledge(jwtToken: "eyJhbGci...")
/// let items = try await kb.list()
/// ```
public final class FluxChatClient {
    private let http: HTTPHelper

    /// Initialise un nouveau client FluxChat.
    /// - Parameters:
    ///   - apiKey: Votre clé API FluxChat.
    ///   - baseURL: URL de base optionnelle (défaut : `https://dev-api.fluxchat-corp.com/api/v2`).
    ///   - session: `URLSession` optionnel (pour les tests).
    public init(
        apiKey: String,
        baseURL: String? = nil,
        session: URLSession = .shared
    ) {
        self.http = HTTPHelper(
            apiKey: apiKey,
            baseURL: baseURL ?? "https://dev-api.fluxchat-corp.com/api/v2",
            session: session
        )
    }

    // MARK: - Core

    /// Envoie un message à FluxChat et retourne la réponse.
    /// - Parameters:
    ///   - message: Le message à envoyer.
    ///   - context: Contexte optionnel pour le bot.
    ///   - conversationId: ID de conversation existante.
    ///   - sessionId: ID de session pour maintenir le contexte entre les appels.
    public func ask(
        message: String,
        context: String? = nil,
        conversationId: String? = nil,
        sessionId: String? = nil
    ) async throws -> AskResponse {
        let body = AskRequest(
            message: message,
            context: context,
            conversationId: conversationId,
            sessionId: sessionId
        )
        return try await http.post("/public/bot/ask", body: body)
    }

    /// Vérifie la clé API et retourne les informations associées.
    public func testKey() async throws -> KeyInfo {
        return try await http.get("/public/bot/test")
    }

    /// Capture passivement le contenu d'une page pour la base de connaissance.
    /// - Parameters:
    ///   - url: L'URL de la page capturée.
    ///   - title: Le titre de la page.
    ///   - content: Le contenu textuel visible de la page.
    public func capturePage(url: String, title: String, content: String) async throws {
        let body = CapturePageRequest(url: url, title: title, content: content)
        try await http.postVoid("/public/bot/pages", body: body)
    }

    // MARK: - Knowledge

    /// Retourne un client pour les opérations CRUD Knowledge Base.
    /// - Parameter jwtToken: Le JWT requis pour les opérations d'administration.
    public func knowledge(jwtToken: String) -> KnowledgeClient {
        return KnowledgeClient(http: http, jwtToken: jwtToken)
    }
}
