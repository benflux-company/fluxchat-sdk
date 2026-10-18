import Foundation

// MARK: - Envelope

struct APIEnvelope<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let message: String?
}

// MARK: - Request models

struct AskRequest: Encodable {
    let message: String
    let context: String?
    let conversationId: String?
    let sessionId: String?
}

struct CapturePageRequest: Encodable {
    let url: String
    let title: String
    let content: String
}

struct KnowledgeCreateRequest: Encodable {
    let title: String
    let content: String
    let category: String?
    let keywords: [String]?
}

struct KnowledgePatchRequest: Encodable {
    let title: String?
    let content: String?
    let category: String?
    let keywords: [String]?
    let isActive: Bool?
}

// MARK: - Response models

/// Réponse de la méthode `ask`.
public struct AskResponse: Decodable {
    public let reply: String
    public let conversationId: String?
}

/// Réponse de la méthode `testKey`.
public struct KeyInfo: Decodable {
    public let organizationId: String
    public let scopes: [String]
}

/// Élément de la base de connaissance.
public struct KnowledgeItem: Codable {
    public let id: String?
    public let title: String?
    public let content: String?
    public let category: String?
    public let keywords: [String]?
    public let isActive: Bool?
    public let createdAt: String?
}

// MARK: - Support (transfert humain et fil du visiteur)

struct EscalateRequest: Encodable {
    let name: String
    let email: String
    let message: String
    let sessionId: String?
}

struct TicketReplyRequest: Encodable {
    let email: String
    let content: String
}

/// Réponse de `SupportClient.escalate`.
public struct EscalateResult: Decodable {
    /// Id du ticket créé — à conserver avec l'e-mail pour suivre le fil.
    public let ticketId: String
    /// Statut à la création (`open`, ou plus haut sur un plan priority-support).
    public let status: String
}

/// Qui a écrit une ligne du fil.
public enum TicketMessageRole: String, Decodable {
    case bot, visitor, agent
}

public struct TicketMessage: Decodable {
    public let id: String
    public let content: String
    public let role: TicketMessageRole
    public let createdAt: String?
}

/// Fil complet d'un ticket, tel que le visiteur le voit.
public struct TicketThread: Decodable {
    public let ticketId: String
    public let subject: String
    /// `open` | `in_progress` | `resolved` | `closed`.
    public let status: String
    /// Vrai une fois qu'un humain a réellement écrit, pas seulement été assigné.
    public let agentConnected: Bool
    public let agentName: String?
    /// `resolved` ou `closed` : le visiteur peut lire mais plus écrire.
    public let closed: Bool
    public let messages: [TicketMessage]
}
