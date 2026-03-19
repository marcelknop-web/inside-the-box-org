// ── CRA Tool Constants & Demo Data (i18n-aware) ─────────────────

// Translation helper type – accepts the t() function from useLanguage
type T = (key: string) => string;

// ── Product Types ───────────────────────────────────────────────

const PT_KEYS = ['iot', 'embed', 'sw', 'mobile', 'cloud', 'hw', 'network', 'kombi'] as const;
const PT_ICONS = ['📡', '🔧', '💻', '📱', '☁️', '🖥️', '🌐', '⚙️'];
const PT_T_KEYS = ['ptIot', 'ptEmbed', 'ptSw', 'ptMobile', 'ptCloud', 'ptHw', 'ptNetwork', 'ptKombi'];
const PT_DESC_KEYS = ['ptIotDesc', 'ptEmbedDesc', 'ptSwDesc', 'ptMobileDesc', 'ptCloudDesc', 'ptHwDesc', 'ptNetworkDesc', 'ptKombiDesc'];

export function getProductTypes(t: T) {
  return PT_KEYS.map((id, i) => ({
    id,
    label: t(`cra.${PT_T_KEYS[i]}`),
    icon: PT_ICONS[i],
    desc: t(`cra.${PT_DESC_KEYS[i]}`),
  }));
}

// ── CRA Classes ─────────────────────────────────────────────────

const CLS_IDS = ['default', 'k1', 'k2', 'krit'] as const;
const CLS_COLORS = [
  'border-green-500 bg-green-500/10 text-green-400',
  'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  'border-orange-500 bg-orange-500/10 text-orange-400',
  'border-destructive bg-destructive/10 text-destructive',
];
const CLS_KEYS = ['clsDefault', 'clsK1', 'clsK2', 'clsKrit'];

export function getCraClasses(t: T) {
  return CLS_IDS.map((id, i) => ({
    id,
    label: t(`cra.${CLS_KEYS[i]}`),
    color: CLS_COLORS[i],
    desc: t(`cra.${CLS_KEYS[i]}Desc`),
    example: t(`cra.${CLS_KEYS[i]}Ex`),
  }));
}

// ── Deployment Options ──────────────────────────────────────────

const DEP_IDS = ['cloud', 'onprem', 'hybrid', 'embedded', 'mobile'] as const;
const DEP_ICONS = ['☁️', '🏢', '🔀', '🔌', '📱'];
const DEP_KEYS = ['depCloud', 'depOnprem', 'depHybrid', 'depEmbedded', 'depMobile'];

export function getDeploymentOpts(t: T) {
  return DEP_IDS.map((id, i) => ({
    id,
    label: t(`cra.${DEP_KEYS[i]}`),
    icon: DEP_ICONS[i],
  }));
}

// ── Component Options (translated array) ────────────────────────

export function getComponentOpts(t: T): string[] {
  return []; // not used — caller uses tArray
}

// ── Interface Options (static labels with icons) ────────────────

export const INTERFACE_OPTS = [
  { label: 'HTTPS/REST', icon: '🔒' }, { label: 'HTTP', icon: '⚠️' }, { label: 'MQTT (TLS)', icon: '🔒' },
  { label: 'MQTT (unverschl.)', icon: '⚠️' }, { label: 'WebSocket', icon: '🔗' }, { label: 'SSH', icon: '🔑' },
  { label: 'USB', icon: '🖇️' }, { label: 'Bluetooth', icon: '📶' }, { label: 'WLAN', icon: '📡' },
  { label: 'LAN/Ethernet', icon: '🔌' }, { label: 'OPC-UA', icon: '🏭' }, { label: 'Modbus', icon: '🏭' },
  { label: 'SNMP', icon: '📊' }, { label: 'FTP/SFTP', icon: '📁' }, { label: 'SMTP', icon: '📧' },
  { label: 'Proprietäres Protokoll', icon: '❓' },
] as const;

// ── Security Measures ───────────────────────────────────────────

const SM_IDS = ['tls', 'auth', 'mfa', 'rbac', 'fw', 'vpn', 'patch', 'log', 'monitor', 'pentest', 'sbom', 'ir', 'secboot', 'codesign', 'encrypt'] as const;
const SM_LABEL_KEYS = ['smTls', 'smAuth', 'smMfa', 'smRbac', 'smFw', 'smVpn', 'smPatch', 'smLog', 'smMonitor', 'smPentest', 'smSbom', 'smIr', 'smSecboot', 'smCodesign', 'smEncrypt'];
const SM_CAT_KEYS = ['catCommunication', 'catAccess', 'catAccess', 'catAccess', 'catNetwork', 'catNetwork', 'catOps', 'catMonitoring', 'catMonitoring', 'catAudit', 'catDocs', 'catOps', 'catFirmware', 'catFirmware', 'catData'];

export function getSecurityMeasures(t: T) {
  return SM_IDS.map((id, i) => ({
    id,
    label: t(`cra.${SM_LABEL_KEYS[i]}`),
    cat: t(`cra.${SM_CAT_KEYS[i]}`),
  }));
}

export function getSecurityCategories(t: T) {
  return [...new Set(getSecurityMeasures(t).map(m => m.cat))];
}

// ── Attach Types ────────────────────────────────────────────────

const ATT_IDS = ['arch', 'pentest', 'policy', 'sbom', 'other'] as const;
const ATT_ICONS = ['🗺️', '🔍', '📋', '📦', '📎'];
const ATT_ACCEPTS = ['.pdf,.png,.jpg,.jpeg,.svg,.pptx,.vsdx,.drawio', '.pdf,.docx', '.pdf,.docx', '.json,.xml,.csv,.txt,.spdx', '*'];
const ATT_KEYS = ['attArch', 'attPentest', 'attPolicy', 'attSbom', 'attOther'];

export function getAttachTypes(t: T) {
  return ATT_IDS.map((id, i) => ({
    id,
    label: t(`cra.${ATT_KEYS[i]}`),
    icon: ATT_ICONS[i],
    accept: ATT_ACCEPTS[i],
  }));
}

// ── STRIDE Meta ─────────────────────────────────────────────────

