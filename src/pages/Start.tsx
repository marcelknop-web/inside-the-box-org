import { useState, useRef, useEffect } from 'react';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { Target, Shield, MessageCircle, Send, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NavLink { url: string; label: string; }
interface AiResponse { message: string; links: NavLink[]; }

const Start = () => {
  const [askActive, setAskActive] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (askActive) inputRef.current?.focus();
  }, [askActive]);

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setResponse(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-navigator`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ question: question.trim() }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Fehler ${resp.status}`);
      }
      const data = await resp.json();
      if (data?.error) throw new Error(data.error);
      setResponse(data as AiResponse);
    } catch (e: any) {
      setError(e.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
    if (e.key === 'Escape') { setAskActive(false); setQuestion(''); setResponse(null); setError(''); }
  };

  const reset = () => { setQuestion(''); setResponse(null); setError(''); };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with consistent styling */}
      <header className="py-8">
        <div className="container mx-auto px-6 flex items-center justify-center md:justify-between">
          <a href="/" className="w-full md:w-auto flex items-center justify-center md:justify-start group">
            <span className="text-primary text-xl font-mono group-hover:text-highlight transition-electric whitespace-nowrap text-center">inside-the-box.org</span>
          </a>
          <nav className="hidden md:flex space-x-4">
            <a href="/why" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">Training</a>
            <a href="/consulting" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">Consulting</a>
            <a href="/by-whom" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">By Whom</a>
            <a href="/contact" className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-base hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-4 py-2">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 flex-1">
        <div className="flex flex-col items-center justify-center text-center space-y-12">
          <div>
            <GeometricSymbol size="lg" />
          </div>

          <div className="w-full max-w-3xl space-y-8">
            <a href="/why" className="block group">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-xl sm:text-2xl lg:text-4xl font-bold hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-4 flex items-center justify-center space-x-4">
                <Target size={32} className="flex-shrink-0" />
                <span>Cyber Training Range</span>
              </div>
            </a>

            <a href="/consulting" className="block group">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-xl sm:text-2xl lg:text-4xl font-bold hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-4 flex items-center justify-center space-x-4">
                <Shield size={32} className="flex-shrink-0" />
                <span>Cybersecurity Consulting</span>
              </div>
            </a>

            {/* Ask me anything – inline */}
            <div className="w-full">
              {!askActive ? (
                <button
                  onClick={() => setAskActive(true)}
                  className="block w-full"
                >
                  <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-base hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2 flex items-center justify-center space-x-4">
                    <MessageCircle size={32} className="flex-shrink-0" />
                    <span>Ask me anything</span>
                  </div>
                </button>
              ) : (
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg transition-electric px-6 py-4 space-y-4">
                  {/* Input row */}
                  <div className="flex items-center space-x-3">
                    <MessageCircle size={28} className="text-highlight flex-shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      className="flex-1 bg-transparent border-none outline-none text-highlight font-mono text-xl sm:text-2xl lg:text-3xl font-bold placeholder:text-highlight/40 placeholder:font-normal"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleAsk()}
                      disabled={isLoading || !question.trim()}
                      className="text-highlight hover:text-primary transition-electric disabled:opacity-30 flex-shrink-0"
                    >
                      {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-destructive text-sm font-mono">{error}</p>
                  )}

                  {/* Response */}
                  {response && (
                    <div className="space-y-3 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="text-foreground text-sm font-mono leading-relaxed">{response.message}</p>
                      {response.links?.length > 0 && (
                        <div className="space-y-2">
                          {response.links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              className="flex items-center justify-between bg-highlight/10 border-2 border-highlight/30 rounded-lg px-4 py-3 text-highlight font-mono text-sm hover:bg-highlight/20 hover:border-highlight/50 transition-electric group"
                            >
                              <span>{link.label}</span>
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                          ))}
                        </div>
                      )}
                      <button onClick={reset} className="text-muted-foreground text-xs font-mono hover:text-highlight transition-electric">
                        Neue Frage stellen →
                      </button>
                    </div>
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
