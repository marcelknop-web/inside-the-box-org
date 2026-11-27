import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordGate } from './PasswordGate';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke } } }));

describe('Sea-Shield access gate', () => {
 beforeEach(() => { sessionStorage.clear(); invoke.mockReset(); });
 afterEach(() => cleanup());
 it('does not expose the workspace before server authorization', () => {
  render(<PasswordGate storageKey="sea-shield"><div>Protected workspace</div></PasswordGate>);
  expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
  expect(invoke).not.toHaveBeenCalled();
 });
 it('keeps rejected credentials locked and unlocks only after server verification', async () => {
  invoke.mockResolvedValueOnce({ data: { ok: false }, error: null });
  render(<PasswordGate storageKey="sea-shield"><div>Protected workspace</div></PasswordGate>);
  fireEvent.change(screen.getByPlaceholderText('Passwort'), { target: { value: 'incorrect' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enter →' }));
  await waitFor(() => expect(invoke).toHaveBeenCalledWith('tool-gate', { body: { action: 'verify', scope: 'sea-shield', password: 'incorrect' } }));
  await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
  invoke.mockResolvedValueOnce({ data: { ok: true, token: 'server-issued-test-token' }, error: null });
  fireEvent.click(screen.getByRole('button', { name: 'Enter →' }));
  expect(await screen.findByText('Protected workspace')).toBeInTheDocument();
  expect(sessionStorage.getItem('pwgate:sea-shield')).toBe('server-issued-test-token');
 });
 it('rejects a tampered session token instead of trusting browser storage', async () => {
  sessionStorage.setItem('pwgate:sea-shield', 'forged-token');
  invoke.mockResolvedValueOnce({ data: { ok: false }, error: null });
  render(<PasswordGate storageKey="sea-shield"><div>Protected workspace</div></PasswordGate>);
  await screen.findByPlaceholderText('Passwort');
  expect(invoke).toHaveBeenCalledWith('tool-gate', { body: { action: 'check', scope: 'sea-shield', token: 'forged-token' } });
  expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
  expect(sessionStorage.getItem('pwgate:sea-shield')).toBeNull();
 });
});