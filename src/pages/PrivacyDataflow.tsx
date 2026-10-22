import { Helmet } from 'react-helmet-async';

interface ToolFlow {
  id: string;
  name: string;
  purpose: string;
  inputs: string;
  ai: string;
  output: string;
}

const tools: ToolFlow[] = [
  {
    id: 'ur27',
    name: 'UR27 Compliance Tool',
    purpose: 'Selbstbewertung gemäß UN R155/R156 (Cybersecurity & Software Updates).',
    inputs: 'Asset-/Fahrzeug-Beschreibung, Antworten zu Anforderungen, Evidenz-Notizen.',
    ai: 'Reasoning über Lovable AI Gateway (EU, anonym, Gemini). Kein Account, kein User-Tracking.',
    output: 'PDF-Report wird clientseitig im Browser erzeugt (jsPDF). Kein Upload.',
  },
  {
    id: 'nis2',
    name: 'NIS-2 Compliance Tool',
    purpose: 'Reifegradbewertung gemäß NIS-2-Richtlinie / BSI-Umsetzung.',
    inputs: 'Sektor, Größenklasse, Kontrollen-Antworten, Maßnahmen-Evidenz.',
    ai: 'Reasoning über Lovable AI Gateway (EU, anonym).',
    output: 'PDF clientseitig. Keine Persistenz.',
  },
  {
    id: 'cra',
    name: 'CRA Compliance Tool',
    purpose: 'Cyber Resilience Act — Produkt- und Prozess-Konformitätsprüfung.',
    inputs: 'Produktklasse, Anforderungs-Antworten, Belege.',
    ai: 'Reasoning über Lovable AI Gateway (EU, anonym).',
    output: 'PDF clientseitig. Keine Speicherung serverseitig.',
  },
  {
    id: 'dora',
    name: 'DORA Compliance Tool',
    purpose: 'Digital Operational Resilience Act — Finanzsektor-Assessment.',
    inputs: 'Entitätsdaten, ICT-Risikoantworten, Drittparteien-Notizen.',
    ai: 'Reasoning über Lovable AI Gateway (EU, anonym).',
    output: 'PDF clientseitig. Keine Datenbank-Persistenz.',
  },
  {
    id: 'aiact',
    name: 'EU AI Act Readiness Assessment',
    purpose: 'Klassifizierung & Readiness gemäß EU AI Act (Risikostufen, Annex III, GPAI).',
    inputs: 'Systembeschreibung, Use-Case, Antworten zu Anforderungen.',
    ai: 'Reasoning über Lovable AI Gateway (EU, anonym).',
    output: 'PDF clientseitig erzeugt. Keine Cloud-Speicherung.',
  },
];

