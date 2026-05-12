import { PasswordGate } from '@/components/PasswordGate';
import { Helmet } from 'react-helmet-async';

interface Entry {
  label: string;
  path: string;
  desc: string;
}

interface Section {
  title: string;
  entries: Entry[];
}

const sections: Section[] = [
  {
    title: 'Cyber Resilience',
    entries: [
      { label: 'Krisenmanagement', path: '/cyber-crisis-management', desc: 'Cyber Crisis Management — Strategie, Playbooks, Eskalation.' },
      { label: 'Cyber Training Range', path: '/why', desc: 'Warum Training Range: Lernziele und Mehrwert.' },
      { label: 'Red Team / Arena Training', path: '/arena-training', desc: 'Adversarial Übungen, Angriffsszenarien.' },
      { label: 'Incident Management', path: '/incident-management', desc: 'Erkennung, Triage, Response.' },
      { label: 'BCM', path: '/bcm', desc: 'Business Continuity Management.' },
    ],
  },
  {
    title: 'Regulation & Compliance',
    entries: [
      { label: 'NIS-2 / DORA', path: '/nis2-dora', desc: 'Regulatorische Übersicht NIS-2 und DORA.' },
      { label: 'TTX Training (DORA / NIS-2)', path: '/dora-nis2-ttx', desc: 'Tabletop-Übungen für regulatorische Vorgaben.' },
      { label: 'ISMS / BSI', path: '/isms', desc: 'ISO 27001 und BSI IT-Grundschutz.' },
      { label: 'TISAX / PCI-DSS', path: '/tisax-pci-dss', desc: 'Branchenstandards Automotive und Payment.' },
    ],
  },
  {
    title: 'Governance & Operations',
    entries: [
      { label: 'Virtual CISO', path: '/virtual-ciso', desc: 'CISO as a Service für Mittelstand und Konzerne.' },
      { label: 'SOC Operations', path: '/soc-operations', desc: 'Security Operations Center Aufbau und Betrieb.' },
      { label: 'Assessments & Concepts', path: '/assessments-concepts', desc: 'Reifegrad-Analysen und Sicherheitskonzepte.' },
    ],
  },
  {
    title: 'Insights',
    entries: [
      { label: 'Publications', path: '/publications', desc: 'Fachartikel, Whitepapers, Studien.' },
      { label: 'Events & Workshops', path: '/events-workshops', desc: 'Termine, Roundtables, Trainings.' },
      { label: 'AI Workflows', path: '/ai-workflows', desc: 'KI-basierte Sicherheits- und Compliance-Workflows.' },
      { label: 'KI-Lab', path: '/ki-lab', desc: 'Experimentierfeld für KI in der Cybersicherheit.' },
    ],
  },
  {
    title: 'About',
    entries: [
      { label: 'Profiles / By Whom', path: '/by-whom', desc: 'Berater-Biografien und Kompetenzen.' },
      { label: 'Contact', path: '/contact', desc: 'Kontaktaufnahme.' },
      { label: 'Imprint', path: '/imprint', desc: 'Impressum.' },
    ],
  },
  {
    title: 'Compliance Tools (passwortgeschützt)',
    entries: [
      { label: 'NIS-2 Compliance Tool', path: '/nis2-compliance', desc: 'Audit-Workflow inkl. PDF-Report nach NIS-2.' },
      { label: 'DORA Compliance Tool', path: '/dora-nis2-ttx', desc: 'DORA Selbstbewertung mit Edge-Function-Reasoning.' },
      { label: 'CRA / IACS-E27', path: '/iacs-e27', desc: 'Cyber Resilience Act + UR E27 Marine.' },
      { label: 'IEC 62443', path: '/iec62443', desc: 'OT-Security nach IEC 62443.' },
      { label: 'TISAX Assessment Classifier', path: '/tisax-pci-dss', desc: 'AL1–AL3 Klassifizierungs-Wizard.' },
      { label: 'PCI-DSS SAQ Navigator', path: '/tisax-pci-dss', desc: 'Selbstbewertungs-Pfad-Wizard.' },
      { label: 'EU AI Act Readiness', path: '/ai-act-readiness', desc: 'Risikoklassifizierung nach Reg. (EU) 2024/1689.' },
      { label: 'DORA Incident Reporter', path: '/nis2-dora', desc: 'Major-Incident-Bewertung nach Art. 18 DORA.' },
      { label: 'ISCP TTX Prioritizer', path: '/dora-nis2-ttx', desc: 'Szenario-Priorisierung für Tabletop-Übungen.' },
      { label: 'TTX Readiness', path: '/ttx-readiness', desc: 'Reifegrad-Check für Krisenübungen.' },
    ],
  },
  {
    title: 'Standalone Tools',
    entries: [
      { label: 'TTX Admin Dashboard', path: '/ttx-admin', desc: 'Admin-Konsole für TTX-Anmeldungen.' },
      { label: 'ITSM Tool', path: '/itsm', desc: 'IT-Service-Management Hilfstool (passwortgeschützt).' },
      { label: 'ITSM Dev Tool', path: '/itsm-dev', desc: 'Entwicklerfassung des ITSM-Tools.' },
    ],
  },
  {
    title: 'Games & Simulators',
    entries: [
      { label: 'Cyber Crisis Simulator', path: '/cyber-crisis-management', desc: 'KI-Krisensimulation mit Echtzeit-Chat.' },
      { label: 'CISO Simulator', path: '/virtual-ciso', desc: 'Entscheidungs-Simulation für CISO-Alltag.' },
      { label: 'SOC Life', path: '/soc-life', desc: 'Idle-Game zum SOC-Betrieb.' },
      { label: 'OT SOC Life', path: '/ot-soc-life', desc: 'OT-Variante des SOC-Idle-Games.' },
      { label: 'NIS-2 Awareness Quiz', path: '/nis2-dora', desc: 'Quiz zu NIS-2 Grundlagen.' },
      { label: 'Threat Drop Quiz', path: '/arena-training', desc: 'Bedrohungs-Quiz im Drop-Format.' },
      { label: 'SKS Navigation Quiz', path: '/sks-quiz', desc: 'Maritime Navigation Trainingsquiz.' },
      { label: 'Cyber Frogger', path: '/arena-training', desc: 'Arcade-Spiel mit Security-Bezug.' },
      { label: 'Trigger Triage', path: '/incident-management', desc: 'Alert-Triage-Trainer.' },
      { label: 'Butterfly Effect Lab', path: '/ki-lab', desc: 'Kausalketten-Visualisierung.' },
      { label: 'Elite Ship Scene', path: '/ki-lab', desc: 'WebGL Demo-Szene.' },
      { label: 'Enigma', path: '/enigma', desc: 'Enigma-Maschine Simulation.' },
      { label: 'Bockbär Bot', path: '/bockbaer-bot', desc: 'Persona-Chatbot Demo.' },
      { label: 'Nordstern', path: '/nordstern', desc: 'Maritime Nautik-Lerngame.' },
    ],
  },
];

