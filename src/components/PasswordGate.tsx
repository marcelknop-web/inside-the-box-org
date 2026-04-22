import { useState, ReactNode, useEffect } from 'react';

/**
 * Lightweight password gate used to protect the standalone compliance tools
 * (NIS-2, DORA, CRA, IEC 62443). Same UX language as the existing ItsmTool
 * gate, but i18n-aware and reusable.
 *
 * Behaviour:
 *  • Hash check via SHA-256 (so the password never ships in source).
 *  • Per-tool unlock stored in `sessionStorage` under a unique storage key,
 *    so every tool gate has to be passed once per browser session.
 *  • Renders the children only after a successful unlock.
 */
const HASH = '673a6941fb53d0f9005625d2816b3a8186fbb694255acb630a99b35982c1f94f';

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface PasswordGateProps {
  /** Stable id used as sessionStorage key (e.g. 'nis2-compliance'). */
  storageKey: string;
  /** Visible label above the input (tool name). */
  label?: string;
  children: ReactNode;
}

export const PasswordGate = ({ storageKey, label, children }: PasswordGateProps) => {
  const sessionKey = `pwgate:${storageKey}`;
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(sessionKey) === '1';
  });
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  // Re-check session storage if storageKey changes (different tool mounted).
  useEffect(() => {
    setUnlocked(window.sessionStorage.getItem(sessionKey) === '1');
  }, [sessionKey]);

  const check = async () => {
    const h = await sha256(pw);
    if (h === HASH) {
      window.sessionStorage.setItem(sessionKey, '1');
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  if (unlocked) return <>{children}</>;

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
        />
        <button
          onClick={check}
          className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
        >
          Enter →
        </button>
      </div>
    </div>
  );
};
