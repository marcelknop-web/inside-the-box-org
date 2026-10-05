import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { ToolAccessIntro } from '@/components/ToolAccessIntro';
import { TOOL_INTRODUCTIONS } from '@/data/toolIntroductions';
import { Button } from '@/components/ui/button';

const HASH = '673a6941fb53d0f9005625d2816b3a8186fbb694255acb630a99b35982c1f94f';

async function sha256(text: string) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function LegacyToolGate({ introKey, frameSrc, title }: { introKey: 'itsm' | 'itsm-dev'; frameSrc: string; title: string }) {
  const { language } = useLanguage();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const intro = TOOL_INTRODUCTIONS.find((item) => item.key === introKey);

  const check = async () => {
    if (await sha256(password) === HASH) setUnlocked(true);
    else {
      setError(true);
      window.setTimeout(() => setError(false), 1500);
    }
  };

  if (unlocked) return <iframe src={frameSrc} className="fixed inset-0 z-[9999] h-full w-full border-none" title={title} />;
  if (!intro) return null;

  const login = (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 border border-primary/20 bg-card p-6 sm:p-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {language === 'de' ? 'Zugang beschränkt' : language === 'fr' ? 'Accès restreint' : 'Restricted access'}
      </div>
      <div className="font-mono text-sm text-foreground/80">{title}</div>
      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && check()} placeholder={language === 'de' ? 'Passwort' : language === 'fr' ? 'Mot de passe' : 'Password'} className={`w-64 rounded border bg-background/60 px-4 py-2 text-center font-mono text-sm text-foreground focus:border-primary focus:outline-none ${error ? 'border-destructive animate-pulse' : 'border-primary/30'}`} />
      <Button variant="ghost" className="font-mono text-xs text-primary" onClick={check}>
        {language === 'de' ? 'Öffnen →' : language === 'fr' ? 'Ouvrir →' : 'Open →'}
      </Button>
    </div>
  );

  return <ToolAccessIntro intro={intro} language={language} login={login} />;
}