const SitemapContent = () => (
  <div className="min-h-screen bg-background text-foreground px-6 py-12 md:px-12">
    <Helmet>
      <title>Sitemap — Inside the Box</title>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
    <div className="max-w-4xl mx-auto">
      <header className="mb-12 border-b border-primary/20 pb-6">
        <div className="font-mono text-[11px] text-muted-foreground tracking-[0.3em] uppercase mb-2">
          Internal Index
        </div>
        <h1 className="font-mono text-3xl text-foreground">Inhaltsverzeichnis</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
          Vollständiger Index aller öffentlichen und internen Inhalte. Nicht in der Navigation verlinkt.
        </p>
      </header>

      <div className="space-y-10">
        {sections.map(section => (
          <section key={section.title}>
            <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-primary mb-4">
              {section.title}
            </h2>
            <ul className="space-y-3">
              {section.entries.map(entry => (
                <li key={entry.label + entry.path} className="bg-card/40 border border-primary/10 rounded-md p-4 hover:border-primary/30 transition-colors">
                  <a
                    href={entry.path}
                    className="font-mono text-sm text-foreground hover:text-primary transition-colors"
                  >
                    {entry.label}
                    <span className="ml-2 text-[10px] text-muted-foreground">{entry.path}</span>
                  </a>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {entry.desc}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-16 pt-6 border-t border-primary/10 font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
        End of Index
      </footer>
    </div>
  </div>
);

const Sitemap = () => (
  <PasswordGate storageKey="sitemap-index" label="Sitemap / Index">
    <SitemapContent />
  </PasswordGate>
);

export default Sitemap;
