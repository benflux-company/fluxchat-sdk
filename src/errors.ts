/**
 * Base error for every failure surfaced by the FluxChat SDK.
 */
export class FluxChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FluxChatError';
  }
}

/**
 * Thrown when the SDK is misconfigured (e.g. no credentials, missing orgId).
 */
export class FluxChatConfigError extends FluxChatError {
  constructor(message: string) {
    super(message);
    this.name = 'FluxChatConfigError';
  }
}

/**
 * Thrown when the API responds with a non-2xx status.
 */
export class FluxChatApiError extends FluxChatError {
  /** HTTP status code. */
  readonly status: number;
  /** Request path that failed. */
  readonly path: string;
  /** Raw response body, when available. */
  readonly body: unknown;

  constructor(message: string, status: number, path: string, body: unknown) {
    super(message);
    this.name = 'FluxChatApiError';
    this.status = status;
    this.path = path;
    this.body = body;
  }
}

/** Thrown when a request times out or the network fails. */
export class FluxChatNetworkError extends FluxChatError {
  constructor(message: string) {
    super(message);
    this.name = 'FluxChatNetworkError';
  }
}
