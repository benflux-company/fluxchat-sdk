import { describe, it, expect, vi } from 'vitest';
import {
  FluxChat,
  FluxChatApiError,
  FluxChatConfigError,
} from '../src/index.js';

/** Build a mock fetch that records the last call and returns a canned body. */
function mockFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const calls: Array<{ url: string; options: any }> = [];
  const fn = vi.fn(async (url: string, options: any) => {
    calls.push({ url, options });
    return {
      ok: init.ok ?? true,
      status: init.status ?? 200,
      text: async () => JSON.stringify(body),
    } as Response;
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

const ORG = '11111111-1111-1111-1111-111111111111';

describe('FluxChat client construction', () => {
  it('throws without credentials', () => {
    expect(() => new FluxChat({} as any)).toThrow(FluxChatConfigError);
  });

  it('accepts an api key', () => {
    const { fn } = mockFetch({});
    expect(() => new FluxChat({ apiKey: 'k', fetch: fn })).not.toThrow();
  });
});

describe('ask', () => {
  it('unwraps the envelope and posts context to /public/bot/ask', async () => {
    const envelope = {
      success: true,
      data: { reply: 'Bonjour', intent: null, confidence: 1, conversationId: '', context: {} },
      timestamp: 'now',
    };
    const { fn, calls } = mockFetch(envelope);
    const client = new FluxChat({ apiKey: 'secret', baseUrl: 'https://api.test/api/v1', fetch: fn });

    const res = await client.ask({ message: 'Salut', context: 'CTX' });

    expect(res.reply).toBe('Bonjour');
    expect(calls[0]!.url).toBe('https://api.test/api/v1/public/bot/ask');
    expect(calls[0]!.options.method).toBe('POST');
    expect(calls[0]!.options.headers['X-API-Key']).toBe('secret');
    const sent = JSON.parse(calls[0]!.options.body);
    expect(sent).toEqual({ message: 'Salut', context: 'CTX', conversationId: undefined, sessionId: undefined });
  });
});

describe('testKey', () => {
  it('GETs /public/bot/test', async () => {
    const { fn, calls } = mockFetch({ success: true, data: { message: 'ok', organizationId: ORG, scopes: ['bot:write'] }, timestamp: 'now' });
    const client = new FluxChat({ apiKey: 'secret', fetch: fn });
    const res = await client.testKey();
    expect(res.organizationId).toBe(ORG);
    expect(calls[0]!.options.method).toBe('GET');
    expect(calls[0]!.url).toContain('/public/bot/test');
  });
});

describe('knowledge', () => {
  it('creates an article at the org-scoped path with bot:write', async () => {
    const { fn, calls } = mockFetch({ success: true, data: { id: 'a1', title: 'T' }, timestamp: 'now' });
    const client = new FluxChat({ apiKey: 'secret', organizationId: ORG, fetch: fn });

    await client.knowledge.create({ title: 'T', content: 'C' });

    expect(calls[0]!.url).toContain(`/bot/organizations/${ORG}/knowledge`);
    expect(calls[0]!.options.method).toBe('POST');
  });

  it('throws when no organizationId is available', async () => {
    const { fn } = mockFetch({});
    const client = new FluxChat({ apiKey: 'secret', fetch: fn });
    await expect(client.knowledge.create({ title: 'T', content: 'C' })).rejects.toThrow(FluxChatConfigError);
  });

  it('lets a per-call orgId override the default', async () => {
    const { fn, calls } = mockFetch({ success: true, data: { message: 'deleted' }, timestamp: 'now' });
    const client = new FluxChat({ apiKey: 'secret', organizationId: ORG, fetch: fn });
    await client.knowledge.remove('a1', 'override-org');
    expect(calls[0]!.url).toContain('/bot/organizations/override-org/knowledge/a1');
    expect(calls[0]!.options.method).toBe('DELETE');
  });
});

describe('error mapping', () => {
  it('throws FluxChatApiError with status and message on non-2xx', async () => {
    const { fn } = mockFetch({ statusCode: 403, message: 'API key missing required scope(s): bot:write' }, { ok: false, status: 403 });
    const client = new FluxChat({ apiKey: 'readonly', fetch: fn });

    await expect(client.knowledge.create({ title: 'T', content: 'C' }, ORG)).rejects.toMatchObject({
      name: 'FluxChatApiError',
      status: 403,
    });
    await expect(client.knowledge.create({ title: 'T', content: 'C' }, ORG)).rejects.toBeInstanceOf(FluxChatApiError);
  });
});

describe('support — human handoff and the visitor thread', () => {
  const thread = {
    ticketId: 't1',
    subject: 'Virement bloqué',
    status: 'in_progress',
    agentConnected: true,
    agentName: 'Awa',
    closed: false,
    messages: [
      { id: 'm1', content: 'Bonjour !', role: 'bot', createdAt: '2026-10-18T09:00:00Z' },
      { id: 'm2', content: 'Mon virement est bloqué', role: 'visitor', createdAt: '2026-10-18T09:01:00Z' },
      { id: 'm3', content: 'Je regarde.', role: 'agent', createdAt: '2026-10-18T09:05:00Z' },
    ],
  };

  it('escalates with the session so the bot transcript follows into the ticket', async () => {
    const { fn, calls } = mockFetch({
      success: true,
      data: { ticketId: 't1', status: 'open' },
      timestamp: 'now',
    });
    const client = new FluxChat({ apiKey: 'secret', baseUrl: 'https://api.test/api/v2', fetch: fn });

    const res = await client.support.escalate({
      name: 'Jordan',
      email: 'jordan@example.com',
      message: 'Je veux parler à quelqu\'un',
      sessionId: 'sess-1',
    });

    expect(res).toEqual({ ticketId: 't1', status: 'open' });
    expect(calls[0]!.url).toBe('https://api.test/api/v2/public/bot/escalate');
    expect(calls[0]!.options.method).toBe('POST');
    expect(JSON.parse(calls[0]!.options.body)).toMatchObject({
      name: 'Jordan',
      email: 'jordan@example.com',
      sessionId: 'sess-1',
    });
  });

  it('reads the thread with the e-mail as proof of ownership, url-encoded', async () => {
    const { fn, calls } = mockFetch({ success: true, data: thread, timestamp: 'now' });
    const client = new FluxChat({ apiKey: 'secret', baseUrl: 'https://api.test/api/v2', fetch: fn });

    const res = await client.support.thread('t1', 'jordan+tag@example.com');

    expect(res.messages.map((m) => m.role)).toEqual(['bot', 'visitor', 'agent']);
    expect(res.agentName).toBe('Awa');
    expect(calls[0]!.options.method).toBe('GET');
    // The '+' must survive as %2B, or the API looks up a different address.
    expect(calls[0]!.url).toBe(
      'https://api.test/api/v2/public/bot/tickets/t1?email=jordan%2Btag%40example.com',
    );
  });

  it('posts a visitor reply into their own ticket', async () => {
    const { fn, calls } = mockFetch({ success: true, data: { ok: true }, timestamp: 'now' });
    const client = new FluxChat({ apiKey: 'secret', baseUrl: 'https://api.test/api/v2', fetch: fn });

    await client.support.reply({
      ticketId: 't1',
      email: 'jordan@example.com',
      content: 'La référence est 4821',
    });

    expect(calls[0]!.url).toBe('https://api.test/api/v2/public/bot/tickets/t1/messages');
    expect(JSON.parse(calls[0]!.options.body)).toEqual({
      email: 'jordan@example.com',
      content: 'La référence est 4821',
    });
  });

  it('surfaces the deliberate 404 when the e-mail does not own the ticket', async () => {
    const { fn } = mockFetch({ statusCode: 404, message: 'Ticket not found' }, { ok: false, status: 404 });
    const client = new FluxChat({ apiKey: 'secret', fetch: fn });

    await expect(client.support.thread('t1', 'someone@else.com')).rejects.toMatchObject({
      name: 'FluxChatApiError',
      status: 404,
    });
  });

  it('surfaces the 403 on a closed ticket instead of swallowing the message', async () => {
    const { fn } = mockFetch({ statusCode: 403, message: 'This ticket is closed' }, { ok: false, status: 403 });
    const client = new FluxChat({ apiKey: 'secret', fetch: fn });

    await expect(
      client.support.reply({ ticketId: 't1', email: 'jordan@example.com', content: 'hello?' }),
    ).rejects.toMatchObject({ name: 'FluxChatApiError', status: 403 });
  });
});