const STRIDE_LABEL_KEYS = ['strideSpoofing', 'strideTampering', 'strideRepudiation', 'strideInfoDisc', 'strideDos', 'strideEoP'];
const STRIDE_DOTS = ['bg-purple-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-red-500', 'bg-rose-500'];
const STRIDE_BADGES = [
  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  'bg-red-500/10 text-red-400 border border-red-500/20',
  'bg-rose-500/10 text-rose-400 border border-rose-500/20',
];

export function getStrideMeta(t: T): Record<string, { label: string; dot: string; badge: string }> {
  const keys = 'STRIDE'.split('');
  return Object.fromEntries(keys.map((k, i) => [k, {
    label: t(`cra.${STRIDE_LABEL_KEYS[i]}`),
    dot: STRIDE_DOTS[i],
    badge: STRIDE_BADGES[i],
  }]));
}

// ── Types ───────────────────────────────────────────────────────

export interface Threat {
  id: number; stride: string; name: string; component: string;
  attacker: string; path: string; cra: string;
  likelihood: number; impact: number;
  evidence: string; rationale: string; sources: string[];
  /** Evidence quality rating 1–5 stars (1=untested, 5=practical PoC) */
  evidenceQuality: number;
  /** Reproducibility: 'easy' | 'medium' | 'hard' | 'impossible' */
  reproducibility: string;
}

/** Returns a formatted threat ID like S-001, T-002, etc. */
export function threatId(th: Threat): string {
  return `${th.stride}-${String(th.id).padStart(3, '0')}`;
}

export interface CraReq {
  id: string; article: string; name: string;
  status: 'pass' | 'partial' | 'fail';
  gap: string; measure: string;
  evidence: string; rationale: string; criteria: string[];
  /** Effort estimate string, e.g. '16–24h' */
  effort: string;
  /** Priority P0/P1/P2/P3 */
  priority: string;
}

export interface MeasureEntry {
  active: boolean;
  documented: boolean;
  audited: boolean;
}

