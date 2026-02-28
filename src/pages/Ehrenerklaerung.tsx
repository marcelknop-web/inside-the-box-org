import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageMeta } from '@/components/PageMeta';
import { Lock, Check, ArrowLeft, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

const Ehrenerklaerung = () => {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', company: '', role: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Check existing token on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('ehren_token');
    if (stored) {
      supabase.functions.invoke('verify-access', {
        body: { action: 'verify', token: stored },
      }).then(({ data }) => {
        if (data?.valid) setToken(stored);
        else sessionStorage.removeItem('ehren_token');
        setChecking(false);
      }).catch(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-access', {
        body: { action: 'login', password },
      });
      if (fnError || data?.error) {
        setError('Ungültiges Passwort');
      } else if (data?.token) {
        sessionStorage.setItem('ehren_token', data.token);
        setToken(data.token);
      }
    } catch {
      setError('Verbindungsfehler');
    }
    setLoading(false);
  }, [password]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Verify token is still valid
    const { data } = await supabase.functions.invoke('verify-access', {
      body: { action: 'verify', token },
    });
    if (!data?.valid) {
      setToken(null);
      sessionStorage.removeItem('ehren_token');
      setError('Sitzung abgelaufen. Bitte erneut anmelden.');
      return;
    }

    // Generate PDF
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Ehrenerklärung', 105, 30, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const lines = [
      `Vorname: ${formData.firstName}`,
      `Nachname: ${formData.lastName}`,
      `Unternehmen: ${formData.company}`,
      `Funktion: ${formData.role}`,
      `Datum: ${formData.date}`,
      '',
      'Hiermit erkläre ich, dass ich die mir anvertrauten',
      'Informationen vertraulich behandle und nicht an',
      'unbefugte Dritte weitergebe.',
      '',
      'Ich verpflichte mich zur Einhaltung der geltenden',
      'Datenschutz- und Geheimhaltungsvorschriften.',
    ];

    lines.forEach((line, i) => doc.text(line, 20, 50 + i * 8));
    doc.save(`Ehrenerklaerung_${formData.lastName}_${formData.date}.pdf`);
    setSubmitted(true);
  }, [token, formData]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <PageMeta title="Ehrenerklärung" description="Geschütztes Formular" />
      <div className="max-w-lg mx-auto">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-highlight transition-colors mb-6 font-mono">
          <ArrowLeft size={14} /> Zurück
        </a>

        {!token ? (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="text-primary" size={24} />
              <h1 className="text-xl font-bold font-mono text-primary">Ehrenerklärung</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Dieses Dokument ist passwortgeschützt. Bitte geben Sie das Zugangspasswort ein.
            </p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              {error && <p className="text-destructive text-sm font-mono">{error}</p>}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-mono text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Zugang anfordern'}
              </button>
            </form>
          </div>
        ) : submitted ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
            <Check className="text-success mx-auto" size={40} />
            <h2 className="text-lg font-bold font-mono text-primary">PDF erstellt</h2>
            <p className="text-sm text-muted-foreground">Die Ehrenerklärung wurde als PDF heruntergeladen.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-primary text-sm font-mono underline hover:opacity-80"
            >
              Weiteres Formular ausfüllen
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h1 className="text-xl font-bold font-mono text-primary">Ehrenerklärung</h1>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
              {(['firstName', 'lastName', 'company', 'role'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-mono text-muted-foreground mb-1 uppercase">
                    {field === 'firstName' ? 'Vorname' : field === 'lastName' ? 'Nachname' : field === 'company' ? 'Unternehmen' : 'Funktion'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[field]}
                    onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1 uppercase">Datum</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {error && <p className="text-destructive text-sm font-mono">{error}</p>}
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-mono text-sm font-bold hover:opacity-90 transition-opacity"
              >
                PDF generieren & herunterladen
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ehrenerklaerung;
