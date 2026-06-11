import Foundation

// MARK: - Request models

struct AskRequest: Encodable {
    let message: String
    let context: String?
    let conversationId: String?

    enum CodingKeys: String, CodingKey {
        case message, context
        case conversationId = "conversation_id"
    }
}

struct KnowledgeRequest: Encodable {
    let title: String
    let content: String
}

// MARK: - Response models

/// Réponse de la méthode `ask`.
public struct AskResponse: Decodable {
    public let text: String
    public let conversationId: String?

    enum CodingKeys: String, CodingKey {
        case text
        case conversationId = "conversation_id"
    }
}

/// Réponse de la méthode `testKey`.
public struct KeyInfo: Decodable {
    public let valid: Bool
    public let organizationId: String?
    public let scopes: [String]

    enum CodingKeys: String, CodingKey {
        case valid
        case organizationId = "organization_id"
        case scopes
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        valid = try container.decodeIfPresent(Bool.self, forKey: .valid) ?? false
        organizationId = try container.decodeIfPresent(String.self, forKey: .organizationId)
        scopes = try container.decodeIfPresent([String].self, forKey: .scopes) ?? []
    }
}

/// Élément de la base de connaissance.
public struct KnowledgeItem: Codable {
    public let id: String?
    public let title: String
    public let content: String
}