export interface IntakeData {
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
  measures: Record<string, MeasureEntry>;
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const EMPTY_INTAKE: IntakeData = {
  productName: '', version: '', productTypes: [], craClass: '',
  description: '', components: [], deployment: '',
  interfaces: [], roles: [], customRole: '',
  measures: {}, knownIssues: '', files: [],
};

// ── Demo Threats (14 threats across all 6 STRIDE categories) ────

export const THREATS: Threat[] = [
  // S — Spoofing (2)
  { id: 1, stride: 'S', name: 'Spoofing des MQTT-Brokers (Identitätsvortäuschung)', component: 'MQTT-Interface — Broker-Authentifizierung', attacker: 'Externer Angreifer', path: 'Angreifer positioniert sich als legitimer MQTT-Broker → Gerät verbindet sich mit False-Server → Datenabfluss', cra: 'Annex I, Part I, Nr. 3', likelihood: 4, impact: 5,
    evidence: 'Konfigurationsanalyse: MQTT-Client verbindet sich ohne Server-Zertifikatsvalidierung (TLS-Pinning fehlt). Netzwerkscan bestätigt offenen Port 1883 ohne mTLS.',
    rationale: 'Likelihood 4: ARP-Spoofing in ungesicherten OT-Switches Standard, keine Port-Security üblich, Tooling (dsniff/arpspoof) frei verfügbar. Impact 5: Broker-Spoofing ermöglicht sowohl Datenabfluss als auch Fake-Daten-Injektion an alle Clients — in OT direkte Steuerungsgefährdung.',
    sources: ['OWASP IoT Top 10 – I3: Insecure Ecosystem Interfaces', 'ETSI EN 303 645, Provision 5.5-1'],
    evidenceQuality: 3, reproducibility: 'medium' },
  { id: 9, stride: 'S', name: 'API-Key-Impersonation über abgelaufene Tokens', component: 'REST-API — Token-Verwaltung', attacker: 'Authentifizierter Nutzer / Ex-Mitarbeiter', path: 'Abgelaufene API-Tokens werden nicht revoziert → Ex-Mitarbeiter nutzt gespeichertes Token → Zugriff auf API', cra: 'Annex I, Part I, Nr. 3', likelihood: 3, impact: 3,
    evidence: 'API-Test: Token mit Ablaufdatum -30 Tage wird weiterhin akzeptiert. Token-Revocation-Endpoint ist implementiert, wird aber nicht automatisch bei Mitarbeiter-Offboarding aufgerufen.',
    rationale: 'Likelihood 3: Erfordert Kenntnis eines gültigen Tokens, Offboarding-Prozess-Lücke plausibel. Impact 3: Zugriff auf Monitoring-Daten, aber keine Konfigurationsänderungen möglich (Read-Only-Scope).',
    sources: ['OWASP API Security Top 10 – API2: Broken Authentication', 'CWE-613: Insufficient Session Expiration'],
    evidenceQuality: 4, reproducibility: 'easy' },

  // T — Tampering (3)
  { id: 2, stride: 'T', name: 'Manipulation der Firmware via OTA', component: 'OTA-Update-Client', attacker: 'Supply-Chain-Angreifer / Insider', path: 'Unsigniertes Firmware-Paket → Gerät installiert Malware → Persistente Kompromittierung', cra: 'Annex I, Part I, Nr. 1', likelihood: 2, impact: 5,
    evidence: 'Code-Review: OTA-Client prüft weder kryptografische Signatur noch Integritäts-Hash des Firmware-Pakets. Download über HTTPS, aber ohne Certificate-Pinning.',
    rationale: 'Likelihood 2: Supply-Chain-Zugang oder Kompromittierung des Update-Servers erforderlich – nicht trivial, erfordert erhebliche Ressourcen. Impact 5: Persistente Kompromittierung mit vollständiger Geräte-Kontrolle, Lateral Movement in OT-Netzwerk möglich.',
    sources: ['CRA Annex I, Part I, Nr. 1: Produkte ohne bekannte Schwachstellen', 'NIST SP 800-193: Platform Firmware Resiliency'],
    evidenceQuality: 3, reproducibility: 'hard' },
  { id: 3, stride: 'T', name: 'Parameter-Manipulation REST-API', component: 'REST-API-Server', attacker: 'Authentifizierter Nutzer', path: 'Manipulierte API-Parameter → kein Input-Validation → Konfigurationsänderung außerhalb Berechtigung', cra: 'Annex I, Part I, Nr. 3', likelihood: 4, impact: 3,
    evidence: 'API-Test: PUT /config akzeptiert beliebige JSON-Schlüssel ohne Schema-Validierung. Kein RBAC auf Endpoint-Ebene – jeder authentifizierte Nutzer kann Konfigurationsparameter ändern.',
    rationale: 'Likelihood 4: Standard-Tooling (curl, Postman) genügt, keine besonderen Rechte nötig, Aufwand < 4h. Impact 3: Konfigurationsänderung kann Betriebsparameter verfälschen, aber kein direkter Datenabfluss oder RCE.',
    sources: ['OWASP API Security Top 10 – API1: Broken Object Level Authorization', 'CWE-20: Improper Input Validation'],
    evidenceQuality: 4, reproducibility: 'easy' },
  { id: 10, stride: 'T', name: 'Modbus-Register-Manipulation (unauthentifiziert)', component: 'Modbus-Interface', attacker: 'Netzwerk-Angreifer (Layer 2)', path: 'Modbus TCP hat keine Authentifizierung → Angreifer im Netzwerk kann Holding-Register beschreiben → Prozessparameter-Manipulation', cra: 'Annex I, Part I, Nr. 5', likelihood: 5, impact: 5,
    evidence: 'Netzwerkscan: Modbus TCP Port 502 offen, akzeptiert Write-Holding-Register-Befehle ohne Authentifizierung. Praktischer PoC: Setpoint-Wert erfolgreich von 25°C auf 85°C geändert via mbtcp-cli.',
    rationale: 'Likelihood 5: Standard-Modbus-Tools (mbtcp-cli, pymodbus) frei verfügbar, kein Auth erforderlich, Aufwand < 30 Minuten. Impact 5: Direkte Manipulation von Steuerungsparametern mit potenziellen Safety-Auswirkungen in OT-Umgebung.',
    sources: ['ICS-CERT Advisory ICSA-18-107-03', 'NIST SP 800-82r3: Guide to OT Security', 'CWE-306: Missing Authentication for Critical Function'],
    evidenceQuality: 5, reproducibility: 'easy' },

  // R — Repudiation (1)
  { id: 4, stride: 'R', name: 'Fehlende Audit-Logs Admin', component: 'Web-UI Admin', attacker: 'Interner Nutzer', path: 'Admin-Aktionen nicht protokolliert → nicht nachvollziehbar → Compliance-Problem', cra: 'Annex I, Part I, Nr. 8', likelihood: 3, impact: 3,
    evidence: 'Systemprüfung: Keine Log-Dateien für administrative Aktionen vorhanden. Weder Konfigurationsänderungen noch Benutzerverwaltung werden protokolliert. Kein Syslog-Export konfiguriert.',
    rationale: 'Likelihood 3: Jeder Admin-Nutzer kann unbemerkt Änderungen vornehmen, normaler Betriebsablauf. Impact 3: Compliance-Verstoß (CRA Art. 10 Abs. 10), forensische Aufklärung nach Vorfällen unmöglich, aber kein direkter technischer Schaden.',
    sources: ['CRA Annex I, Part I, Nr. 8: Sicherheits-Logging', 'ISO/IEC 27001:2022, A.8.15: Logging'],
    evidenceQuality: 5, reproducibility: 'easy' },

  // I — Information Disclosure (2)
  { id: 5, stride: 'I', name: 'Klartext-MQTT (Port 1883) — Vertraulichkeitsverlust', component: 'MQTT-Interface — Transportschicht', attacker: 'Netzwerk-Mitleser (MITM)', path: 'Unverschlüsselte MQTT-Verbindung → Passwort-Sniffing → Vollzugriff auf Sensordaten', cra: 'Annex I, Part I, Nr. 4', likelihood: 5, impact: 5,
    evidence: 'Netzwerkmitschnitt (Wireshark): MQTT CONNECT-Paket auf Port 1883 enthält Benutzername und Passwort im Klartext. Payload-Daten (Sensorwerte) ebenfalls unverschlüsselt. PoC-Pcap vorhanden.',
    rationale: 'Likelihood 5: Passives Mitlesen im gleichen Netzwerksegment trivial, kein aktiver Angriff nötig, Layer-2-Zugang in OT-Netzen Standard. Impact 5: Vollständige Offenlegung aller Sensordaten und Zugangsdaten — Fabrikgeheimnisse + Steuerungsdaten betroffen, ermöglicht Folge-Angriffe.',
    sources: ['CRA Annex I, Part I, Nr. 4: Vertraulichkeit von Daten', 'ETSI EN 303 645, Provision 5.8-1: Kommunikationssicherheit'],
    evidenceQuality: 5, reproducibility: 'easy' },
  { id: 11, stride: 'I', name: 'OPC-UA Security Mode None — Datenabfluss', component: 'OPC-UA Client', attacker: 'Netzwerk-Mitleser', path: 'OPC-UA Security Mode auf "None" konfiguriert → Alle Prozessdaten unverschlüsselt → Industriegeheimnisse exponiert', cra: 'Annex I, Part I, Nr. 4', likelihood: 4, impact: 5,
    evidence: 'Konfigurationsanalyse: OPC-UA Client-Konfiguration zeigt SecurityMode=None und SecurityPolicy=None. Verbindung zum OPC-UA Server erfolgt ohne Verschlüsselung oder Signatur.',
    rationale: 'Likelihood 4: Erfordert Netzwerkzugang zum OT-Segment, dort trivial mitzulesen — in OT-Umgebungen ist Layer-2-Zugang Standard. Impact 5: Prozessdaten, Produktionsparameter und Steuerungsbefehle offengelegt — in Industriekontext Betriebsgeheimnisse und potenzielle Safety-Auswirkungen.',
    sources: ['OPC Foundation Security Best Practices', 'IEC 62541-2: OPC Unified Architecture — Security Model'],
    evidenceQuality: 3, reproducibility: 'medium' },

  // D — Denial of Service (2)
  { id: 6, stride: 'D', name: 'DoS auf MQTT-Broker — Verfügbarkeitsverlust', component: 'MQTT-Broker — Connection-Management', attacker: 'Externer Angreifer', path: 'Flood-Angriff → Broker-Überlastung → Produktionsausfall', cra: 'Annex I, Part I, Nr. 7', likelihood: 3, impact: 4,
    evidence: 'Lasttest: MQTT-Broker akzeptiert unbegrenzte Verbindungen ohne Rate-Limiting. Bei 500 gleichzeitigen Verbindungen: CPU 100%, Response-Time > 30s, bestehende Clients getrennt.',
    rationale: 'Likelihood 3: Erfordert Netzwerkzugang zum Broker-Port, aber kein spezielles Tooling — Standard-MQTT-Client genügt. Impact 4: Produktionsausfall – alle verbundenen Geräte verlieren Steuerungskommunikation.',
    sources: ['CRA Annex I, Part I, Nr. 7: Verfügbarkeit und Ausfallsicherheit', 'NIST SP 800-82r3: Guide to OT Security'],
    evidenceQuality: 4, reproducibility: 'medium' },
  { id: 12, stride: 'D', name: 'REST-API Rate-Limiting fehlt — Service-Degradation', component: 'REST-API-Server', attacker: 'Externer Angreifer', path: 'Massenhafte API-Requests → Backend-Überlastung → Monitoring-Dashboard nicht erreichbar', cra: 'Annex I, Part I, Nr. 7', likelihood: 4, impact: 2,
    evidence: 'Lasttest (Apache JMeter): 1000 Requests/s über 60s — kein Rate-Limiting, kein HTTP 429. Backend-Response-Time steigt von 50ms auf > 5s. Monitoring-Dashboard lädt nicht mehr.',
    rationale: 'Likelihood 4: Kein Auth für GET-Endpoints nötig, Standard-Tooling. Impact 2: Monitoring-Ausfall, aber Steuerungskommunikation (MQTT/OPC-UA) nicht betroffen, da separater Service.',
    sources: ['OWASP API Security Top 10 – API4: Unrestricted Resource Consumption', 'CWE-770: Allocation of Resources Without Limits'],
    evidenceQuality: 4, reproducibility: 'easy' },

  // E — Elevation of Privilege (4)
  { id: 7, stride: 'E', name: 'Standard-Admin-Passwort aktiv', component: 'Web-UI Admin', attacker: 'Opportunistischer Angreifer', path: 'Standard-Passwort nicht geändert → Vollzugriff ohne Aufwand', cra: 'Annex I, Part I, Nr. 2', likelihood: 5, impact: 5,
    evidence: 'Erstinbetriebnahme-Test: Login mit admin/admin erfolgreich. Kein Passwort-Änderungszwang beim ersten Login. Standard-Credentials in öffentlicher Produktdokumentation auffindbar.',
    rationale: 'Likelihood 5: Öffentlich bekannte Credentials, kein technisches Wissen erforderlich, Aufwand < 5 Minuten. Impact 5: Vollständiger administrativer Zugriff – Konfiguration, Firmware-Update, Daten-Export, Nutzerverwaltung.',
    sources: ['CRA Annex I, Part I, Nr. 2: Secure by Default', 'ETSI EN 303 645, Provision 5.1-1: No universal default passwords', 'CWE-1392: Use of Default Credentials'],
    evidenceQuality: 5, reproducibility: 'easy' },
  { id: 8, stride: 'E', name: 'Session-Hijacking Web-UI', component: 'Web-UI Admin', attacker: 'Netzwerk-Angreifer', path: 'Unsicheres Session-Management → Token-Diebstahl → Admin-Zugriff ohne Authentifizierung', cra: 'Annex I, Part I, Nr. 3', likelihood: 3, impact: 4,
    evidence: 'Cookie-Analyse: Session-Token ohne Secure- und HttpOnly-Flag gesetzt. Token-Rotation nach Login findet nicht statt. Session-Timeout: 24h (konfiguriert), kein Re-Auth bei sensitiven Aktionen.',
    rationale: 'Likelihood 3: Erfordert MITM-Position oder XSS-Vektor im selben Netzwerk, nicht trivial. Impact 4: Vollständiger Admin-Zugriff mit gestohlener Session, aber zeitlich begrenzt auf Session-Lebensdauer.',
    sources: ['OWASP Session Management Cheat Sheet', 'CWE-614: Sensitive Cookie in HTTPS Session Without Secure Attribute'],
    evidenceQuality: 3, reproducibility: 'medium' },
  { id: 13, stride: 'E', name: 'SSH Root-Login aktiv — Privilege Escalation', component: 'Embedded OS — SSH-Service', attacker: 'Netzwerk-Angreifer / Insider', path: 'SSH Root-Login erlaubt + schwaches Passwort → Angreifer erhält Root-Shell → Vollständige Systemkontrolle', cra: 'Annex I, Part I, Nr. 2', likelihood: 3, impact: 5,
    evidence: 'SSH-Scan (nmap + ssh-audit): Root-Login erlaubt (PermitRootLogin=yes). Passwort-Authentifizierung aktiv, Key-Only nicht erzwungen. Brute-Force-Protection (fail2ban) nicht konfiguriert.',
    rationale: 'Likelihood 3: SSH-Zugang erfordert Netzwerkzugang + Brute-Force oder bekanntes Passwort, fail2ban-Fehlen senkt die Hürde. Impact 5: Root-Shell = vollständige Systemkontrolle, Firmware-Manipulation, Lateral Movement.',
    sources: ['CIS Benchmark: Linux — SSH Configuration', 'ETSI EN 303 645, Provision 5.6-1'],
    evidenceQuality: 4, reproducibility: 'medium' },
  { id: 14, stride: 'E', name: 'Debug-Interface im Produktionsmodus aktiv', component: 'REST-API — Debug-Endpoint', attacker: 'Externer Angreifer', path: 'Debug-Endpoint /debug/env exponiert Umgebungsvariablen → API-Keys und DB-Credentials offengelegt', cra: 'Annex I, Part I, Nr. 2', likelihood: 4, impact: 4,
    evidence: 'HTTP-Request: GET /debug/env gibt JSON mit allen Umgebungsvariablen zurück, inkl. DB_PASSWORD, MQTT_CREDENTIALS, API_SECRET. Kein Auth erforderlich. HTTP 200 ohne Rate-Limiting.',
    rationale: 'Likelihood 4: Endpoint ist öffentlich erreichbar, Standard-Tooling (curl/Browser) genügt. Impact 4: Offenlegung aller Backend-Credentials ermöglicht Zugriff auf Datenbank und MQTT-Broker, aber kein direkter RCE.',
    sources: ['OWASP Top 10 – A05: Security Misconfiguration', 'CWE-215: Insertion of Sensitive Information Into Debugging Code'],
    evidenceQuality: 5, reproducibility: 'easy' },
];

// ── Demo CRA Requirements (22 requirements, ~50% compliance) ────

export const CRA_REQS: CraReq[] = [
  // ═══ ANNEX I, PART I — Essential Security Properties (8) ═══

  { id: 'A1-1', article: 'Annex I, Part I, Nr. 1', name: 'Keine bekannten Schwachstellen', status: 'partial', gap: 'OTA-Signaturprüfung fehlt, CVE-Tracking nicht formalisiert',
    evidence: 'OTA-Client akzeptiert unsignierte Pakete (vgl. T-002). Kein dokumentierter CVE-Monitoring-Prozess. SBOM nicht vollständig.',
    rationale: 'Teilweise erfüllt: HTTPS wird für Download genutzt (Transportschutz vorhanden), aber ohne Integritätsprüfung des Pakets ist die Anforderung nicht vollständig adressiert. CVE-Monitoring fehlt als Prozess.',
    measure: 'Signierten Update-Prozess implementieren (Ed25519 oder RSA-2048+), SBOM vervollständigen, wöchentliches CVE-Monitoring einrichten',
    criteria: ['Firmware-Pakete werden vor Installation kryptografisch verifiziert (z. B. Ed25519, RSA-2048+)', 'CVE-Monitoring-Prozess ist dokumentiert und wird mindestens wöchentlich ausgeführt', 'SBOM in SPDX- oder CycloneDX-Format liegt vor und wird bei jedem Release aktualisiert'] },

  { id: 'A1-2', article: 'Annex I, Part I, Nr. 2', name: 'Secure by Default', status: 'fail', gap: 'Standard-Passwort aktiv, Debug-Endpoint im Produktionsmodus, SSH Root-Login erlaubt',
    evidence: 'Login mit admin/admin erfolgreich (vgl. E-007). Debug-Endpoint /debug/env exponiert Credentials (vgl. E-014). SSH Root-Login erlaubt (vgl. E-013). Port 1883 im Auslieferungszustand geöffnet.',
    rationale: 'Nicht erfüllt: Vier unabhängige Secure-by-Default-Verstöße. CRA verlangt, dass Produkte im Auslieferungszustand keine bekannten Angriffsvektoren exponieren. Jeder einzelne Verstoß wäre bereits als Fail zu bewerten.',
    measure: '1. Passwort-Änderung beim Erststart erzwingen (min. 12 Zeichen, Komplexitätsanforderung). 2. Debug-Endpoints in Produktion deaktivieren. 3. SSH Root-Login deaktivieren, Key-Only erzwingen. 4. Unsichere Ports (1883, Telnet) im Default deaktivieren.',
    criteria: ['Erstinbetriebnahme erzwingt individuelle Passwort-Vergabe (min. 12 Zeichen, 3 von 4 Komplexitätsklassen)', 'Alle Debug-Endpoints sind in Produktions-Builds deaktiviert und nicht über Konfiguration aktivierbar', 'SSH-Root-Login deaktiviert (PermitRootLogin=no), Passwort-Auth deaktiviert (PasswordAuthentication=no)', 'Alle nicht für den Betrieb notwendigen Ports und Dienste sind im Auslieferungszustand deaktiviert'] },

  { id: 'A1-3', article: 'Annex I, Part I, Nr. 3', name: 'Schutz vor unbefugtem Zugriff', status: 'fail', gap: 'Kein MFA, schwaches Session-Management, abgelaufene Tokens nicht revoziert',
    evidence: 'Session-Cookies ohne Secure/HttpOnly-Flag (vgl. E-008). Abgelaufene API-Tokens werden akzeptiert (vgl. S-009). Kein MFA verfügbar. API-Endpoints ohne RBAC.',
    rationale: 'Nicht erfüllt: Vier unabhängige Schwachstellen betreffen diese Anforderung. Zugriffskontrolle ist auf mehreren Ebenen (Web-UI, API, Token-Management) mangelhaft.',
    measure: '1. MFA für Admin implementieren (TOTP oder FIDO2). 2. Session-Cookies mit Secure-, HttpOnly- und SameSite-Flag. 3. Token-Revocation bei Offboarding automatisieren. 4. RBAC auf Endpoint-Ebene.',
    criteria: ['MFA für alle administrativen Zugänge implementiert (TOTP oder FIDO2)', 'Session-Cookies mit Secure-, HttpOnly- und SameSite-Flag; Token-Rotation nach Login; Timeout ≤ 30 min', 'Automatisierte Token-Revocation bei Mitarbeiter-Offboarding', 'RBAC auf API-Endpoint-Ebene mit dokumentiertem Berechtigungsmodell'] },

  { id: 'A1-4', article: 'Annex I, Part I, Nr. 4', name: 'Vertraulichkeit der Daten', status: 'partial', gap: 'MQTT auf Port 1883 unverschlüsselt, OPC-UA Security Mode None',
    evidence: 'Wireshark-Mitschnitt bestätigt Klartext-Übertragung auf Port 1883 (vgl. I-005). OPC-UA Client mit SecurityMode=None konfiguriert (vgl. I-011). REST-API über HTTPS korrekt gesichert.',
    rationale: 'Teilweise erfüllt: REST-API-Kommunikation über TLS korrekt implementiert. MQTT und OPC-UA Kommunikation jedoch unverschlüsselt — in Industrieumgebung kritisch, da Steuerungsdaten und Prozessgeheimnisse betroffen.',
    measure: '1. MQTT ausschließlich über TLS (Port 8883), Port 1883 deaktivieren. 2. OPC-UA Security Mode auf SignAndEncrypt setzen. 3. TLS-Zertifikatsvalidierung auf Client- und Server-Seite aktivieren.',
    criteria: ['Gesamte MQTT-Kommunikation über TLS 1.2+ verschlüsselt (Port 8883)', 'Port 1883 ist deaktiviert und nicht konfigurierbar', 'OPC-UA SecurityMode=SignAndEncrypt mit Basic256Sha256', 'TLS-Zertifikatsvalidierung auf Client- und Server-Seite aktiv'] },

  { id: 'A1-5', article: 'Annex I, Part I, Nr. 5', name: 'Integrität der Daten', status: 'pass', gap: '',
    evidence: 'REST-API nutzt TLS 1.3 mit HMAC-Integritätsprüfung. Firmware-Images werden mit SHA-256-Checksummen ausgeliefert. Datenbank-Transaktionen nutzen ACID-Garantien. Konfigurationsänderungen werden atomar durchgeführt.',
    rationale: 'Erfüllt: Datenintegrität ist auf Transportebene (TLS), Speicherebene (ACID) und bei Firmware-Distribution (SHA-256) gewährleistet. Einzige Ausnahme ist der fehlende Signatur-Check bei OTA (separat unter A1-1 bewertet).',
    measure: '',
    criteria: [] },

  { id: 'A1-6', article: 'Annex I, Part I, Nr. 6', name: 'Authentizität von Datenquellen', status: 'pass', gap: '',
    evidence: 'REST-API-Clients authentifizieren sich über JWT-Tokens mit RS256. MQTT-Clients nutzen individuelle Zugangsdaten (Username/Password). OPC-UA Server wird über X.509-Zertifikat identifiziert. Firmware-Download erfolgt von authentifiziertem Update-Server (HTTPS).',
    rationale: 'Erfüllt: Datenquellen werden auf allen Kommunikationskanälen authentifiziert. JWT-Token-Verifizierung mit asymmetrischer Kryptographie. Einschränkung: MQTT-Auth ist username/password-basiert, nicht zertifikatsbasiert — für Klasse II akzeptabel.',
    measure: '',
    criteria: [] },

  { id: 'A1-7', article: 'Annex I, Part I, Nr. 7', name: 'Verfügbarkeit & Ausfallsicherheit', status: 'partial', gap: 'Kein Rate-Limiting auf MQTT-Broker und REST-API',
    evidence: 'Lasttest: Broker-Ausfall bei 500 gleichzeitigen Verbindungen (vgl. D-006). REST-API ohne Rate-Limiting (vgl. D-012). Watchdog-Prozess für MQTT-Broker vorhanden, aber Auto-Restart dauert > 60s.',
    rationale: 'Teilweise erfüllt: Grundlegende Verfügbarkeit gegeben, Watchdog implementiert. Aber keine Schutzmaßnahmen gegen gezielte Überlastung. Recovery-Zeit (> 60s) zu lang für Industrieumgebung.',
    measure: '1. Rate-Limiting pro Client-IP auf MQTT und REST. 2. Connection-Throttling mit konfigurierbarem Maximum. 3. Watchdog Recovery-Zeit auf < 10s optimieren.',
    criteria: ['Rate-Limiting pro Client-IP konfiguriert (max. Verbindungen/Minute)', 'Connection-Throttling begrenzt gleichzeitige Verbindungen auf definierten Schwellwert', 'Watchdog-Prozess startet Broker-Dienst automatisch bei Ausfall (< 10s Recovery)'] },

  { id: 'A1-8', article: 'Annex I, Part I, Nr. 8', name: 'Sicherheits-Logging & Monitoring', status: 'fail', gap: 'Admin-Aktionen nicht protokolliert, kein SIEM-Export',
    evidence: 'Systemprüfung: Keine Log-Dateien für administrative Aktionen (vgl. R-004). Kein Syslog-Export. Keine Tamper-Protection für Logs. System-Logs nur auf lokaler Partition ohne Rotation.',
    rationale: 'Nicht erfüllt: Ohne Logging ist keine Nachvollziehbarkeit von Sicherheitsvorfällen möglich. Forensische Analyse nach einem Vorfall ist ausgeschlossen. Verstoß gegen CRA Art. 10 Abs. 10.',
    measure: '1. Audit-Log für alle Admin-Aktionen (Zeitstempel, User-ID, Aktion, Vorher/Nachher-Wert). 2. Log-Rotation und Tamper-Protection (Append-Only). 3. Syslog/SIEM-Export konfigurierbar machen.',
    criteria: ['Alle administrativen Aktionen werden mit Zeitstempel, Benutzer-ID und Aktion protokolliert', 'Logs sind vor Manipulation geschützt (Append-Only oder signiert)', 'Log-Export an externes System (Syslog/SIEM) ist konfigurierbar und dokumentiert'] },

  // ═══ ANNEX I, PART II — Vulnerability Management (9) ═══

  { id: 'A2-1', article: 'Annex I, Part II, Nr. 1', name: 'Schwachstellen-Identifikation', status: 'partial', gap: 'Ad-hoc-Prozess vorhanden, aber nicht dokumentiert oder regelmäßig',
    evidence: 'Interview: Entwicklungsteam behebt Schwachstellen reaktiv. Letzte Pentest-Ergebnisse > 14 Monate alt. Kein SAST/DAST in CI/CD-Pipeline. Ad-hoc-Reviews bei kritischen Releases.',
    rationale: 'Teilweise erfüllt: Schwachstellen werden reaktiv behoben — Awareness ist vorhanden. Aber CRA verlangt einen systematischen, dokumentierten Prozess mit regelmäßigen Tests.',
    measure: '1. Vulnerability-Management-Prozess gemäß ISO/IEC 30111 dokumentieren. 2. SAST/DAST in CI/CD integrieren. 3. Jährliche Pentests durch externe Prüfer.',
    criteria: ['Dokumentierter Vulnerability-Handling-Prozess gemäß ISO/IEC 30111', 'SAST und DAST in CI/CD-Pipeline integriert und bei jedem Build ausgeführt', 'Jährlicher Penetrationstest durch externen Dienstleister, Bericht dokumentiert'] },

  { id: 'A2-2', article: 'Annex I, Part II, Nr. 2', name: 'Schwachstellen-Tracking', status: 'pass', gap: '',
    evidence: 'Jira-basiertes Vulnerability-Tracking aktiv. Alle identifizierten Schwachstellen werden als Security-Issues erfasst mit Severity, Status und zugewiesenem Owner. Dashboard mit offenen Security-Issues vorhanden.',
    rationale: 'Erfüllt: Systematisches Tracking über Ticketing-System. Schwachstellen werden kategorisiert, priorisiert und nachverfolgt. SLA für Critical (48h) und High (7 Tage) definiert.',
    measure: '',
    criteria: [] },

  { id: 'A2-3', article: 'Annex I, Part II, Nr. 3', name: 'Patch-Management-Prozess', status: 'pass', gap: '',
    evidence: 'Dokumentierter Patch-Management-Prozess vorhanden. Monatliche Patch-Zyklen für Non-Critical, Emergency-Patches innerhalb 48h für Critical. CI/CD-Pipeline automatisiert Build und Deployment. Rollback-Mechanismus getestet.',
    rationale: 'Erfüllt: Strukturierter Patch-Prozess mit definierten SLAs, automatisierter Pipeline und getestetem Rollback. Prozess wird seit 18 Monaten praktiziert.',
    measure: '',
    criteria: [] },

  { id: 'A2-4', article: 'Annex I, Part II, Nr. 4', name: 'Koordinierte Schwachstellen-Offenlegung', status: 'pass', gap: '',
    evidence: 'security.txt auf Webseite publiziert mit PGP-Key und Kontakt-E-Mail. Coordinated Disclosure Policy dokumentiert (90-Tage-Frist). Eingehende Schwachstellenmeldungen werden in Jira erfasst und innerhalb 72h bestätigt.',
    rationale: 'Erfüllt: Disclosure-Prozess ist publiziert, erreichbar und wird aktiv genutzt. Letzte externe Meldung wurde korrekt innerhalb 72h bestätigt und innerhalb 45 Tagen behoben.',
    measure: '',
    criteria: [] },

  { id: 'A2-5', article: 'Annex I, Part II, Nr. 5', name: 'Security-Updates nach Schwachstellenentdeckung', status: 'pass', gap: '',
    evidence: 'Update-Mechanismus (OTA) funktional. Security-Updates werden separat von Feature-Updates veröffentlicht. Kunden werden per E-Mail-Advisory benachrichtigt. Update-Verfügbarkeit innerhalb 7 Tagen nach Vulnerability-Bestätigung.',
    rationale: 'Erfüllt: Security-Updates werden zeitnah bereitgestellt. Separater Security-Update-Kanal vermeidet Verzögerungen durch Feature-Releases. Einschränkung: OTA-Signaturprüfung fehlt (separat unter A1-1).',
    measure: '',
    criteria: [] },

  { id: 'A2-6', article: 'Annex I, Part II, Nr. 6', name: 'Retroaktive Patches (ältere Versionen)', status: 'partial', gap: 'Nur aktuelle Major-Version wird gepatcht',
    evidence: 'Interview: Nur die aktuelle Major-Version (3.x) erhält Security-Patches. Version 2.x (noch bei 30% der Kunden im Einsatz) wird nicht mehr gepatcht. Kein dokumentierter End-of-Support-Zeitplan.',
    rationale: 'Teilweise erfüllt: Aktuelle Version wird gepatcht. Aber 30% der Installationsbasis ohne Security-Updates verstößt gegen den CRA-Grundsatz der Lebenszyklusdauer-Unterstützung.',
    measure: '1. End-of-Support-Policy dokumentieren und publizieren. 2. Sicherheitskritische Patches für v2.x mindestens 12 Monate bereitstellen. 3. Upgrade-Pfad von v2.x auf v3.x vereinfachen.',
    criteria: ['End-of-Support-Policy publiziert mit klaren Fristen pro Version', 'Sicherheitskritische Patches für n-1 Major-Version mindestens 12 Monate nach Release der Nachfolgeversion', 'Dokumentierter und getesteter Upgrade-Pfad zwischen Major-Versionen'] },

  { id: 'A2-7', article: 'Annex I, Part II, Nr. 7', name: 'Vulnerability-Lifecycle-Logging', status: 'pass', gap: '',
    evidence: 'Jira-Workflow für Security-Issues: Open → Confirmed → In Progress → Resolved → Verified → Closed. Alle Status-Änderungen werden automatisch mit Zeitstempel und Bearbeiter protokolliert. Reports exportierbar.',
    rationale: 'Erfüllt: Vollständiger Lifecycle-Log für jede Schwachstelle. Audit-Trail nachvollziehbar. Reports für interne und externe Audits verfügbar.',
    measure: '',
    criteria: [] },

  { id: 'A2-8', article: 'Annex I, Part II, Nr. 8', name: 'SBOM', status: 'fail', gap: 'Keine vollständige SBOM vorhanden',
    evidence: 'Dokumentenprüfung: Partial SBOM vorhanden (direkte Dependencies). Transitive Abhängigkeiten nicht erfasst. Kein standardisiertes Format (weder SPDX noch CycloneDX). Manuelle Pflege, nicht in CI/CD integriert.',
    rationale: 'Nicht erfüllt: CRA verpflichtet zur Bereitstellung einer maschinenlesbaren SBOM mit allen Komponenten. Aktuelle SBOM ist unvollständig, nicht standardisiert und nicht automatisiert.',
    measure: '1. SBOM-Generierung in CI/CD integrieren (z.B. Syft, Trivy). 2. Format: CycloneDX oder SPDX. 3. Transitive Dependencies einschließen. 4. Bei jedem Release automatisch aktualisieren.',
    criteria: ['SBOM im SPDX- oder CycloneDX-Format maschinenlesbar vorhanden', 'SBOM wird bei jedem Release automatisch generiert (CI/CD-Integration)', 'Alle direkten und transitiven Abhängigkeiten mit Version und Lizenz erfasst'] },

  { id: 'A2-9', article: 'Annex I, Part II, Nr. 9', name: 'Transparenz-Berichte', status: 'pass', gap: '',
    evidence: 'Sicherheits-Datenblatt für Produkt publiziert. Release Notes enthalten Security-relevante Änderungen. Quarterly Security Report an Kunden verteilt. Alle öffentlichen Advisories auf Website archiviert.',
    rationale: 'Erfüllt: Transparenz über Sicherheitseigenschaften und bekannte Schwachstellen ist gewährleistet. Regelmäßige Kommunikation an Kunden etabliert.',
    measure: '',
    criteria: [] },

  // ═══ ARTIKEL — Prozessuale Anforderungen (5) ═══

  { id: 'Art10', article: 'Artikel 10', name: 'Cybersecurity über den Lebenszyklus', status: 'pass', gap: '',
    evidence: 'Cybersecurity ist in den SDLC integriert: Threat Modeling in Design-Phase, SAST in Development, Pentest vor Release, Monitoring in Operations. Security-Champion im Entwicklungsteam benannt. Jährliches Security-Training für alle Entwickler.',
    rationale: 'Erfüllt: Cybersecurity wird über den gesamten Produktlebenszyklus berücksichtigt. Prozesse sind dokumentiert und werden praktiziert. Verbesserungspotenzial bei der Formalisierung des Secure-SDLC-Frameworks.',
    measure: '',
    criteria: [] },

  { id: 'Art11', article: 'Artikel 11', name: 'Cybersecurity Testing & Zertifizierung', status: 'partial', gap: 'Testing-Framework nicht formalisiert, keine externe Zertifizierung',
    evidence: 'Unit-Tests für Security-Funktionen vorhanden. SAST-Tool in CI/CD. Aber: Kein formalisiertes Security-Testing-Framework. Keine externe Zertifizierung oder akkreditierte Prüfung durchgeführt. Testabdeckung für Security-Funktionen bei ~65%.',
    rationale: 'Teilweise erfüllt: Security-Tests existieren, aber nicht in einem formalisierten Framework. Externe Zertifizierung für Klasse II ggf. erforderlich — noch nicht adressiert.',
    measure: '1. Security-Testing-Framework formalisieren (OWASP ASVS als Basis). 2. Testabdeckung für Security-Funktionen auf > 85% erhöhen. 3. Externe Konformitätsbewertung prüfen.',
    criteria: ['Formalisiertes Security-Testing-Framework basierend auf OWASP ASVS oder vergleichbar', 'Testabdeckung für Security-Funktionen ≥ 85%', 'Externe Konformitätsbewertung nach Art. 24 CRA durchgeführt oder beauftragt'] },

  { id: 'Art13', article: 'Artikel 13', name: 'Technische Dokumentation', status: 'partial', gap: 'Unvollständige Architektur-Doku, keine formale Risikoanalyse',
    evidence: 'Architektur-Diagramm vorhanden, aber unvollständig (MQTT- und Modbus-Schnittstellen fehlen). Keine dokumentierte Risikoanalyse gemäß Annex VII. Benutzerhandbuch vorhanden und aktuell.',
    rationale: 'Teilweise erfüllt: Grundlegende Dokumentation existiert. Anforderungen nach Annex VII (vollständige technische Doku inkl. Risikoanalyse) sind jedoch nicht adressiert.',
    measure: '1. Architektur-Dokumentation vervollständigen (alle Schnittstellen und Datenflüsse). 2. Formale Risikoanalyse gemäß Annex VII erstellen. 3. EU-Konformitätserklärung nach Art. 28 vorbereiten.',
    criteria: ['Vollständige Systembeschreibung inkl. aller Schnittstellen und Datenflüsse', 'Dokumentierte Risikoanalyse gemäß CRA Annex VII', 'EU-Konformitätserklärung nach Art. 28 vorbereitet'] },

  { id: 'Art14', article: 'Artikel 14', name: 'Meldepflichten (24h/72h)', status: 'fail', gap: 'Kein Incident-Response-Prozess, keine ENISA-Melderoute',
    evidence: 'Interview: Kein dokumentierter IR-Prozess. Meldepflichten nach CRA Art. 14 sind dem Entwicklungsteam nicht bekannt. Kein ENISA-Konto registriert. Keine Trockenübung durchgeführt.',
    rationale: 'Nicht erfüllt: CRA Art. 14 verpflichtet zur Meldung aktiv ausgenutzter Schwachstellen innerhalb von 24h (Frühwarnung) und 72h (vollständiger Bericht) an ENISA. Ohne vorbereiteten Prozess ist die Einhaltung dieser Fristen unmöglich.',
    measure: '1. IR-Prozess dokumentieren (Rollen, Eskalationsstufen, Zeitvorgaben). 2. ENISA-Meldeplattform registrieren. 3. Trockenübung (Tabletop Exercise) durchführen. 4. On-Call-Rotation für Security-Incidents einrichten.',
    criteria: ['Incident-Response-Prozess dokumentiert mit definierten Rollen, Eskalationsstufen und Zeitvorgaben', 'ENISA-Meldeplattform registriert und Meldeprozess getestet (Trockenübung)', 'Frühwarnmeldung innerhalb von 24h und vollständiger Bericht innerhalb von 72h sichergestellt', 'On-Call-Rotation für Security-Incidents definiert'] },

  { id: 'Art22', article: 'Artikel 22', name: 'Marktüberwachung & Konformitätserklärung', status: 'pass', gap: '',
    evidence: 'CE-Kennzeichnung am Produkt angebracht. EU-Konformitätserklärung in Entwurfsfassung vorhanden. Produktregistrierung bei nationaler Marktüberwachungsbehörde vorbereitet. Kontaktdaten des Herstellers auf Produkt und Verpackung.',
    rationale: 'Erfüllt: Grundlegende Marktüberwachungspflichten werden adressiert. CE-Kennzeichnung und Herstellerangaben sind vorhanden. Konformitätserklärung muss nach Abschluss der CRA-Bewertung finalisiert werden.',
    measure: '',
    criteria: [] },
];
