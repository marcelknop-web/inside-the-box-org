import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Cloud access connection policy', () => {
 it('permits the configured Cloud origin without allowing arbitrary HTTPS connections', () => {
  const html = readFileSync('index.html', 'utf8');
  const env = readFileSync('.env', 'utf8');
  const configuredUrl = env.match(/^VITE_SUPABASE_URL=["']?([^\s"']+)/m)?.[1];
  expect(configuredUrl).toBeDefined();
  if (!configuredUrl) throw new Error('Cloud URL must be configured');
  const connectSources = html.match(/connect-src ([^;]+)/)?.[1].split(/\s+/) ?? [];
  expect(connectSources).toContain(new URL(configuredUrl).origin);
  expect(connectSources).not.toContain('https:');
  expect(connectSources).not.toContain('*');
 });
});