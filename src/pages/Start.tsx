import { useState, useRef, useEffect } from 'react';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { Target, Shield, Send, Loader2, MessageCircle } from 'lucide-react';

interface NavLink {
  url: string;
  label: string;
}

interface AiResponse {
  message: string;
  links: NavLink[];
}

const Start = () => {
  const { language, setLanguage, t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (response) inputRef.current?.focus();
  }, [response]);

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jbhfqocscbvcvzlgwvvy.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaGZxb2NzY2J2Y3Z6bGd3dnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTM2NTksImV4cCI6MjA4NzI2OTY1OX0.gwIYZtnr5HEMgEHsFgYOFlyQOpm-KBWTavu0IWEyLyE';
      const res = await fetch(`${supabaseUrl}/functions/v1/ask-navigator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setResponse(data as AiResponse);
      setQuestion('');
    } catch (e: any) {
      console.error('Ask navigator error:', e);
      setError(e.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const reset = () => {
    setQuestion('');
    setResponse(null);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageMeta title={t('start.metaTitle')} description={t('start.metaDesc')} />
      <header className="py-8">
        <div className="container mx-auto px-6 flex items-center justify-center md:justify-between">
          <a href="/" className="w-full md:w-auto flex items-center justify-center md:justify-start group">
            <span className="text-highlight text-xl font-bold font-mono group-hover:text-primary transition-electric whitespace-nowrap text-center">inside-the-box.org</span>
          </a>
          <nav className="hidden md:flex space-x-4 items-center">
            <a href="/why" className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2">{t('nav.training')}</a>
            <a href="/consulting" className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2">{t('nav.consulting')}</a>
            <a href="/by-whom" className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2">{t('nav.byWhom')}</a>
            <a href="/contact" className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2">{t('nav.contact')}</a>
            <button
              onClick={() => setLanguage(nextLanguage(language))}
              className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-sm font-bold hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-3 py-2 uppercase tracking-wider"
            >
              {language.toUpperCase()}
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 flex-1 flex flex-col">
        <div className="flex flex-col items-center justify-start text-center space-y-12 pt-4 md:pt-8">
          <div>
            <GeometricSymbol size="lg" />
          </div>

          <div className="w-full max-w-3xl space-y-8">
            <a href="/why" className="block group">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-xl sm:text-2xl lg:text-4xl font-bold hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-4 flex items-center justify-center space-x-4">
                <Target size={32} className="flex-shrink-0" />
                <span>{t('start.cyberTrainingRange')}</span>
              </div>
            </a>

            <a href="/consulting" className="block group">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-xl sm:text-2xl lg:text-4xl font-bold hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-4 flex items-center justify-center space-x-4">
                <Shield size={32} className="flex-shrink-0" />
                <span>{t('start.cybersecurityConsulting')}</span>
              </div>
            </a>

            {/* Inline Ask Navigator */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  {!question && !isFocused && !response && (
                    <div className="absolute inset-0 flex items-center justify-center space-x-2 text-highlight font-mono text-lg pointer-events-none">
                      <MessageCircle size={20} />
                      <span>{t('start.askMeAnything')}</span>
                    </div>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full bg-highlight/10 border-2 border-highlight/30 rounded-lg px-4 py-4 text-highlight font-mono text-lg text-center placeholder:text-highlight/40 focus:outline-none focus:border-highlight/50 transition-electric"
                    maxLength={1000}
                    disabled={isLoading}
                    placeholder={isFocused || response ? t('start.askMeAnything') : ""}
                  />
                </div>
                {(question.trim() || isLoading) && (
                  <button
                    onClick={handleAsk}
                    disabled={isLoading || !question.trim()}
                    className="bg-highlight/10 border-2 border-highlight/30 rounded-lg px-4 text-highlight hover:bg-highlight/20 hover:border-highlight/50 transition-electric disabled:opacity-40"
                  >
                    {isLoading ? <span className="animate-spin"><Send size={18} /></span> : <Send size={18} />}
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive font-mono">
                  {error}
                </div>
              )}

              {response && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
                  <p className="text-foreground text-lg font-mono leading-relaxed">{response.message}</p>
                  {response.links?.length > 0 && (
                    <ul className="space-y-1 pl-4">
                      {response.links.map((link, i) => (
                        <li key={i} className="list-disc marker:text-primary">
                          <a href={link.url} className="text-primary font-mono text-lg hover:underline transition-electric">
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Start;
