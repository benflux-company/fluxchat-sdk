import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FluxChat } from '../src/index.js';
import {
  createClient,
  parseBool,
  parseList,
} from '../src/cli/client-factory.js';
import { buildProgram } from '../src/cli/program.js';

describe('createClient', () => {
  const saved = { ...process.env };
  beforeEach(() => {
    delete process.env.FLUXCHAT_API_KEY;
    delete process.env.FLUXCHAT_TOKEN;
    delete process.env.FLUXCHAT_ORG_ID;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it('builds a client from explicit flags', () => {
    const client = createClient({ apiKey: 'k', org: 'o' });
    expect(client).toBeInstanceOf(FluxChat);
  });

  it('falls back to environment variables', () => {
    process.env.FLUXCHAT_API_KEY = 'env-key';
    expect(createClient({})).toBeInstanceOf(FluxChat);
  });

  it('throws when no credentials are present', () => {
    expect(() => createClient({})).toThrow(/No credentials/);
  });
});

describe('parsers', () => {
  it('parseList splits and trims', () => {
    expect(parseList('a, b ,c')).toEqual(['a', 'b', 'c']);
    expect(parseList(undefined)).toBeUndefined();
  });
  it('parseBool understands truthy strings', () => {
    expect(parseBool('true')).toBe(true);
    expect(parseBool('0')).toBe(false);
    expect(parseBool(undefined)).toBeUndefined();
  });
});

describe('buildProgram', () => {
  it('registers the expected top-level commands', () => {
    const program = buildProgram();
    const names = program.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['ask', 'config', 'kb', 'test']);
  });

  it('exposes kb subcommands', () => {
    const program = buildProgram();
    const kb = program.commands.find((c) => c.name() === 'kb')!;
    const subs = kb.commands.map((c) => c.name()).sort();
    expect(subs).toEqual(['create', 'delete', 'get', 'list', 'update']);
  });
});