const PrivacyDataflowContent = () => (
  <div className="min-h-screen bg-background text-foreground px-6 py-12 md:px-12">
    <Helmet>
      <title>Datenschutz & Datenfluss — Compliance Tools</title>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 border-b border-primary/20 pb-6">
        <div className="font-mono text-[11px] text-muted-foreground tracking-[0.3em] uppercase mb-2">
          Privacy / Data Flow
        </div>
        <h1 className="font-mono text-3xl text-foreground">Datenschutz & Datenfluss</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          Transparente Darstellung, was mit Eingaben in den Compliance-Tools geschieht.
          Keine Übertragung in Drittländer, keine Persistenz, keine Profilbildung.
        </p>
      </header>

      <section className="bg-card/40 border border-primary/10 rounded-md p-6 mb-10">
        <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-primary mb-4">
          Kernprinzipien
        </h2>
        <ul className="space-y-3 text-sm text-foreground/90 leading-relaxed">
          <li>
            <span className="font-mono text-primary">[1]</span>{' '}
            <strong>Client-seitig:</strong> Alle Eingaben verbleiben im Browser-Speicher der laufenden
            Sitzung. Keine Speicherung in einer Datenbank.
          </li>
          <li>
            <span className="font-mono text-primary">[2]</span>{' '}
            <strong>EU-Hosting:</strong> Backend-Infrastruktur (Lovable Cloud) wird in der EU betrieben.
          </li>
          <li>
            <span className="font-mono text-primary">[3]</span>{' '}
            <strong>Keine USA-Übertragung:</strong> Eingaben und KI-Anfragen werden nicht an US-Anbieter
            (OpenAI, Anthropic direkt o. Ä.) übertragen. KI-Reasoning läuft anonymisiert über das
            EU-basierte Lovable AI Gateway.
          </li>
          <li>
            <span className="font-mono text-primary">[4]</span>{' '}
            <strong>Keine Persistenz:</strong> Nach dem Schließen des Browser-Tabs sind die Daten weg.
            PDF-Reports werden lokal generiert und nur lokal heruntergeladen.
          </li>
          <li>
            <span className="font-mono text-primary">[5]</span>{' '}
            <strong>Keine Profilbildung:</strong> Kein Login, kein User-Tracking, keine Analytics-Cookies
            in den Tools. Anfragen sind anonym.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-primary mb-4">
          Datenfluss pro Tool
        </h2>
        <ul className="space-y-4">
          {tools.map(tool => (
            <li
              key={tool.id}
              className="bg-card/40 border border-primary/10 rounded-md p-5"
            >
              <div className="font-mono text-sm text-foreground mb-3">{tool.name}</div>
              <dl className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-xs">
                <dt className="font-mono uppercase tracking-wider text-muted-foreground">Zweck</dt>
                <dd className="text-foreground/90 leading-relaxed">{tool.purpose}</dd>
                <dt className="font-mono uppercase tracking-wider text-muted-foreground">Eingaben</dt>
                <dd className="text-foreground/90 leading-relaxed">{tool.inputs}</dd>
                <dt className="font-mono uppercase tracking-wider text-muted-foreground">KI-Verarbeitung</dt>
                <dd className="text-foreground/90 leading-relaxed">{tool.ai}</dd>
                <dt className="font-mono uppercase tracking-wider text-muted-foreground">Ergebnis</dt>
                <dd className="text-foreground/90 leading-relaxed">{tool.output}</dd>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-card/40 border border-primary/10 rounded-md p-6 mb-10">
        <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-primary mb-4">
          Technischer Pfad einer Anfrage
        </h2>
        <pre className="font-mono text-[11px] text-foreground/90 leading-relaxed overflow-x-auto">
{`Browser (Eingabe)
   |
   |  HTTPS / TLS 1.3
   v
Lovable Cloud Edge Function  (EU-Region)
   |
   |  serverseitig anonymisierter Prompt
   v
Lovable AI Gateway  (EU)
   |
   v
LLM-Antwort  -->  Edge Function  -->  Browser
                                        |
                                        v
                                   PDF lokal (jsPDF)`}
        </pre>
      </section>

      <section className="bg-card/40 border border-primary/10 rounded-md p-6 mb-10">
        <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-primary mb-4">
          Was NICHT passiert
        </h2>
        <ul className="space-y-2 text-sm text-foreground/90 leading-relaxed list-disc pl-5">
          <li>Keine Übertragung an US-Cloud-Anbieter.</li>
          <li>Keine Speicherung der Audit-Inhalte in einer Datenbank.</li>
          <li>Keine Weitergabe an Dritte, kein Re-Selling von Eingaben.</li>
          <li>Keine Verwendung der Eingaben zum Modell-Training.</li>
          <li>Keine personenbezogene Auswertung — Anfragen sind anonym.</li>
        </ul>
      </section>

      <section className="bg-card/40 border border-primary/10 rounded-md p-6 mb-10">
        <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-primary mb-4">
          Empfehlung an Nutzer
        </h2>
        <p className="text-sm text-foreground/90 leading-relaxed">
          Auch wenn keine Persistenz erfolgt: Eingaben sollten so anonymisiert sein, wie es der
          Selbstbewertungs-Zweck zulässt. Personennamen, Kundendaten oder Geheimnisse sind für ein
          Reifegrad-Assessment nicht erforderlich.
        </p>
      </section>

      <footer className="mt-12 pt-6 border-t border-primary/10 font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
        Stand 2026 — Internal Reference Page
      </footer>
    </div>
  </div>
);

const PrivacyDataflow = () => <PrivacyDataflowContent />;

export default PrivacyDataflow;
