import { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageCircle, Shield, Target, BookOpen, AlertTriangle, Eye, Flame, Swords, Calendar, FileText, UserCheck, ChevronLeft, Menu } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';

interface NavLink {
  url: string;
  label: string;
}

interface AiResponse {
  message: string;
  links: NavLink[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  links?: NavLink[];
}

const SERVICE_CHATS = [
  { icon: Shield, label: 'ISMS ISO 27001, BSI GS', route: '/isms' },
  { icon: BookOpen, label: 'NIS-2, DORA, PART-IS', route: '/nis2-dora' },
  { icon: Eye, label: 'TISAX, PCI-DSS', route: '/tisax-pci-dss' },
  { icon: AlertTriangle, label: 'Assessments & Konzepte', route: '/assessments-concepts' },
  { icon: Flame, label: 'Incident Management', route: '/incident-management' },
  { icon: Swords, label: 'Cyber-Krisenmanagement', route: '/cyber-crisis-management' },
  { icon: Target, label: 'Arena Training, TIBER', route: '/arena-training' },
  { icon: Calendar, label: 'Events & Workshops', route: '/events-workshops' },
  { icon: FileText, label: 'Publikationen & Training', route: '/publications' },
  { icon: UserCheck, label: 'Virtual CISO', route: '/virtual-ciso' },
  { icon: Target, label: 'Cyber Training Range', route: '/why' },
];

const ChatView = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

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
        body: JSON.stringify({ question: userMsg }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: AiResponse = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, links: data.links }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <PageMeta title="inside-the-box" description="Cybersecurity Navigator" />

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 flex-shrink-0 overflow-hidden`}
      >
        <div className="w-64 h-full flex flex-col bg-card border-r border-border">
          {/* New Chat button */}
          <div className="p-3">
            <button
              onClick={newChat}
              className="w-full flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-mono text-foreground hover:bg-secondary transition-electric"
            >
              <Plus size={16} />
              <span>Neuer Chat</span>
            </button>
          </div>

          {/* Service list as "past chats" */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <p className="px-2 py-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">Services</p>
            {SERVICE_CHATS.map((svc, i) => (
              <a
                key={i}
                href={svc.route}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-electric group"
              >
                <svc.icon size={14} className="flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                <span className="truncate font-mono text-xs">{svc.label}</span>
              </a>
            ))}
          </div>

          {/* Bottom */}
          <div className="border-t border-border p-3">
            <span className="text-xs font-mono text-muted-foreground">inside-the-box.org</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 border-b border-border flex items-center px-3 gap-2 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-electric"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm font-mono text-foreground">inside-the-box Navigator</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle size={24} className="text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-mono text-foreground mb-2">Wie kann ich helfen?</h1>
              <p className="text-sm text-muted-foreground font-mono text-center max-w-md">
                Fragen Sie mich zu unseren Cybersecurity-Services, Training oder Beratung.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle size={14} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-mono leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-secondary text-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    <p>{msg.content}</p>
                    {msg.links && msg.links.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {msg.links.map((link, j) => (
                          <li key={j}>
                            <a
                              href={link.url}
                              className="text-primary hover:underline text-xs"
                            >
                              → {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={14} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-1 py-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-secondary rounded-2xl border border-border focus-within:border-primary/40 transition-electric">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Nachricht an inside-the-box…"
                className="flex-1 bg-transparent px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none max-h-[200px]"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="m-1.5 p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/80 transition-electric"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono text-center mt-2">
              inside-the-box Navigator kann Fehler machen. Angaben bitte prüfen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
