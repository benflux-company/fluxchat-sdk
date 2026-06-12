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
