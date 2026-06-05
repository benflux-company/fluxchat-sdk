import type { HttpClient } from '../http.js';
import { FluxChatConfigError } from '../errors.js';
import type { BotConfig } from '../types.js';

/**
 * Per-organization bot persona configuration.
 *
 * `get` requires org membership; `update` requires a JWT admin token.
 */
export class ConfigResource {
  constructor(
    private readonly http: HttpClient,
    private readonly defaultOrgId?: string,
  ) {}

  private orgId(explicit?: string): string {
    const id = explicit ?? this.defaultOrgId;
    if (!id) {
      throw new FluxChatConfigError(
        'organizationId is required. Pass it to the method or set it in the client options.',
      );
    }
    return id;
  }

  /** Read the organization's bot persona config. */
  async get(organizationId?: string): Promise<BotConfig> {
    return this.http.request<BotConfig>({
      method: 'GET',
      path: `/bot/organizations/${this.orgId(organizationId)}/config`,
    });
  }

  /** Update the persona config (assistant name, tone, style rules, …). */
  async update(patch: BotConfig, organizationId?: string): Promise<BotConfig> {
    return this.http.request<BotConfig>({
      method: 'PATCH',
      path: `/bot/organizations/${this.orgId(organizationId)}/config`,
      body: patch,
    });
  }
}
