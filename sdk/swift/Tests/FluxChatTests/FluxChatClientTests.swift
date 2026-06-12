import XCTest
import Foundation
@testable import FluxChat

// MARK: - MockURLProtocol

final class MockURLProtocol: URLProtocol {
    static var handler: ((URLRequest) -> (Data, HTTPURLResponse))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = MockURLProtocol.handler else {
            client?.urlProtocol(self, didFailWithError: URLError(.unknown))
            return
        }
        let (data, response) = handler(request)
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

// MARK: - Helper

func makeMockClient(status: Int, body: Any) -> FluxChatClient {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [MockURLProtocol.self]
    let session = URLSession(configuration: config)

    MockURLProtocol.handler = { _ in
        let data = try! JSONSerialization.data(withJSONObject: body)
        let response = HTTPURLResponse(
            url: URL(string: "https://dev-api.fluxchat-corp.com/api/v2")!,
            statusCode: status,
            httpVersion: nil,
            headerFields: ["Content-Type": "application/json"]
        )!
        return (data, response)
    }

    return FluxChatClient(apiKey: "test-key", session: session)
}

/// Helpers to build v2 envelopes
func envelope(_ data: Any) -> [String: Any] {
    return ["success": true, "data": data]
}

func errorEnvelope(message: String) -> [String: Any] {
    return ["success": false, "message": message]
}

// MARK: - Tests

final class FluxChatClientTests: XCTestCase {

    // ─── ask ──────────────────────────────────────────────────────────────────

    func testAsk_returnsValidResponse() async throws {
        let client = makeMockClient(status: 200, body: envelope([
            "reply": "Bonjour !",
            "conversationId": "conv-1"
        ]))

        let response = try await client.ask(message: "Bonjour")

        XCTAssertEqual(response.reply, "Bonjour !")
        XCTAssertEqual(response.conversationId, "conv-1")
    }

    func testAsk_withContextAndSessionId() async throws {
        let client = makeMockClient(status: 200, body: envelope([
            "reply": "Réponse",
            "conversationId": "conv-abc"
        ]))

        let response = try await client.ask(
            message: "Question",
            context: "support",
            conversationId: "conv-abc",
            sessionId: "session-user-xyz"
        )

        XCTAssertEqual(response.conversationId, "conv-abc")
    }

    func testAsk_throwsApiError_on401() async {
        let client = makeMockClient(status: 401, body: errorEnvelope(message: "Invalid key"))

        do {
            _ = try await client.ask(message: "test")
            XCTFail("Expected FluxChatApiError")
        } catch let e as FluxChatApiError {
            XCTAssertEqual(e.statusCode, 401)
            XCTAssertEqual(e.apiMessage, "Invalid key")
        } catch {
            XCTFail("Unexpected error type: \(error)")
        }
    }

    // ─── testKey ──────────────────────────────────────────────────────────────

    func testTestKey_returnsValidKeyInfo() async throws {
        let client = makeMockClient(status: 200, body: envelope([
            "organizationId": "org-123",
            "scopes": ["ask", "knowledge"]
        ]))

        let info = try await client.testKey()

        XCTAssertEqual(info.organizationId, "org-123")
        XCTAssertTrue(info.scopes.contains("ask"))
    }

    // ─── knowledge ────────────────────────────────────────────────────────────

    func testKnowledge_list_returnsItems() async throws {
        let client = makeMockClient(status: 200, body: envelope([
            ["id": "1", "title": "FAQ", "content": "Contenu"]
        ]))

        let kb = client.knowledge(jwtToken: "test-jwt")
        let items = try await kb.list()

        XCTAssertEqual(items.count, 1)
        XCTAssertEqual(items.first?.title, "FAQ")
    }

    func testKnowledge_create_returnsItem() async throws {
        let client = makeMockClient(status: 200, body: envelope([
            "id": "2", "title": "Nouveau", "content": "Mon contenu"
        ]))

        let kb = client.knowledge(jwtToken: "test-jwt")
        let item = try await kb.create(title: "Nouveau", content: "Mon contenu")

        XCTAssertEqual(item.id, "2")
        XCTAssertEqual(item.title, "Nouveau")
    }

    // ─── Errors ───────────────────────────────────────────────────────────────

    func testFluxChatApiError_errorDescription() {
        let err = FluxChatApiError(statusCode: 404, apiMessage: "Not found")
        XCTAssertTrue(err.errorDescription?.contains("404") ?? false)
    }

    func testFluxChatNetworkError_errorDescription() {
        let err = FluxChatNetworkError("Connection refused")
        XCTAssertTrue(err.errorDescription?.contains("Connection refused") ?? false)
    }
}
