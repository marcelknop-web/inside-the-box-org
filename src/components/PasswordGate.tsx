import { useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { ToolAccessIntro } from '@/components/ToolAccessIntro';
import { getToolIntroduction } from '@/data/toolIntroductions';
import { Button } from '@/components/ui/button';

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
  const { language } = useLanguage();
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

  const login = (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 border border-primary/20 bg-card p-6 sm:p-8">
        <div className="font-mono text-[11px] text-muted-foreground tracking-[0.3em] uppercase">
          {language === 'de' ? 'Zugang beschränkt' : language === 'fr' ? 'Accès restreint' : 'Restricted access'}
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
          placeholder={language === 'de' ? 'Passwort' : language === 'fr' ? 'Mot de passe' : 'Password'}
          className={`bg-background/60 border ${error ? 'border-destructive animate-pulse' : 'border-primary/30'} text-foreground rounded px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary w-64 text-center`}
          disabled={submitting}
        />
        <Button
          variant="ghost"
          onClick={check}
          disabled={submitting}
          className="font-mono text-xs text-primary"
        >
          {submitting ? (language === 'de' ? 'Prüfe …' : language === 'fr' ? 'Vérification…' : 'Checking…') : (language === 'de' ? 'Öffnen →' : language === 'fr' ? 'Ouvrir →' : 'Open →')}
        </Button>
      </div>
  );

  const intro = getToolIntroduction(storageKey, label);
  if (intro) return <ToolAccessIntro intro={intro} language={language} login={login} />;
  return <div className="min-h-[60vh] w-full flex items-center justify-center px-4 py-12">{login}</div>;
};
