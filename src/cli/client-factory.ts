import { FluxChat } from '../client.js';
import { FluxChatConfigError } from '../errors.js';
import type { FluxChatClientOptions } from '../types.js';

export interface GlobalOptions {
  apiKey?: string;
  token?: string;
  baseUrl?: string;
  org?: string;
}

/**
 * Resolve credentials from CLI flags, falling back to environment variables,
 * and build a FluxChat client. Exposed separately so it can be unit-tested
 * without spinning up the whole CLI.
 */
export function createClient(opts: GlobalOptions): FluxChat {
  const env = (typeof process !== 'undefined' ? process.env : {}) ?? {};

  const options: FluxChatClientOptions = {
    apiKey: opts.apiKey ?? env.FLUXCHAT_API_KEY,
    token: opts.token ?? env.FLUXCHAT_TOKEN,
    baseUrl: opts.baseUrl ?? env.FLUXCHAT_BASE_URL,
    organizationId: opts.org ?? env.FLUXCHAT_ORG_ID,
  };

  if (!options.apiKey && !options.token) {
    throw new FluxChatConfigError(
      'No credentials. Pass --api-key (or set FLUXCHAT_API_KEY), or --token (FLUXCHAT_TOKEN).',
    );
  }

  return new FluxChat(options);
}

/** Split a comma-separated CLI value into a trimmed string array. */
export function parseList(value?: string): string[] | undefined {
  if (value === undefined) return undefined;
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Parse a boolean-ish CLI value ("true"/"false"/"1"/"0"). */
export function parseBool(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}
