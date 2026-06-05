import {
  FluxChatApiError,
  FluxChatConfigError,
  FluxChatNetworkError,
} from './errors.js';
import type { FluxChatClientOptions } from './types.js';

// Targets API v2 by default — that's where per-request `context` lives.
const DEFAULT_BASE_URL = 'https://dev-api.fluxchat-corp.com/api/v2';
const DEFAULT_TIMEOUT_MS = 30_000;

interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
}

/**
 * Thin fetch wrapper that handles auth, timeouts, error mapping and unwrapping
 * of the FluxChat `{ success, data, timestamp }` response envelope.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly token?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly extraHeaders: Record<string, string>;

  constructor(options: FluxChatClientOptions) {
    this.baseUrl = (
      options.baseUrl ??
      (typeof process !== 'undefined' ? process.env?.FLUXCHAT_BASE_URL : undefined) ??
      DEFAULT_BASE_URL
    ).replace(/\/+$/, '');

    this.apiKey = options.apiKey;
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.extraHeaders = options.headers ?? {};

    const resolvedFetch = options.fetch ?? globalThis.fetch;
    if (!resolvedFetch) {
      throw new FluxChatConfigError(
        'No fetch implementation found. Use Node >= 18 or pass `fetch` in the client options.',
      );
    }
    this.fetchImpl = resolvedFetch;

    if (!this.apiKey && !this.token) {
      throw new FluxChatConfigError(
        'Missing credentials: provide `apiKey` or `token` in the client options.',
      );
    }
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...this.extraHeaders,
    };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    else if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async request<T>({ method, path, body }: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers: this.headers(),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        throw new FluxChatNetworkError(
          `Request to ${path} timed out after ${this.timeoutMs}ms`,
        );
      }
      throw new FluxChatNetworkError(
        `Network error calling ${path}: ${(err as Error).message}`,
      );
    } finally {
      clearTimeout(timer);
    }

    const raw = await response.text();
    const parsed = raw ? safeJsonParse(raw) : undefined;

    if (!response.ok) {
      const message =
        (isRecord(parsed) && typeof parsed.message === 'string' && parsed.message) ||
        `FluxChat API error ${response.status} on ${path}`;
      throw new FluxChatApiError(message, response.status, path, parsed ?? raw);
    }

    // Unwrap the standard envelope: { success, data, timestamp }.
    if (isRecord(parsed) && 'data' in parsed && 'success' in parsed) {
      return parsed.data as T;
    }
    return parsed as T;
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
