import { useState } from 'react';
import { MessageCircle, Send, X, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NavLink {
  url: string;
  label: string;
}

interface AiResponse {
  message: string;
  links: NavLink[];
}

interface AskNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskNavigator = ({ isOpen, onClose }: AskNavigatorProps) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ask-navigator', {
        body: { question: question.trim() },
      });

      console.log('Edge function response:', { data, fnError });

      if (fnError) {
        console.error('Edge function error details:', fnError, JSON.stringify(fnError));
        throw fnError;
      }
      if (data?.error) throw new Error(data.error);

      setResponse(data as AiResponse);
    } catch (e: any) {
      console.error('Ask navigator catch:', e, typeof e, JSON.stringify(e));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border-2 border-highlight/30 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-highlight/20">
          <div className="flex items-center space-x-3">
            <MessageCircle size={20} className="text-highlight" />
            <span className="font-mono text-highlight text-lg">Ask me anything</span>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="text-muted-foreground hover:text-highlight transition-electric">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!response && !error && (
            <p className="text-muted-foreground text-sm font-mono">
              Stell mir eine Frage und ich zeige dir, wo du die Antwort findest.
            </p>
          )}

          {/* Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="z.B. Wie werde ich NIS2-konform?"
              className="flex-1 bg-background border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-highlight/50 transition-electric"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
              className="bg-highlight/10 border-2 border-highlight/30 rounded-lg px-4 text-highlight hover:bg-highlight/20 hover:border-highlight/50 transition-electric disabled:opacity-40"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive font-mono">
              {error}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
      </div>
    </div>
  );
};

