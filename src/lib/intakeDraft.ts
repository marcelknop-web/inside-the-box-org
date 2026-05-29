import { supabase } from '@/integrations/supabase/client';

// ── Persistence helpers for IACS UR E26 / E27 intake data ──────────
//
// Two layers:
//  1. Local auto-save (localStorage) — survives reloads / crashes on the
//     same device. This is the always-on safety net.
//  2. Cloud save/load (edge function + DB) — produces a short code so the
//     intake can be restored on any device or shared with a colleague.
//
// Uploaded documents are stored as their *extracted text* only (no binary
// files are ever persisted), so a restored draft keeps full evidence.

const PREFIX = 'iec-intake-draft:';

export interface DraftEnvelope<T> {
  sub: number;
  data: T;
  savedAt: number;
}

export function loadLocalDraft<T>(key: string): DraftEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEnvelope<T>;
    if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalDraft<T>(key: string, env: DraftEnvelope<T>): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(env));
  } catch {
    // ignore quota / serialization errors — local save is best-effort
  }
}

export function clearLocalDraft(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

// Files that were still being read when the draft was saved can never finish
// reading after a reload (the original File object is gone). Normalise any
// lingering "pending" status so the assessment gate is never blocked forever.
export function sanitizeDraftFiles<T extends { files?: Array<{ extractStatus?: string;[k: string]: unknown }> }>(
  data: T,
): T {
  if (!data || !Array.isArray(data.files)) return data;
  return {
    ...data,
    files: data.files.map((f) =>
      f.extractStatus === 'pending'
        ? { ...f, extractStatus: 'error', extractError: 'Please re-upload this document.' }
        : f,
    ),
  };
}

export async function saveCloudDraft<T>(tool: string, data: T): Promise<string> {
  const { data: res, error } = await supabase.functions.invoke('intake-draft', {
    body: { action: 'save', tool, data },
  });
  if (error) throw error;
  if (!res?.code) throw new Error('No code returned from server.');
  return res.code as string;
}

export async function loadCloudDraft<T>(code: string): Promise<{ tool: string; data: T }> {
  const { data: res, error } = await supabase.functions.invoke('intake-draft', {
    body: { action: 'load', code: code.trim() },
  });
  if (error) throw error;
  if (!res?.data) throw new Error('Draft not found for this code.');
  return { tool: res.tool as string, data: res.data as T };
}
