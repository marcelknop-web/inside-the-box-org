import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { Progress } from '@/components/ui/progress';

// ── Konstanten ──────────────────────────────────────────────────

const PRODUCT_TYPES = [
  { id: 'iot', label: 'IoT-Gerät', icon: '📡', desc: 'Sensor, Gateway, Smart Device' },
  { id: 'embed', label: 'Embedded System', icon: '🔧', desc: 'Firmware, Controller, SPS' },
  { id: 'sw', label: 'Software-Produkt', icon: '💻', desc: 'Desktop- oder Server-Anwendung' },
  { id: 'mobile', label: 'Mobile App', icon: '📱', desc: 'iOS oder Android App' },
  { id: 'cloud', label: 'Cloud-Dienst', icon: '☁️', desc: 'SaaS, PaaS, Web-API' },
  { id: 'hw', label: 'Hardware-Produkt', icon: '🖥️', desc: 'Ohne eigene Software' },
  { id: 'network', label: 'Netzwerkgerät', icon: '🌐', desc: 'Router, Switch, Firewall' },
  { id: 'kombi', label: 'Kombiniertes Produkt', icon: '⚙️', desc: 'Hardware + Software zusammen' },
];

const CRA_CLASSES = [
  { id: 'default', label: 'Default', color: 'border-green-500 bg-green-500/10 text-green-400', desc: 'Die meisten Produkte fallen hierunter. Selbstbewertung erlaubt.', example: 'Einfache Smart-Home-Geräte, Standard-Software ohne besondere Kritikalität' },
  { id: 'k1', label: 'Klasse I', color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400', desc: 'Erhöhtes Risiko. Zertifizierung durch Dritte oder Einhaltung harmonisierter Normen nötig.', example: 'Browser, Passwort-Manager, VPN-Produkte, Betriebssysteme' },
  { id: 'k2', label: 'Klasse II', color: 'border-orange-500 bg-orange-500/10 text-orange-400', desc: 'Hohes Risiko. Pflicht zur Drittprüfung durch akkreditierte Stelle.', example: 'Industrielle Router, Sicherheitskameras, SCADA-Systeme, Firewalls' },
  { id: 'krit', label: 'Kritisch', color: 'border-destructive bg-destructive/10 text-destructive', desc: 'Kritische Infrastruktur. EU-Typprüfung erforderlich.', example: 'Sicherheitsprodukte für kritische Infrastruktur, HSMs' },
];

const DEPLOYMENT_OPTS = [
  { id: 'cloud', label: 'Cloud', icon: '☁️' },
  { id: 'onprem', label: 'On-Premises', icon: '🏢' },
  { id: 'hybrid', label: 'Hybrid', icon: '🔀' },
  { id: 'embedded', label: 'Embedded/Edge', icon: '🔌' },
  { id: 'mobile', label: 'Mobil', icon: '📱' },
];

const COMPONENT_OPTS = [
  'Web-Frontend', 'Mobile App', 'REST-API', 'GraphQL-API', 'Datenbank', 'Cloud-Backend',
  'Embedded Firmware', 'MQTT-Broker', 'OPC-UA Server', 'Message Queue', 'Authentication-Service',
  'Admin-Interface', 'Update-Service', 'Logging/Monitoring', 'VPN-Gateway', 'WLAN/LAN-Stack',
];

const INTERFACE_OPTS = [
  { label: 'HTTPS/REST', icon: '🔒' }, { label: 'HTTP', icon: '⚠️' }, { label: 'MQTT (TLS)', icon: '🔒' },
  { label: 'MQTT (unverschl.)', icon: '⚠️' }, { label: 'WebSocket', icon: '🔗' }, { label: 'SSH', icon: '🔑' },
  { label: 'USB', icon: '🖇️' }, { label: 'Bluetooth', icon: '📶' }, { label: 'WLAN', icon: '📡' },
  { label: 'LAN/Ethernet', icon: '🔌' }, { label: 'OPC-UA', icon: '🏭' }, { label: 'Modbus', icon: '🏭' },
  { label: 'SNMP', icon: '📊' }, { label: 'FTP/SFTP', icon: '📁' }, { label: 'SMTP', icon: '📧' },
  { label: 'Proprietäres Protokoll', icon: '❓' },
];

const ROLE_PRESETS = [
  'Administrator', 'Standard-Nutzer', 'Wartungstechniker', 'Nur-Lesen Nutzer',
  'API-Client (Maschine)', 'Externer Dienstleister', 'Auditor', 'Entwickler (Dev-Zugang)',
];

const SECURITY_MEASURES = [
  { id: 'tls', label: 'TLS/HTTPS Verschlüsselung', cat: 'Kommunikation' },
  { id: 'auth', label: 'Benutzerauthentifizierung', cat: 'Zugang' },
  { id: 'mfa', label: 'Multi-Faktor-Authentifizierung', cat: 'Zugang' },
  { id: 'rbac', label: 'Rollenbasierte Zugriffsrechte', cat: 'Zugang' },
  { id: 'fw', label: 'Firewall', cat: 'Netzwerk' },
  { id: 'vpn', label: 'VPN', cat: 'Netzwerk' },
  { id: 'patch', label: 'Patch-Management-Prozess', cat: 'Betrieb' },
  { id: 'log', label: 'Logging & Audit-Trail', cat: 'Monitoring' },
  { id: 'monitor', label: 'Monitoring / Alerting', cat: 'Monitoring' },
  { id: 'pentest', label: 'Regelmäßige Pentests', cat: 'Prüfung' },
  { id: 'sbom', label: 'SBOM vorhanden', cat: 'Dokumentation' },
  { id: 'ir', label: 'Incident Response Prozess', cat: 'Betrieb' },
  { id: 'secboot', label: 'Secure Boot', cat: 'Firmware' },
  { id: 'codesign', label: 'Code Signing / Firmware Signing', cat: 'Firmware' },
  { id: 'encrypt', label: 'Datenverschlüsselung at rest', cat: 'Daten' },
];

const ATTACH_TYPES = [
  { id: 'arch', label: 'Architekturdiagramm', icon: '🗺️', accept: '.pdf,.png,.jpg,.jpeg,.svg,.pptx,.vsdx,.drawio' },
  { id: 'pentest', label: 'Pentestbericht', icon: '🔍', accept: '.pdf,.docx' },
  { id: 'policy', label: 'Security Policy', icon: '📋', accept: '.pdf,.docx' },
  { id: 'sbom', label: 'SBOM', icon: '📦', accept: '.json,.xml,.csv,.txt,.spdx' },
  { id: 'other', label: 'Sonstiges Dokument', icon: '📎', accept: '*' },
];

// ── Demo-Daten ──────────────────────────────────────────────────

interface Threat {
  id: number; stride: string; name: string; component: string; attacker: string; path: string; cra: string; likelihood: number; impact: number;
}

const THREATS: Threat[] = [
  { id: 1, stride: 'S', name: 'Spoofing des MQTT-Brokers', component: 'MQTT-Interface', attacker: 'Externer Angreifer', path: 'Angreifer positioniert sich als legitimer MQTT-Broker → Gerät verbindet sich mit False-Server → Datenabfluss', cra: 'Annex I, Part I, Nr. 3', likelihood: 3, impact: 4 },
  { id: 2, stride: 'T', name: 'Manipulation der Firmware via OTA', component: 'OTA-Update-Client', attacker: 'Supply-Chain-Angreifer / Insider', path: 'Unsigniertes Firmware-Paket → Gerät installiert Malware → Persistente Kompromittierung', cra: 'Annex I, Part I, Nr. 1', likelihood: 2, impact: 5 },
  { id: 3, stride: 'T', name: 'Parameter-Manipulation REST-API', component: 'REST-API-Server', attacker: 'Authentifizierter Nutzer', path: 'Manipulierte API-Parameter → kein Input-Validation → Konfigurationsänderung außerhalb Berechtigung', cra: 'Annex I, Part I, Nr. 3', likelihood: 4, impact: 3 },
  { id: 4, stride: 'R', name: 'Fehlende Audit-Logs Admin', component: 'Web-UI Admin', attacker: 'Interner Nutzer', path: 'Admin-Aktionen nicht protokolliert → nicht nachvollziehbar → Compliance-Problem', cra: 'Annex I, Part I, Nr. 8', likelihood: 3, impact: 3 },
  { id: 5, stride: 'I', name: 'Klartext-MQTT (Port 1883)', component: 'MQTT-Interface', attacker: 'Netzwerk-Mitleser (MITM)', path: 'Unverschlüsselte MQTT-Verbindung → Passwort-Sniffing → Vollzugriff auf Sensordaten', cra: 'Annex I, Part I, Nr. 4', likelihood: 4, impact: 4 },
  { id: 6, stride: 'D', name: 'DoS auf MQTT-Broker', component: 'MQTT-Broker', attacker: 'Externer Angreifer', path: 'Flood-Angriff → Broker-Überlastung → Produktionsausfall', cra: 'Annex I, Part I, Nr. 7', likelihood: 3, impact: 4 },
  { id: 7, stride: 'E', name: 'Standard-Admin-Passwort aktiv', component: 'Web-UI Admin', attacker: 'Opportunistischer Angreifer', path: 'Standard-Passwort nicht geändert → Vollzugriff ohne Aufwand', cra: 'Annex I, Part I, Nr. 2', likelihood: 5, impact: 5 },
  { id: 8, stride: 'E', name: 'Session-Hijacking Web-UI', component: 'Web-UI Admin', attacker: 'Netzwerk-Angreifer', path: 'Unsicheres Session-Management → Token-Diebstahl → Admin-Zugriff ohne Authentifizierung', cra: 'Annex I, Part I, Nr. 3', likelihood: 3, impact: 4 },
];

interface CraReq {
  id: string; article: string; name: string; status: 'pass' | 'partial' | 'fail'; gap: string; measure: string;
}

const CRA_REQS: CraReq[] = [
  { id: 'A1-1', article: 'Annex I, Part I, Nr. 1', name: 'Keine bekannten Schwachstellen', status: 'partial', gap: 'OTA-Signaturprüfung fehlt, CVE-Tracking nicht formalisiert', measure: 'Signierten Update-Prozess implementieren, SBOM erstellen, CVE-Monitoring einrichten' },
  { id: 'A1-2', article: 'Annex I, Part I, Nr. 2', name: 'Secure by Default', status: 'fail', gap: 'Standard-Passwort aktiv, unsichere Default-Konfigurationen', measure: 'Passwort-Änderung beim Erststart erzwingen, unsichere Ports deaktivieren' },
  { id: 'A1-3', article: 'Annex I, Part I, Nr. 3', name: 'Schutz vor unbefugtem Zugriff', status: 'fail', gap: 'Kein MFA, schwaches Session-Management, MQTT ohne Auth', measure: 'MFA für Admin implementieren, MQTT-Authentifizierung aktivieren, Session-Tokens sichern' },
  { id: 'A1-4', article: 'Annex I, Part I, Nr. 4', name: 'Vertraulichkeit der Daten', status: 'fail', gap: 'MQTT-Verbindung unverschlüsselt (Port 1883)', measure: 'MQTT nur über TLS (Port 8883), Port 1883 deaktivieren' },
  { id: 'A1-7', article: 'Annex I, Part I, Nr. 7', name: 'Verfügbarkeit & Ausfallsicherheit', status: 'partial', gap: 'Kein Rate-Limiting auf MQTT-Broker', measure: 'Rate-Limiting, Connection-Throttling und Watchdog implementieren' },
  { id: 'A1-8', article: 'Annex I, Part I, Nr. 8', name: 'Sicherheits-Logging & Monitoring', status: 'fail', gap: 'Admin-Aktionen nicht protokolliert', measure: 'Audit-Log für alle Admin-Aktionen, Log-Rotation, sichere Log-Übertragung' },
  { id: 'A2-1', article: 'Annex I, Part II, Nr. 1', name: 'Schwachstellen-Identifikation', status: 'partial', gap: 'Kein formaler Prozess, keine regelmäßigen Pentests dokumentiert', measure: 'Vulnerability-Management-Prozess definieren' },
  { id: 'A2-8', article: 'Annex I, Part II, Nr. 8', name: 'SBOM', status: 'fail', gap: 'Keine SBOM vorhanden', measure: 'SBOM in SPDX oder CycloneDX Format erstellen' },
  { id: 'Art14', article: 'Artikel 14', name: 'Meldepflichten (24h/72h)', status: 'fail', gap: 'Kein Incident-Response-Prozess, keine ENISA-Melderoute', measure: 'IR-Prozess dokumentieren, Meldewege zu ENISA/BSI definieren' },
  { id: 'Art13', article: 'Artikel 13', name: 'Technische Dokumentation', status: 'partial', gap: 'Unvollständige Architektur-Doku, keine Risikoanalyse vorhanden', measure: 'Technische Dokumentation nach Annex VII vervollständigen' },
];

const STRIDE_META: Record<string, { label: string; dot: string; badge: string }> = {
  S: { label: 'Spoofing', dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  T: { label: 'Tampering', dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  R: { label: 'Repudiation', dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  I: { label: 'Info Disclosure', dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  D: { label: 'Denial of Service', dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  E: { label: 'Elevation of Priv.', dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

const MAIN_STEPS = ['System Intake', 'Threat Modeling', 'Risk Assessment', 'CRA Mapping', 'Report'];

// ── Hilfsfunktionen ─────────────────────────────────────────────

function riskLevel(l: number, i: number) {
  const s = l * i;
  if (s >= 20) return { label: 'Kritisch', cls: 'bg-destructive text-destructive-foreground' };
  if (s >= 13) return { label: 'Hoch', cls: 'bg-orange-500 text-white' };
  if (s >= 6) return { label: 'Mittel', cls: 'bg-yellow-500 text-black' };
  return { label: 'Niedrig', cls: 'bg-green-500 text-white' };
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pass') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">✔ Erfüllt</span>;
  if (status === 'partial') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">⚠ Teilweise</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">✕ Lücke</span>;
}

function ScoreBar({ value }: { value: number }) {
  const pct = (value / 5) * 100;
  const color = value >= 4 ? 'bg-destructive' : value >= 3 ? 'bg-orange-500' : 'bg-yellow-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-secondary rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold w-4 text-muted-foreground font-mono">{value}</span>
    </div>
  );
}

// ── Hilfskomponenten ────────────────────────────────────────────

function InfoBox({ icon = '💡', title, children, color = 'blue' }: { icon?: string; title?: string; children: React.ReactNode; color?: 'blue' | 'amber' | 'green' }) {
  const colors = {
    blue: 'bg-primary/10 border-primary/20 text-foreground',
    amber: 'bg-warning/10 border-warning/20 text-foreground',
    green: 'bg-green-500/10 border-green-500/20 text-foreground',
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${colors[color]}`}>
      {title && <div className="font-semibold mb-1">{icon} {title}</div>}
      {!title && <span className="font-semibold">{icon} </span>}
      <span>{children}</span>
    </div>
  );
}

function Chip({ label, selected, onClick, icon, desc }: { label: string; selected: boolean; onClick: () => void; icon?: string; desc?: string }) {
  const sel = selected
    ? 'border-primary bg-primary/10 text-foreground shadow-sm'
    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary';
  return (
    <button onClick={onClick} className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 text-left transition-all ${sel}`}>
      {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
      <div>
        <div className="font-medium">{label}</div>
        {desc && <div className="text-xs opacity-70 mt-0.5">{desc}</div>}
      </div>
      {selected && <span className="ml-auto flex-shrink-0 text-xs text-primary">✓</span>}
    </button>
  );
}

function SubStepHeader({ current, total, title, subtitle }: { current: number; total: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i < current ? 'bg-primary' : i === current ? 'bg-primary/60' : 'bg-secondary'}`} />
        ))}
        <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">{current + 1}/{total}</span>
      </div>
      <div className="text-base font-bold text-foreground">{title}</div>
      {subtitle && <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>}
    </div>
  );
}

// ── Intake-Daten-Typ ────────────────────────────────────────────

interface IntakeData {
  productName: string;
  version: string;
  productTypes: string[];
  craClass: string;
  description: string;
  components: string[];
  deployment: string;
  interfaces: string[];
  roles: string[];
  customRole: string;
  measures: string[];
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

const EMPTY_INTAKE: IntakeData = {
  productName: '', version: '', productTypes: [], craClass: '',
  description: '', components: [], deployment: '',
  interfaces: [], roles: [], customRole: '',
  measures: [], knownIssues: '', files: [],
};

// ── GUIDED INTAKE WIZARD ───────────────────────────────────────

function IntakeWizard({ onFinish }: { onFinish: (d: IntakeData) => void }) {
  const [sub, setSub] = useState(0);
  const [d, setD] = useState<IntakeData>(EMPTY_INTAKE);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

  const toggle = (field: keyof IntakeData, val: string) =>
    setD(p => ({ ...p, [field]: (p[field] as string[]).includes(val) ? (p[field] as string[]).filter((x: string) => x !== val) : [...(p[field] as string[]), val] }));
  const set = (field: keyof IntakeData, val: any) => setD(p => ({ ...p, [field]: val }));

  const canNext = [
    d.productName.trim().length > 0 && d.productTypes.length > 0,
    d.description.trim().length > 0 || d.components.length > 0,
    true,
    d.roles.length > 0,
    true,
    true,
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: activeUploadType || 'other' }));
    setD(p => ({ ...p, files: [...p.files, ...newFiles] }));
    e.target.value = '';
  }

  function removeFile(idx: number) { setD(p => ({ ...p, files: p.files.filter((_, i) => i !== idx) })); }

  const TOTAL = 6;

  // Sub-Step 0: Produkt-Grunddaten
  const Step0 = () => (
    <div className="space-y-5 animate-fade-in">
      <SubStepHeader current={0} total={TOTAL} title="Was für ein Produkt bewerten wir?" subtitle="Produkt-Typ auswählen und Namen vergeben." />
      <InfoBox icon="💡" color="blue">
        Der <strong>Produkt-Typ</strong> bestimmt, welche Bedrohungsszenarien relevant sind. Ein IoT-Gerät hat andere Risiken als eine Web-App.
      </InfoBox>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Produktname *</label>
        <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="z.B. SmartGate Pro, SafeControl 3000 …" value={d.productName} onChange={e => set('productName', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Version</label>
        <input className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="z.B. 1.0.0, 2024-Q3, Prototype" value={d.version} onChange={e => set('version', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Produkt-Typ * <span className="normal-case font-normal text-muted-foreground/60">(Mehrfachauswahl möglich)</span></label>
        <div className="grid grid-cols-2 gap-2">
          {PRODUCT_TYPES.map(t => <Chip key={t.id} label={t.label} icon={t.icon} desc={t.desc} selected={d.productTypes.includes(t.id)} onClick={() => toggle('productTypes', t.id)} />)}
        </div>
      </div>
    </div>
  );

  // Sub-Step 1: CRA-Klassifizierung
  const Step1 = () => (
    <div className="space-y-5 animate-fade-in">
      <SubStepHeader current={1} total={TOTAL} title="Wie ist das Produkt nach CRA eingestuft?" subtitle="Im Zweifelsfall zunächst 'Default' wählen — das Tool hilft bei der Einschätzung." />
      <InfoBox icon="📘" title="Was ist die CRA-Klassifizierung?" color="blue">
        Der Cyber Resilience Act (EU) stuft Produkte nach ihrem Risikopotenzial ein. Die Klasse bestimmt, <strong>wie der Konformitätsnachweis</strong> erbracht werden muss — von Selbstbewertung bis zur Pflichtprüfung durch eine akkreditierte Stelle.
      </InfoBox>
      <div className="space-y-2">
        {CRA_CLASSES.map(c => (
          <button key={c.id} onClick={() => set('craClass', c.id)} className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all ${d.craClass === c.id ? c.color + ' shadow' : 'border-border bg-card hover:border-muted-foreground/30'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-sm text-foreground">{c.label}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{c.desc}</div>
                <div className="text-xs text-muted-foreground/60 mt-1">Beispiele: {c.example}</div>
              </div>
              {d.craClass === c.id && <span className="text-lg mt-0.5 flex-shrink-0 text-primary">✓</span>}
            </div>
          </button>
        ))}
      </div>
      <InfoBox icon="🤔" color="amber">
        <strong>Nicht sicher?</strong> Fällt das Produkt nicht in Klasse I oder II-Kategorien, ist &quot;Default&quot; meistens korrekt. Das Tool liefert später eine Einschätzung basierend auf der Systemanalyse.
      </InfoBox>
    </div>
  );

  // Sub-Step 2: Systemarchitektur
  const Step2 = () => (
    <div className="space-y-5 animate-fade-in">
      <SubStepHeader current={2} total={TOTAL} title="Wie ist das System aufgebaut?" subtitle="Kurze Systembeschreibung eingeben — oder passende Bausteine auswählen." />
      <InfoBox icon="💡" color="blue">
        Einfach auf Deutsch beschreiben, <strong>was das Produkt macht</strong>, wer es nutzt und womit es verbunden ist. Je mehr Details, desto besser das Threat Model.
      </InfoBox>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Systembeschreibung</label>
        <div className="text-xs text-muted-foreground/60 mb-2">Beispiel: &quot;Unser Gateway erfasst Temperaturdaten von 50 Sensoren, speichert sie lokal und überträgt sie stündlich an eine Cloud-Plattform.&quot;</div>
        <textarea rows={4} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="In eigenen Worten beschreiben: Was tut das Produkt? Wer nutzt es? Womit ist es verbunden?" value={d.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Welche technischen Bausteine hat das System? <span className="normal-case font-normal text-muted-foreground/60">(alle zutreffenden auswählen)</span></label>
        <div className="flex flex-wrap gap-2">
          {COMPONENT_OPTS.map(c => (
            <button key={c} onClick={() => toggle('components', c)} className={`border rounded-full px-3 py-1.5 text-xs font-medium transition-all ${d.components.includes(c) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{d.components.includes(c) ? '✓ ' : ''}{c}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Wo wird das Produkt betrieben?</label>
        <div className="flex flex-wrap gap-2">
          {DEPLOYMENT_OPTS.map(o => (
            <button key={o.id} onClick={() => set('deployment', o.id)} className={`border rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${d.deployment === o.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{o.icon} {o.label}</button>
          ))}
        </div>
      </div>
    </div>
  );

  // Sub-Step 3: Schnittstellen
  const Step3 = () => (
    <div className="space-y-5 animate-fade-in">
      <SubStepHeader current={3} total={TOTAL} title="Über welche Schnittstellen kommuniziert das System?" subtitle="Alle genutzten Protokolle und Verbindungen auswählen." />
      <InfoBox icon="💡" color="blue">
        <strong>Schnittstellen = potenzielle Angriffspunkte.</strong> Jede Verbindung nach außen ist relevant — auch interne APIs, USB-Anschlüsse oder Bluetooth. Symbole ⚠️ markieren unsichere Protokolle.
      </InfoBox>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {INTERFACE_OPTS.map(o => (
          <button key={o.label} onClick={() => toggle('interfaces', o.label)} className={`border rounded-lg px-3 py-2 text-sm text-left flex items-center gap-2 transition-all ${d.interfaces.includes(o.label) ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>
            <span>{o.icon}</span><span className="flex-1">{o.label}</span>{d.interfaces.includes(o.label) && <span className="text-xs text-primary">✓</span>}
          </button>
        ))}
      </div>
      {d.interfaces.some(i => i.includes('unverschl') || i === 'HTTP' || i === 'FTP/SFTP') && (
        <InfoBox icon="⚠️" color="amber">
          Es wurden <strong>unsichere Protokolle</strong> ausgewählt. Diese werden im Threat Model besonders analysiert und führen wahrscheinlich zu CRA-Lücken.
        </InfoBox>
      )}
    </div>
  );

  // Sub-Step 4: Nutzerrollen
  const Step4 = () => (
    <div className="space-y-5 animate-fade-in">
      <SubStepHeader current={4} total={TOTAL} title="Wer hat Zugriff auf das System?" subtitle="Nutzerrollen helfen, Berechtigungsrisiken und Angreifer-Profile zu identifizieren." />
      <InfoBox icon="💡" color="blue">
        Alle Personen <strong>und Systeme</strong> berücksichtigen, die sich einloggen oder auf Funktionen zugreifen können — auch externe Dienstleister oder automatisierte Prozesse.
      </InfoBox>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Häufige Rollen — klicken zum Hinzufügen</label>
        <div className="flex flex-wrap gap-2">
          {ROLE_PRESETS.map(r => (
            <button key={r} onClick={() => !d.roles.includes(r) && setD(p => ({ ...p, roles: [...p.roles, r] }))} className={`border rounded-full px-3 py-1.5 text-xs font-medium transition-all ${d.roles.includes(r) ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-border bg-card text-muted-foreground hover:border-primary/40'}`}>{d.roles.includes(r) ? '✓ ' : ''}{r}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="Eigene Rolle hinzufügen …" value={d.customRole} onChange={e => set('customRole', e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && d.customRole.trim()) { setD(p => ({ ...p, roles: [...p.roles, p.customRole.trim()], customRole: '' })); } }} />
        <Button onClick={() => { if (d.customRole.trim()) { setD(p => ({ ...p, roles: [...p.roles, p.customRole.trim()], customRole: '' })); } }} className="font-medium">+ Hinzufügen</Button>
      </div>
      {d.roles.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ausgewählte Rollen</label>
          <div className="flex flex-wrap gap-2">
            {d.roles.map(r => (
              <span key={r} className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full px-3 py-1.5 text-xs font-medium">
                👤 {r}
                <button onClick={() => setD(p => ({ ...p, roles: p.roles.filter(x => x !== r) }))} className="text-green-400 hover:text-destructive font-bold ml-0.5">×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Sub-Step 5: Sicherheitsmaßnahmen & Schwachstellen
  const Step5 = () => {
    const cats = [...new Set(SECURITY_MEASURES.map(m => m.cat))];
    return (
      <div className="space-y-5 animate-fade-in">
        <SubStepHeader current={5} total={TOTAL} title="Welche Sicherheitsmaßnahmen sind bereits vorhanden?" subtitle="Auch fehlende Maßnahmen sind wichtige Information für das Assessment." />
        <InfoBox icon="💡" color="blue">
          Nur Maßnahmen auswählen, die <strong>aktuell wirklich aktiv</strong> sind — nicht was geplant ist. Fehlende Maßnahmen werden als Lücken im Assessment sichtbar.
        </InfoBox>
        {cats.map(cat => (
          <div key={cat}>
            <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">{cat}</div>
            <div className="space-y-1.5">
              {SECURITY_MEASURES.filter(m => m.cat === cat).map(m => (
                <label key={m.id} className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-all ${d.measures.includes(m.id) ? 'border-green-500/30 bg-green-500/10' : 'border-border bg-card hover:border-muted-foreground/30'}`}>
                  <input type="checkbox" className="w-4 h-4 rounded accent-green-600 flex-shrink-0" checked={d.measures.includes(m.id)} onChange={() => toggle('measures', m.id)} />
                  <span className="text-sm text-foreground">{m.label}</span>
                  {d.measures.includes(m.id) && <span className="ml-auto text-green-400 text-xs font-semibold">vorhanden</span>}
                </label>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Bekannte Schwachstellen oder offene Punkte</label>
          <div className="text-xs text-muted-foreground/60 mb-2">Optional — aber sehr wertvoll. Beispiel: &quot;Standard-Passwort nach Auslieferung aktiv&quot;, &quot;kein MFA&quot;</div>
          <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Bekannte Schwachstellen, offene Audit-Punkte …" value={d.knownIssues} onChange={e => set('knownIssues', e.target.value)} />
        </div>
      </div>
    );
  };

  // Sub-Step 6: Anlagen
  const Step6 = () => (
    <div className="space-y-5 animate-fade-in">
      <SubStepHeader current={5} total={TOTAL} title="Relevante Unterlagen hochladen" subtitle="Optional — aber Architekturdiagramme oder Berichte verbessern die Analysequalität." />
      <InfoBox icon="💡" color="blue">
        Relevante Dokumente hochladen. Die KI kann daraus <strong>zusätzliche Kontext-Informationen</strong> extrahieren — z.B. aus einem Architekturdiagramm oder einem Pentestbericht.
      </InfoBox>
      <div className="grid grid-cols-1 gap-2">
        {ATTACH_TYPES.map(t => (
          <button key={t.id} onClick={() => { setActiveUploadType(t.id); if (fileRef.current) { fileRef.current.accept = t.accept; fileRef.current.click(); } }} className="flex items-center gap-3 border-2 border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-all text-left">
            <span className="text-xl">{t.icon}</span>
            <div>
              <div className="font-medium">{t.label} hochladen</div>
              <div className="text-xs text-muted-foreground/60">{t.accept.replace(/\*/g, 'alle Formate')}</div>
            </div>
            <span className="ml-auto text-muted-foreground/40">+</span>
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" multiple onChange={handleFileChange} className="hidden" />
      {d.files.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Hochgeladene Dateien ({d.files.length})</div>
          <div className="space-y-1.5">
            {d.files.map((f, i) => {
              const typeInfo = ATTACH_TYPES.find(t => t.id === f.type) || { icon: '📎', label: 'Dokument' };
              const sizeKB = (f.size / 1024).toFixed(0);
              return (
                <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5 text-sm">
                  <span className="text-lg flex-shrink-0">{typeInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{typeInfo.label} · <span className="font-mono">{sizeKB} KB</span></div>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive font-bold text-lg leading-none transition-colors">×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <InfoBox icon="🔒" color="green">
        Dateien verlassen den Computer nicht und werden nur lokal für die Analyse verwendet.
      </InfoBox>
    </div>
  );

  // Zusammenfassung
  const Summary = () => (
    <div className="space-y-4 animate-fade-in">
      <SubStepHeader current={5} total={TOTAL} title="Alles bereit — Zusammenfassung" subtitle="Angaben überprüfen und dann die KI-Analyse starten." />
      {[
        { label: 'Produkt', val: `${d.productName} ${d.version}`.trim() },
        { label: 'Typ', val: d.productTypes.map(id => PRODUCT_TYPES.find(t => t.id === id)?.label).join(', ') || '—' },
        { label: 'CRA-Klasse', val: CRA_CLASSES.find(c => c.id === d.craClass)?.label || '—' },
        { label: 'Komponenten', val: d.components.length > 0 ? d.components.join(', ') : '—' },
        { label: 'Schnittstellen', val: d.interfaces.length > 0 ? d.interfaces.join(', ') : '—' },
        { label: 'Nutzerrollen', val: d.roles.length > 0 ? d.roles.join(', ') : '—' },
        { label: 'Maßnahmen', val: d.measures.length > 0 ? `${d.measures.length} Maßnahmen ausgewählt` : 'Keine ausgewählt' },
        { label: 'Anlagen', val: d.files.length > 0 ? `${d.files.length} Datei(en)` : 'Keine' },
      ].map(({ label, val }) => (
        <div key={label} className="flex gap-3 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
          <span className="text-muted-foreground w-28 flex-shrink-0">{label}</span>
          <span className="text-foreground font-medium">{val}</span>
        </div>
      ))}
      {d.knownIssues && <div className="text-sm border-b border-border/50 pb-2"><span className="text-muted-foreground">Bekannte Lücken: </span><span className="text-foreground">{d.knownIssues}</span></div>}
    </div>
  );

  const steps = [<Step0 />, <Step1 />, <Step2 />, <Step3 />, <Step4 />, <Step5 />, <Step6 />, <Summary />];
  const isSummary = sub === steps.length - 1;

  return (
    <div>
      {steps[sub]}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <button onClick={() => setSub(s => s - 1)} disabled={sub === 0} className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${sub === 0 ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground hover:bg-secondary'}`}>← Zurück</button>
        <div className="flex gap-1">
          {steps.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === sub ? 'bg-primary w-3' : i < sub ? 'bg-primary/40' : 'bg-secondary'}`} />)}
        </div>
        {isSummary
          ? <Button onClick={() => onFinish(d)} className="font-semibold shadow-md">KI-Analyse starten →</Button>
          : <Button onClick={() => setSub(s => s + 1)} disabled={!canNext[sub]} className="font-semibold shadow-sm">
            {sub === steps.length - 2 ? 'Zusammenfassung →' : 'Weiter →'}
          </Button>
        }
      </div>
    </div>
  );
}

// ── Phase 2: Threat Model ─────────────────────────────────────

function ThreatModel({ threats, onNext }: { threats: Threat[]; onNext: () => void }) {
  const [exp, setExp] = useState<number | null>(null);
  const counts = Object.fromEntries('STRIDE'.split('').map(c => [c, threats.filter(t => t.stride === c).length]));
  return (
    <div className="space-y-4">
      <InfoBox icon="🛡️" title="STRIDE Threat Model" color="blue">Das System wurde nach <strong>6 Bedrohungskategorien</strong> analysiert. Bedrohung anklicken für den vollständigen Angriffspfad.</InfoBox>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(STRIDE_META).map(([k, m]) => (
          <div key={k} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className={`w-8 h-8 rounded-full ${m.dot} text-white font-bold text-sm flex items-center justify-center mx-auto mb-1`}>{k}</div>
            <div className="text-xs text-muted-foreground leading-tight">{m.label}</div>
            <div className="text-xl font-bold text-foreground font-mono">{counts[k] || 0}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {threats.map(t => {
          const meta = STRIDE_META[t.stride];
          const risk = riskLevel(t.likelihood, t.impact);
          return (
            <div key={t.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50" onClick={() => setExp(exp === t.id ? null : t.id)}>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${meta.badge}`}>{t.stride}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.component}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${risk.cls}`}>{risk.label} (<span className="font-mono">{t.likelihood * t.impact}</span>)</span>
                {exp === t.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
              {exp === t.id && (
                <div className="border-t border-border bg-secondary/30 px-4 py-3 text-sm space-y-2">
                  <div><span className="font-semibold text-muted-foreground">Angreifer: </span><span className="text-foreground">{t.attacker}</span></div>
                  <div><span className="font-semibold text-muted-foreground">Angriffspfad: </span><span className="text-foreground">{t.path}</span></div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div><div className="text-xs text-muted-foreground mb-1">Likelihood (<span className="font-mono">{t.likelihood}/5</span>)</div><ScoreBar value={t.likelihood} /></div>
                    <div><div className="text-xs text-muted-foreground mb-1">Impact (<span className="font-mono">{t.impact}/5</span>)</div><ScoreBar value={t.impact} /></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">Risk Assessment →</Button>
      </div>
    </div>
  );
}

// ── Phase 3: Risk Assessment ──────────────────────────────────

function RiskAssessment({ threats, onNext }: { threats: Threat[]; onNext: () => void }) {
  const sorted = [...threats].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact));
  const cnt = { kritisch: 0, hoch: 0, mittel: 0, niedrig: 0 };
  sorted.forEach(t => {
    const l = riskLevel(t.likelihood, t.impact).label.toLowerCase();
    if (l in cnt) (cnt as any)[l]++;
  });

  const matrixColor = (s: number) => s >= 20 ? 'bg-red-500' : s >= 13 ? 'bg-orange-400' : s >= 6 ? 'bg-yellow-300' : 'bg-green-300';

  return (
    <div className="space-y-4">
      <InfoBox icon="⚖️" title="Quantifiziertes Risk Assessment" color="blue">Jede Bedrohung ist bewertet nach <strong>Likelihood × Impact</strong>. Hover über Matrixzellen für Details.</InfoBox>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([['Kritisch', 'bg-destructive', cnt.kritisch], ['Hoch', 'bg-orange-500', cnt.hoch], ['Mittel', 'bg-yellow-500', cnt.mittel], ['Niedrig', 'bg-green-500', cnt.niedrig]] as [string, string, number][]).map(([l, c, n]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold font-mono ${c} text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2`}>{n}</div>
            <div className="text-sm font-semibold text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm font-semibold text-foreground mb-3">Risikomatrix — Zahlen = Bedrohungen in dieser Zelle (hover für Namen)</div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="w-20 text-right pr-3 text-muted-foreground font-normal pb-1">Impact ↑</th>
                {[1, 2, 3, 4, 5].map(i => <th key={i} className="w-12 text-center text-muted-foreground font-semibold pb-1 font-mono">{i}</th>)}
                <th className="pl-2 text-muted-foreground font-normal">← Likelihood</th>
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(imp => (
                <tr key={imp}>
                  <td className="text-right pr-3 text-muted-foreground font-semibold py-0.5 font-mono">{imp}</td>
                  {[1, 2, 3, 4, 5].map(lik => {
                    const score = lik * imp;
                    const pts = threats.filter(t => t.likelihood === lik && t.impact === imp);
                    return (
                      <td key={lik} className={`w-12 h-10 ${matrixColor(score)} text-center align-middle border border-background`} title={pts.map(p => p.name).join('\n') || ''}>
                        {pts.length > 0 && (
                          <div className="w-6 h-6 bg-background/90 rounded-full text-foreground font-bold text-xs font-mono flex items-center justify-center mx-auto shadow cursor-help">{pts.length}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {([['bg-red-500', 'Kritisch (≥20)'], ['bg-orange-400', 'Hoch (13–19)'], ['bg-yellow-300', 'Mittel (6–12)'], ['bg-green-300', 'Niedrig (1–5)']] as [string, string][]).map(([c, l]) => (
              <span key={l} className="flex items-center gap-1"><span className={`w-3 h-3 rounded ${c} inline-block`} />{l}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-secondary border-b border-border text-sm font-semibold text-foreground">Alle Risiken — priorisiert</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Bedrohung</th>
                <th className="px-3 py-2 text-center w-10">L</th>
                <th className="px-3 py-2 text-center w-10">I</th>
                <th className="px-3 py-2 text-center w-14">Score</th>
                <th className="px-4 py-2 text-center w-24">Priorität</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, idx) => {
                const risk = riskLevel(t.likelihood, t.impact);
                return (
                  <tr key={t.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-secondary/30'}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.component}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-foreground font-mono">{t.likelihood}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-foreground font-mono">{t.impact}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-foreground font-mono">{t.likelihood * t.impact}</td>
                    <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${risk.cls}`}>{risk.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">CRA-Mapping →</Button>
      </div>
    </div>
  );
}

// ── Phase 4: CRA Mapping ──────────────────────────────────────

function CRAMapping({ reqs, onNext }: { reqs: CraReq[]; onNext: () => void }) {
  const [exp, setExp] = useState<string | null>(null);
  const pass = reqs.filter(r => r.status === 'pass').length;
  const partial = reqs.filter(r => r.status === 'partial').length;
  const fail = reqs.filter(r => r.status === 'fail').length;
  const score = Math.round((pass * 100 + partial * 50) / reqs.length);
  const scoreColor = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-destructive';
  const strokeColor = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#dc2626';

  return (
    <div className="space-y-4">
      <InfoBox icon="📋" title="CRA Compliance Mapping" color="blue">Befunde wurden automatisch auf die <strong>CRA-Anforderungen</strong> gemappt. Anforderung anklicken für Gap-Details und Maßnahmen.</InfoBox>
      <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-secondary" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={strokeColor} strokeWidth="3"
              strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold font-mono ${scoreColor}`}>{score}%</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-base font-bold text-foreground mb-1">CRA Readiness Score</div>
          <div className="text-sm text-muted-foreground mb-3">{reqs.length} Anforderungen geprüft</div>
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />{pass} Erfüllt</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />{partial} Teilweise</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive inline-block" />{fail} Lücken</span>
          </div>
        </div>
        <div className="text-center sm:text-right flex-shrink-0">
          <div className="text-4xl font-bold text-destructive font-mono">{fail}</div>
          <div className="text-sm text-muted-foreground">kritische Lücken</div>
          <div className="text-xs text-muted-foreground/60">vor Audit schließen</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {reqs.map(r => (
          <div key={r.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50" onClick={() => setExp(exp === r.id ? null : r.id)}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.article}</div>
              </div>
              <StatusBadge status={r.status} />
              {exp === r.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
            {exp === r.id && (
              <div className="border-t border-border bg-secondary/30 px-4 py-3 text-sm space-y-2">
                {r.gap && <div><span className="font-semibold text-destructive">Gap: </span><span className="text-foreground">{r.gap}</span></div>}
                <div><span className="font-semibold text-green-500">Maßnahme: </span><span className="text-foreground">{r.measure}</span></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">Report generieren →</Button>
      </div>
    </div>
  );
}

// ── Phase 5: Report ───────────────────────────────────────────

function ReportView({ intakeData, threats, reqs }: { intakeData: IntakeData; threats: Threat[]; reqs: CraReq[] }) {
  const critRisks = threats.filter(t => t.likelihood * t.impact >= 20);
  const fail = reqs.filter(r => r.status === 'fail');
  const partial = reqs.filter(r => r.status === 'partial');
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  const typeName = intakeData.productTypes?.map(id => PRODUCT_TYPES.find(t => t.id === id)?.label).join(', ') || '';
  const craName = CRA_CLASSES.find(c => c.id === intakeData.craClass)?.label || intakeData.craClass || '—';

  return (
    <div className="space-y-4">
      <InfoBox icon="✅" title="Assessment abgeschlossen" color="green">In der Produktionsversion wird hier automatisch ein gebrandeter <strong>DOCX/PDF-Report</strong> generiert.</InfoBox>
      <div className="bg-card border-l-4 border-primary rounded-lg p-5 border border-border">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cyber Risk Assessment Report</div>
            <div className="text-lg font-bold text-foreground mt-0.5">{intakeData.productName} {intakeData.version}</div>
          </div>
          <div className="sm:text-right text-xs text-muted-foreground">
            <div>{today}</div>
            <div className="mt-0.5">{craName}</div>
          </div>
        </div>
        <div className="h-px bg-border mb-3" />
        <p className="text-sm text-foreground leading-relaxed">
          Das Cyber Risk Assessment für <strong>{intakeData.productName} {intakeData.version}</strong> ({typeName}, CRA-Klasse: {craName}) wurde am {today} durchgeführt.
          Es wurden <strong>{threats.length} Bedrohungen</strong> identifiziert, davon{' '}
          <strong className="text-destructive">{critRisks.length} mit kritischem Risikoscore (≥ 20)</strong>.
          Von {reqs.length} geprüften CRA-Anforderungen bestehen <strong className="text-destructive">{fail.length} vollständige Lücken</strong> und{' '}
          {partial.length} teilweise Erfüllungen.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
          <span className="text-sm font-bold text-destructive">Sofortmaßnahmen — {fail.length} kritische Lücken</span>
        </div>
        {fail.map((r, i) => (
          <div key={r.id} className={`flex gap-3 px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/30'} ${i < fail.length - 1 ? 'border-b border-border' : ''}`}>
            <span className="font-bold text-destructive w-5 flex-shrink-0 font-mono">{i + 1}.</span>
            <div>
              <div className="font-semibold text-foreground">{r.name}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{r.measure}</div>
              <div className="text-muted-foreground/60 text-xs mt-0.5">{r.article}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([['Bedrohungen gesamt', threats.length, 'text-foreground'], ['Kritische Risiken', critRisks.length, 'text-destructive'], ['CRA-Lücken', fail.length, 'text-destructive']] as [string, number, string][]).map(([l, n, c]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${c}`}>{n}</div>
            <div className="text-xs text-muted-foreground mt-1">{l}</div>
          </div>
        ))}
      </div>

      <div className="bg-secondary border border-border rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-foreground">
          <div className="font-semibold mb-0.5">Report exportieren</div>
          <div className="text-xs text-muted-foreground">In der Produktionsversion: automatisch gebrandeter DOCX/PDF-Report</div>
        </div>
        <div className="flex gap-2">
          <button className="bg-primary/20 text-primary/40 text-sm font-semibold px-4 py-2 rounded-lg cursor-not-allowed" title="In Produktionsversion verfügbar">DOCX</button>
          <button className="bg-secondary text-muted-foreground text-sm font-semibold px-4 py-2 rounded-lg cursor-not-allowed border border-border" title="In Produktionsversion verfügbar">PDF</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────

const CraComplianceTool = ({ embedded }: { embedded?: boolean }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData>(EMPTY_INTAKE);

  const handleIntakeFinish = useCallback((data: IntakeData) => {
    setIntakeData(data);
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(1); }, 2000);
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setIntakeData(EMPTY_INTAKE);
  }, []);

  const progressPct = ((step + 1) / MAIN_STEPS.length) * 100;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background'}>
      {!embedded && <PageMeta title="CRA Compliance Tool" description="AI Cyber Risk & CRA Compliance Assessment" />}

      {/* Stepper */}
      <div className="border-b border-border px-4 py-3 mb-1">
        <div className="flex items-center max-w-5xl mx-auto overflow-x-auto">
          {MAIN_STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  i === step ? 'bg-primary text-primary-foreground' : i < step ? 'text-primary hover:bg-primary/10 cursor-pointer' : 'text-muted-foreground cursor-not-allowed'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === step ? 'bg-primary-foreground text-primary' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                }`}>{i < step ? '✓' : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < MAIN_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-secondary'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPct} className="h-1 rounded-none" />

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-5" />
            <div className="text-foreground font-semibold text-lg mb-2">KI analysiert das System…</div>
            <div className="text-muted-foreground text-sm">STRIDE-Bedrohungen werden identifiziert · Risiken bewertet · CRA-Mapping wird vorbereitet</div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-foreground">{MAIN_STEPS[step]}</div>
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                  <RotateCcw className="w-4 h-4 mr-1" /> Neu starten
                </Button>
              )}
            </div>
            {step === 0 && <IntakeWizard onFinish={handleIntakeFinish} />}
            {step === 1 && <ThreatModel threats={THREATS} onNext={() => setStep(2)} />}
            {step === 2 && <RiskAssessment threats={THREATS} onNext={() => setStep(3)} />}
            {step === 3 && <CRAMapping reqs={CRA_REQS} onNext={() => setStep(4)} />}
            {step === 4 && <ReportView intakeData={intakeData} threats={THREATS} reqs={CRA_REQS} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CraComplianceTool;
