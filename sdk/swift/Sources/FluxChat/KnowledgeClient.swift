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

    private var defaultHeaders: [String: String] {
        [
            "Authorization": "Bearer \(apiKey)",
            "Content-Type": "application/json",
            "Accept": "application/json",
        ]
    }

    func get<T: Decodable>(_ path: String) async throws -> T {
        let req = try buildRequest(method: "GET", path: path, body: nil as String?)
        return try await perform(req)
    }

    func post<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        let req = try buildRequest(method: "POST", path: path, body: body)
        return try await perform(req)
    }

    func put<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        let req = try buildRequest(method: "PUT", path: path, body: body)
        return try await perform(req)
    }

    func delete(_ path: String) async throws {
        let req = try buildRequest(method: "DELETE", path: path, body: nil as String?)
        let (_, response) = try await fetch(req)
        try validateStatus(response)
    }

    // MARK: - Private

    private func buildRequest<B: Encodable>(
        method: String, path: String, body: B?
    ) throws -> URLRequest {
        guard let url = URL(string: baseURL + path) else {
            throw FluxChatNetworkError("Invalid URL: \(baseURL + path)")
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        defaultHeaders.forEach { req.setValue($1, forHTTPHeaderField: $0) }
        if let body {
            do { req.httpBody = try JSONEncoder().encode(body) }
            catch { throw FluxChatNetworkError("Failed to encode request body", underlying: error) }
        }
        return req
    }

    private func perform<T: Decodable>(_ req: URLRequest) async throws -> T {
        let (data, response) = try await fetch(req)
        try validateStatus(response)
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw FluxChatNetworkError("Failed to decode response", underlying: error)
        }
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

    private func validateStatus(_ response: HTTPURLResponse) throws {
        let code = response.statusCode
        guard (200..<300).contains(code) else {
            throw FluxChatApiError(statusCode: code, apiMessage: HTTPURLResponse.localizedString(forStatusCode: code))
        }
    }
}

/// Client Knowledge CRUD, accessible via `FluxChatClient.knowledge`.
public final class KnowledgeClient {
    let http: HTTPHelper

    init(http: HTTPHelper) { self.http = http }

    public func list() async throws -> [KnowledgeItem] {
        try await http.get("/knowledge")
    }

    public func get(id: String) async throws -> KnowledgeItem {
        try await http.get("/knowledge/\(id)")
    }

    public func create(title: String, content: String) async throws -> KnowledgeItem {
        try await http.post("/knowledge", body: KnowledgeRequest(title: title, content: content))
    }

    public func update(id: String, title: String, content: String) async throws -> KnowledgeItem {
        try await http.put("/knowledge/\(id)", body: KnowledgeRequest(title: title, content: content))
    }

    public func delete(id: String) async throws {
        try await http.delete("/knowledge/\(id)")
    }
}
