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
