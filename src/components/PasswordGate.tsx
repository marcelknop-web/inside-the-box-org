import { useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Password gate for standalone compliance tools. Verification and unlock-token
 * issuance run on a server-side edge function; the client only stores a
 * short-lived HMAC-signed token it cannot forge, so devtools tampering with
 * sessionStorage no longer bypasses the gate.
 */
interface PasswordGateProps {
  /** Stable id used as scope / storage key (e.g. 'nis2-compliance'). */
  storageKey: string;
  /** Visible label above the input (tool name). */
  label?: string;
  children: ReactNode;
}

export const PasswordGate = ({ storageKey, label, children }: PasswordGateProps) => {
  const sessionKey = `pwgate:${storageKey}`;
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Validate any existing token server-side on mount / scope change.
  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== 'undefined' ? window.sessionStorage.getItem(sessionKey) : null;
    if (!token) {
      setUnlocked(false);
      setChecking(false);
      return;
    }
    (async () => {
      const { data, error: err } = await supabase.functions.invoke('tool-gate', {
        body: { action: 'check', scope: storageKey, token },
      });
      if (cancelled) return;
      if (!err && data?.ok) {
        setUnlocked(true);
      } else {
        window.sessionStorage.removeItem(sessionKey);
        setUnlocked(false);
      }
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [sessionKey, storageKey]);

  const check = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data, error: err } = await supabase.functions.invoke('tool-gate', {
        body: { action: 'verify', scope: storageKey, password: pw },
      });
      if (!err && data?.ok && typeof data.token === 'string') {
        window.sessionStorage.setItem(sessionKey, data.token);
        setUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => setError(false), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (unlocked) return <>{children}</>;
  if (checking) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center px-4 py-12">
        <div className="font-mono text-[11px] text-muted-foreground tracking-[0.3em] uppercase">
          Prüfe Zugang …
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-4 p-8 bg-card/40 border border-primary/20 rounded-xl">
        <div className="font-mono text-[11px] text-muted-foreground tracking-[0.3em] uppercase">
          Restricted Access
        </div>
        {label && (
          <div className="font-mono text-sm text-foreground/80 tracking-wide">
            {label}
          </div>
        )}
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Passwort"
          className={`bg-background/60 border ${error ? 'border-destructive animate-pulse' : 'border-primary/30'} text-foreground rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary w-64 text-center`}
          autoFocus
          disabled={submitting}
        />
        <button
          onClick={check}
          disabled={submitting}
          className="text-xs font-mono text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Prüfe …' : 'Enter →'}
        </button>
      </div>
    </div>
  );
};
