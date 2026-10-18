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
    ///   - baseURL: URL de base optionnelle (défaut : `https://api.fluxchat-corp.com/api/v2`).
    ///   - session: `URLSession` optionnel (pour les tests).
    public init(
        apiKey: String,
        baseURL: String? = nil,
        session: URLSession = .shared
    ) {
        self.http = HTTPHelper(
            apiKey: apiKey,
            baseURL: baseURL ?? "https://api.fluxchat-corp.com/api/v2",
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

    // MARK: - Support

    /// Transfert vers un humain et fil de support du visiteur.
    ///
    /// Nécessite que le plan de l'organisation inclue `supportTickets`.
    public func support() -> SupportClient {
        return SupportClient(http: http)
    }
}

// MARK: - SupportClient

/// Transfert vers un humain et fil de support du visiteur.
///
/// Le visiteur n'a ni compte ni session : l'e-mail avec lequel il a demandé un
/// humain est ce qui prouve que le ticket est le sien, en lecture comme en
/// écriture. La recherche est aussi limitée à l'organisation de la clé API.
///
/// Le fil se lit en polling — il n'y a pas de socket sur la surface publique.
/// 5 secondes est la cadence du widget officiel, et celle pour laquelle les
/// quotas de la route sont dimensionnés.
public final class SupportClient {
    private let http: HTTPClient

    init(http: HTTPClient) {
        self.http = http
    }

    /// Transfère un visiteur à un humain : crée un vrai ticket de support.
    ///
    /// - Parameter sessionId: le même que celui passé à `ask`. S'il est
    ///   fourni, tout ce que le bot a déjà dit est recopié dans le ticket,
    ///   pour que l'agent prenne la conversation en cours de route.
    public func escalate(
        name: String,
        email: String,
        message: String,
        sessionId: String? = nil
    ) async throws -> EscalateResult {
        let body = EscalateRequest(name: name, email: email, message: message, sessionId: sessionId)
        return try await http.post("/public/bot/escalate", body: body)
    }

    /// Lit le fil du ticket, chaque ligne étiquetée par rôle.
    ///
    /// Lève une erreur 404 aussi bien quand le ticket n'existe pas que quand
    /// `email` n'est pas celui avec lequel il a été ouvert : les deux cas sont
    /// volontairement indiscernables, pour qu'un id deviné n'apprenne rien.
    public func thread(ticketId: String, email: String) async throws -> TicketThread {
        let id = encode(ticketId)
        let mail = encode(email)
        return try await http.get("/public/bot/tickets/\(id)?email=\(mail)")
    }

    /// Poste la réponse du visiteur dans son propre ticket.
    ///
    /// Une réponse sur un ticket `resolved` le rouvre ; un ticket `closed`
    /// refuse l'écriture (403) plutôt que d'avaler un message que personne
    /// ne lira.
    public func reply(ticketId: String, email: String, content: String) async throws {
        let body = TicketReplyRequest(email: email, content: content)
        try await http.postVoid("/public/bot/tickets/\(encode(ticketId))/messages", body: body)
    }

    /// `+` et `@` doivent survivre encodés, sinon l'API cherche une autre adresse.
    private func encode(_ value: String) -> String {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        return value.addingPercentEncoding(withAllowedCharacters: allowed) ?? value
    }
}
