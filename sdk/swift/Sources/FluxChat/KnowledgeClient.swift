import Foundation

/// Helper HTTP interne utilisé par `FluxChatClient` et `KnowledgeClient`.
actor HTTPHelper {
    let apiKey: String
    let baseURL: String
    let session: URLSession

    init(apiKey: String, baseURL: String, session: URLSession = .shared) {
        self.apiKey = apiKey
        self.baseURL = baseURL.hasSuffix("/") ? String(baseURL.dropLast()) : baseURL
        self.session = session
    }

    // MARK: - Public HTTP methods

    func get<T: Decodable>(_ path: String, jwtToken: String? = nil) async throws -> T {
        let req = try buildRequest(method: "GET", path: path, body: nil as String?, jwtToken: jwtToken)
        return try await performEnveloped(req)
    }

    func post<B: Encodable, T: Decodable>(_ path: String, body: B, jwtToken: String? = nil) async throws -> T {
        let req = try buildRequest(method: "POST", path: path, body: body, jwtToken: jwtToken)
        return try await performEnveloped(req)
    }

    func postVoid<B: Encodable>(_ path: String, body: B, jwtToken: String? = nil) async throws {
        let req = try buildRequest(method: "POST", path: path, body: body, jwtToken: jwtToken)
        let (_, response) = try await fetch(req)
        try validateStatus(response, data: Data())
    }

    func patch<B: Encodable, T: Decodable>(_ path: String, body: B, jwtToken: String? = nil) async throws -> T {
        let req = try buildRequest(method: "PATCH", path: path, body: body, jwtToken: jwtToken)
        return try await performEnveloped(req)
    }

    func delete(_ path: String, jwtToken: String? = nil) async throws {
        let req = try buildRequest(method: "DELETE", path: path, body: nil as String?, jwtToken: jwtToken)
        let (_, response) = try await fetch(req)
        try validateStatus(response, data: Data())
    }

    // MARK: - Private helpers

    private func buildRequest<B: Encodable>(
        method: String, path: String, body: B?, jwtToken: String?
    ) throws -> URLRequest {
        guard let url = URL(string: baseURL + path) else {
            throw FluxChatNetworkError("Invalid URL: \(baseURL + path)")
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")

        // Auth routing: JWT for admin routes, X-API-Key for public routes
        if let jwt = jwtToken {
            req.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
        } else {
            req.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        }

        if let body {
            do { req.httpBody = try JSONEncoder().encode(body) }
            catch { throw FluxChatNetworkError("Failed to encode request body", underlying: error) }
        }
        return req
    }

    /// Decodes a response wrapped in { "success": true, "data": ... }
    private func performEnveloped<T: Decodable>(_ req: URLRequest) async throws -> T {
        let (data, response) = try await fetch(req)
        try validateStatus(response, data: data)
        let decoder = JSONDecoder()
        do {
            let envelope = try decoder.decode(APIEnvelope<T>.self, from: data)
            if let payload = envelope.data {
                return payload
            }
            throw FluxChatNetworkError("Response envelope contained no data")
        } catch let e as FluxChatNetworkError { throw e }
        catch { throw FluxChatNetworkError("Failed to decode response", underlying: error) }
    }

    private func fetch(_ req: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: req)
            guard let http = response as? HTTPURLResponse else {
                throw FluxChatNetworkError("Non-HTTP response received")
            }
            return (data, http)
        } catch let e as FluxChatNetworkError { throw e }
        catch { throw FluxChatNetworkError("Network request failed", underlying: error) }
    }

    private func validateStatus(_ response: HTTPURLResponse, data: Data) throws {
        let code = response.statusCode
        guard (200..<300).contains(code) else {
            // Try to extract error message from envelope
            let apiMsg: String
            if let env = try? JSONDecoder().decode(APIEnvelope<String>.self, from: data),
               let msg = env.message {
                apiMsg = msg
            } else {
                apiMsg = HTTPURLResponse.localizedString(forStatusCode: code)
            }
            throw FluxChatApiError(statusCode: code, apiMessage: apiMsg)
        }
    }
}

/// Client Knowledge CRUD, accessible via `FluxChatClient.knowledge`.
public final class KnowledgeClient {
    let http: HTTPHelper
    private let jwtToken: String?

    init(http: HTTPHelper, jwtToken: String? = nil) {
        self.http = http
        self.jwtToken = jwtToken
    }

    /// Liste tous les éléments de la base de connaissance (requiert un JWT).
    public func list() async throws -> [KnowledgeItem] {
        try await http.get("/bot/knowledge", jwtToken: jwtToken)
    }

    /// Récupère un élément par son ID (requiert un JWT).
    public func get(id: String) async throws -> KnowledgeItem {
        try await http.get("/bot/knowledge/\(id)", jwtToken: jwtToken)
    }

    /// Crée un nouvel élément (requiert un JWT).
    public func create(
        title: String,
        content: String,
        category: String? = nil,
        keywords: [String]? = nil
    ) async throws -> KnowledgeItem {
        let body = KnowledgeCreateRequest(
            title: title,
            content: content,
            category: category,
            keywords: keywords
        )
        return try await http.post("/bot/knowledge", body: body, jwtToken: jwtToken)
    }

    /// Met à jour un élément existant avec un patch partiel (requiert un JWT).
    public func update(
        id: String,
        title: String? = nil,
        content: String? = nil,
        category: String? = nil,
        keywords: [String]? = nil,
        isActive: Bool? = nil
    ) async throws -> KnowledgeItem {
        let body = KnowledgePatchRequest(
            title: title,
            content: content,
            category: category,
            keywords: keywords,
            isActive: isActive
        )
        return try await http.patch("/bot/knowledge/\(id)", body: body, jwtToken: jwtToken)
    }

    /// Supprime un élément par son ID (requiert un JWT).
    public func delete(id: String) async throws {
        try await http.delete("/bot/knowledge/\(id)", jwtToken: jwtToken)
    }
}
