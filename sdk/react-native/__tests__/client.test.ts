import { FluxChatClient, FluxChatError, FluxChatNetworkError } from '../src/client';

// Mock global fetch
const mockFetch = jest.fn();
globalThis.fetch = mockFetch as any;

describe('FluxChatClient', () => {
  let client: FluxChatClient;

  beforeEach(() => {
    mockFetch.mockClear();
    client = new FluxChatClient({ apiKey: 'test-api-key' });
  });

  // 1. ask — successful response parsing
  it('ask - parses successful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { reply: 'Hello there', conversationId: 'conv-123' } })
    });

    const res = await client.ask('Hello', { conversationId: 'conv-123' });
    expect(res.reply).toBe('Hello there');
    expect(res.conversationId).toBe('conv-123');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://dev-api.fluxchat-corp.com/api/v2/public/bot/ask',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-Key': 'test-api-key'
        }),
        body: expect.stringContaining('"conversationId":"conv-123"')
      })
    );
  });

  // 2. ask — stateless (no conversationId, returns empty conversationId)
  it('ask - stateless without conversationId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { reply: 'Hi', conversationId: '' } })
    });

    const res = await client.ask('Hi');
    expect(res.reply).toBe('Hi');
    expect(res.conversationId).toBe('');
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.not.stringContaining('"conversationId"')
      })
    );
  });

  // 3. testKey — parse organizationId + scopes
  it('testKey - parses organizationId and scopes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { organizationId: 'org-123', scopes: ['admin'] } })
    });

    const res = await client.testKey();
    expect(res.organizationId).toBe('org-123');
    expect(res.scopes).toContain('admin');
  });

  // 4. knowledge.create — create + parse response
  it('knowledge.create - parsing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: 'k-1', title: 'Test Title' } })
    });

    const kb = client.knowledge('jwt-test-token');
    const res = await kb.create('Test Title', 'Content');
    expect(res.id).toBe('k-1');
    expect(res.title).toBe('Test Title');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://dev-api.fluxchat-corp.com/api/v2/bot/knowledge',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer jwt-test-token'
        })
      })
    );
  });

  // 5. knowledge.list — list parsing
  it('knowledge.list - list parsing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [{ id: 'k-1' }, { id: 'k-2' }] })
    });

    const kb = client.knowledge('jwt-test-token');
    const res = await kb.list();
    expect(res.length).toBe(2);
    expect(res[0].id).toBe('k-1');
  });

  // 6. knowledge.delete — 204 handling
  it('knowledge.delete - 204 handling', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => { throw new Error('Should not parse JSON on 204'); }
    });

    const kb = client.knowledge('jwt-test-token');
    await kb.delete('k-1');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://dev-api.fluxchat-corp.com/api/v2/bot/knowledge/k-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  // 7. Network error (connection refused) → typed NetworkError
  it('handles Network error correctly', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(client.testKey()).rejects.toThrow(FluxChatNetworkError);
  });

  // 8. 401 Unauthorized → typed ApiError with status 401
  it('handles 401 Unauthorized correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid API Key' })
    });

    try {
      await client.testKey();
      fail('Expected to throw');
    } catch (e: any) {
      expect(e).toBeInstanceOf(FluxChatError);
      expect(e.statusCode).toBe(401);
      expect(e.message).toContain('Invalid API Key');
    }
  });

  // 9. 403 Forbidden (missing scope) → typed ApiError with status 403
  it('handles 403 Forbidden correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Forbidden' })
    });

    try {
      const kb = client.knowledge('jwt');
      await kb.create('T', 'C');
      fail('Expected to throw');
    } catch (e: any) {
      expect(e).toBeInstanceOf(FluxChatError);
      expect(e.statusCode).toBe(403);
    }
  });
});
