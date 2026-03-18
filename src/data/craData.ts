// ── CRA Tool Constants & Demo Data ──────────────────────────────

export const PRODUCT_TYPES = [
  { id: 'iot', label: 'IoT-Gerät', icon: '📡', desc: 'Sensor, Gateway, Smart Device' },
  { id: 'embed', label: 'Embedded System', icon: '🔧', desc: 'Firmware, Controller, SPS' },
  { id: 'sw', label: 'Software-Produkt', icon: '💻', desc: 'Desktop- oder Server-Anwendung' },
  { id: 'mobile', label: 'Mobile App', icon: '📱', desc: 'iOS oder Android App' },
  { id: 'cloud', label: 'Cloud-Dienst', icon: '☁️', desc: 'SaaS, PaaS, Web-API' },
  { id: 'hw', label: 'Hardware-Produkt', icon: '🖥️', desc: 'Ohne eigene Software' },
  { id: 'network', label: 'Netzwerkgerät', icon: '🌐', desc: 'Router, Switch, Firewall' },
  { id: 'kombi', label: 'Kombiniertes Produkt', icon: '⚙️', desc: 'Hardware + Software zusammen' },
] as const;

export const CRA_CLASSES = [
  { id: 'default', label: 'Default', color: 'border-green-500 bg-green-500/10 text-green-400', desc: 'Die meisten Produkte fallen hierunter. Selbstbewertung erlaubt.', example: 'Einfache Smart-Home-Geräte, Standard-Software ohne besondere Kritikalität' },
  { id: 'k1', label: 'Klasse I', color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400', desc: 'Erhöhtes Risiko. Zertifizierung durch Dritte oder Einhaltung harmonisierter Normen nötig.', example: 'Browser, Passwort-Manager, VPN-Produkte, Betriebssysteme' },
  { id: 'k2', label: 'Klasse II', color: 'border-orange-500 bg-orange-500/10 text-orange-400', desc: 'Hohes Risiko. Pflicht zur Drittprüfung durch akkreditierte Stelle.', example: 'Industrielle Router, Sicherheitskameras, SCADA-Systeme, Firewalls' },
  { id: 'krit', label: 'Kritisch', color: 'border-destructive bg-destructive/10 text-destructive', desc: 'Kritische Infrastruktur. EU-Typprüfung erforderlich.', example: 'Sicherheitsprodukte für kritische Infrastruktur, HSMs' },
] as const;

export const DEPLOYMENT_OPTS = [
  { id: 'cloud', label: 'Cloud', icon: '☁️' },
  { id: 'onprem', label: 'On-Premises', icon: '🏢' },
  { id: 'hybrid', label: 'Hybrid', icon: '🔀' },
  { id: 'embedded', label: 'Embedded/Edge', icon: '🔌' },
  { id: 'mobile', label: 'Mobil', icon: '📱' },
] as const;

export const COMPONENT_OPTS = [
  'Web-Frontend', 'Mobile App', 'REST-API', 'GraphQL-API', 'Datenbank', 'Cloud-Backend',
  'Embedded Firmware', 'MQTT-Broker', 'OPC-UA Server', 'Message Queue', 'Authentication-Service',
  'Admin-Interface', 'Update-Service', 'Logging/Monitoring', 'VPN-Gateway', 'WLAN/LAN-Stack',
] as const;

export const INTERFACE_OPTS = [
  { label: 'HTTPS/REST', icon: '🔒' }, { label: 'HTTP', icon: '⚠️' }, { label: 'MQTT (TLS)', icon: '🔒' },
  { label: 'MQTT (unverschl.)', icon: '⚠️' }, { label: 'WebSocket', icon: '🔗' }, { label: 'SSH', icon: '🔑' },
  { label: 'USB', icon: '🖇️' }, { label: 'Bluetooth', icon: '📶' }, { label: 'WLAN', icon: '📡' },
  { label: 'LAN/Ethernet', icon: '🔌' }, { label: 'OPC-UA', icon: '🏭' }, { label: 'Modbus', icon: '🏭' },
  { label: 'SNMP', icon: '📊' }, { label: 'FTP/SFTP', icon: '📁' }, { label: 'SMTP', icon: '📧' },
  { label: 'Proprietäres Protokoll', icon: '❓' },
] as const;

export const ROLE_PRESETS = [
  'Administrator', 'Standard-Nutzer', 'Wartungstechniker', 'Nur-Lesen Nutzer',
  'API-Client (Maschine)', 'Externer Dienstleister', 'Auditor', 'Entwickler (Dev-Zugang)',
] as const;

export const SECURITY_MEASURES = [
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
] as const;

export const SECURITY_CATEGORIES = [...new Set(SECURITY_MEASURES.map(m => m.cat))] as string[];

export const ATTACH_TYPES = [
  { id: 'arch', label: 'Architekturdiagramm', icon: '🗺️', accept: '.pdf,.png,.jpg,.jpeg,.svg,.pptx,.vsdx,.drawio' },
  { id: 'pentest', label: 'Pentestbericht', icon: '🔍', accept: '.pdf,.docx' },
  { id: 'policy', label: 'Security Policy', icon: '📋', accept: '.pdf,.docx' },
  { id: 'sbom', label: 'SBOM', icon: '📦', accept: '.json,.xml,.csv,.txt,.spdx' },
  { id: 'other', label: 'Sonstiges Dokument', icon: '📎', accept: '*' },
] as const;

// ── Types ───────────────────────────────────────────────────────

export interface Threat {
  id: number; stride: string; name: string; component: string;
  attacker: string; path: string; cra: string;
  likelihood: number; impact: number;
  evidence: string; rationale: string; sources: string[];
}

export interface CraReq {
  id: string; article: string; name: string;
  status: 'pass' | 'partial' | 'fail';
  gap: string; measure: string;
  evidence: string; rationale: string; criteria: string[];
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
  measures: string[];
  knownIssues: string;
  files: { name: string; size: number; type: string }[];
}

export const EMPTY_INTAKE: IntakeData = {
  productName: '', version: '', productTypes: [], craClass: '',
  description: '', components: [], deployment: '',
  interfaces: [], roles: [], customRole: '',
  measures: [], knownIssues: '', files: [],
};

// ── Demo Threats ────────────────────────────────────────────────

export const THREATS: Threat[] = [
  { id: 1, stride: 'S', name: 'Spoofing des MQTT-Brokers', component: 'MQTT-Interface', attacker: 'Externer Angreifer', path: 'Angreifer positioniert sich als legitimer MQTT-Broker → Gerät verbindet sich mit False-Server → Datenabfluss', cra: 'Annex I, Part I, Nr. 3', likelihood: 3, impact: 4,
    evidence: 'Konfigurationsanalyse: MQTT-Client verbindet sich ohne Server-Zertifikatsvalidierung (TLS-Pinning fehlt). Netzwerkscan bestätigt offenen Port 1883 ohne mTLS.',
    rationale: 'Likelihood 3: Erfordert Netzwerkzugang, aber kein spezielles Angreifer-Tooling. Impact 4: Vollständiger Datenabfluss aller Sensordaten möglich, kein Integritätsverlust am Gerät selbst.',
    sources: ['OWASP IoT Top 10 – I3: Insecure Ecosystem Interfaces', 'ETSI EN 303 645, Provision 5.5-1'] },
  { id: 2, stride: 'T', name: 'Manipulation der Firmware via OTA', component: 'OTA-Update-Client', attacker: 'Supply-Chain-Angreifer / Insider', path: 'Unsigniertes Firmware-Paket → Gerät installiert Malware → Persistente Kompromittierung', cra: 'Annex I, Part I, Nr. 1', likelihood: 2, impact: 5,
    evidence: 'Code-Review: OTA-Client prüft weder kryptografische Signatur noch Integritäts-Hash des Firmware-Pakets. Download über HTTPS, aber ohne Certificate-Pinning.',
    rationale: 'Likelihood 2: Supply-Chain-Zugang oder Kompromittierung des Update-Servers erforderlich – nicht trivial. Impact 5: Persistente Kompromittierung mit vollständiger Geräte-Kontrolle, Lateral Movement in OT-Netzwerk möglich.',
    sources: ['CRA Annex I, Part I, Nr. 1: Produkte ohne bekannte Schwachstellen', 'NIST SP 800-193: Platform Firmware Resiliency'] },
  { id: 3, stride: 'T', name: 'Parameter-Manipulation REST-API', component: 'REST-API-Server', attacker: 'Authentifizierter Nutzer', path: 'Manipulierte API-Parameter → kein Input-Validation → Konfigurationsänderung außerhalb Berechtigung', cra: 'Annex I, Part I, Nr. 3', likelihood: 4, impact: 3,
    evidence: 'API-Test: PUT /config akzeptiert beliebige JSON-Schlüssel ohne Schema-Validierung. Kein RBAC auf Endpoint-Ebene – jeder authentifizierte Nutzer kann Konfigurationsparameter ändern.',
    rationale: 'Likelihood 4: Standard-Tooling (curl, Postman) genügt, keine besonderen Rechte nötig. Impact 3: Konfigurationsänderung kann Betriebsparameter verfälschen, aber kein direkter Datenabfluss.',
    sources: ['OWASP API Security Top 10 – API1: Broken Object Level Authorization', 'CWE-20: Improper Input Validation'] },
  { id: 4, stride: 'R', name: 'Fehlende Audit-Logs Admin', component: 'Web-UI Admin', attacker: 'Interner Nutzer', path: 'Admin-Aktionen nicht protokolliert → nicht nachvollziehbar → Compliance-Problem', cra: 'Annex I, Part I, Nr. 8', likelihood: 3, impact: 3,
    evidence: 'Systemprüfung: Keine Log-Dateien für administrative Aktionen vorhanden. Weder Konfigurationsänderungen noch Benutzerverwaltung werden protokolliert. Kein Syslog-Export konfiguriert.',
    rationale: 'Likelihood 3: Jeder Admin-Nutzer kann unbemerkt Änderungen vornehmen. Impact 3: Compliance-Verstoß (CRA Art. 10 Abs. 10), forensische Aufklärung nach Vorfällen unmöglich.',
    sources: ['CRA Annex I, Part I, Nr. 8: Sicherheits-Logging', 'ISO/IEC 27001:2022, A.8.15: Logging'] },
  { id: 5, stride: 'I', name: 'Klartext-MQTT (Port 1883)', component: 'MQTT-Interface', attacker: 'Netzwerk-Mitleser (MITM)', path: 'Unverschlüsselte MQTT-Verbindung → Passwort-Sniffing → Vollzugriff auf Sensordaten', cra: 'Annex I, Part I, Nr. 4', likelihood: 4, impact: 4,
    evidence: 'Netzwerkmitschnitt (Wireshark): MQTT CONNECT-Paket auf Port 1883 enthält Benutzername und Passwort im Klartext. Payload-Daten (Sensorwerte) ebenfalls unverschlüsselt.',
    rationale: 'Likelihood 4: Passives Mitlesen im gleichen Netzwerksegment ohne Authentifizierung möglich. Impact 4: Vollständige Offenlegung aller Sensordaten und Zugangsdaten; ermöglicht Folge-Angriffe.',
    sources: ['CRA Annex I, Part I, Nr. 4: Vertraulichkeit von Daten', 'ETSI EN 303 645, Provision 5.8-1: Kommunikationssicherheit'] },
  { id: 6, stride: 'D', name: 'DoS auf MQTT-Broker', component: 'MQTT-Broker', attacker: 'Externer Angreifer', path: 'Flood-Angriff → Broker-Überlastung → Produktionsausfall', cra: 'Annex I, Part I, Nr. 7', likelihood: 3, impact: 4,
    evidence: 'Lasttest: MQTT-Broker akzeptiert unbegrenzte Verbindungen ohne Rate-Limiting. Bei 500 gleichzeitigen Verbindungen: CPU 100%, Response-Time > 30s, bestehende Clients getrennt.',
    rationale: 'Likelihood 3: Erfordert Netzwerkzugang zum Broker-Port, aber kein spezielles Tooling. Impact 4: Produktionsausfall – alle verbundenen Geräte verlieren Steuerungskommunikation.',
    sources: ['CRA Annex I, Part I, Nr. 7: Verfügbarkeit und Ausfallsicherheit', 'NIST SP 800-82r3: Guide to OT Security'] },
  { id: 7, stride: 'E', name: 'Standard-Admin-Passwort aktiv', component: 'Web-UI Admin', attacker: 'Opportunistischer Angreifer', path: 'Standard-Passwort nicht geändert → Vollzugriff ohne Aufwand', cra: 'Annex I, Part I, Nr. 2', likelihood: 5, impact: 5,
    evidence: 'Erstinbetriebnahme-Test: Login mit admin/admin erfolgreich. Kein Passwort-Änderungszwang beim ersten Login. Standard-Credentials in öffentlicher Produktdokumentation auffindbar.',
    rationale: 'Likelihood 5: Öffentlich bekannte Credentials, kein technisches Wissen erforderlich. Impact 5: Vollständiger administrativer Zugriff – Konfiguration, Firmware-Update, Daten-Export, Nutzerverwaltung.',
    sources: ['CRA Annex I, Part I, Nr. 2: Secure by Default', 'ETSI EN 303 645, Provision 5.1-1: No universal default passwords', 'CWE-1392: Use of Default Credentials'] },
  { id: 8, stride: 'E', name: 'Session-Hijacking Web-UI', component: 'Web-UI Admin', attacker: 'Netzwerk-Angreifer', path: 'Unsicheres Session-Management → Token-Diebstahl → Admin-Zugriff ohne Authentifizierung', cra: 'Annex I, Part I, Nr. 3', likelihood: 3, impact: 4,
    evidence: 'Cookie-Analyse: Session-Token ohne Secure- und HttpOnly-Flag gesetzt. Token-Rotation nach Login findet nicht statt. Session-Timeout: 24h (konfiguriert), kein Re-Auth bei sensitiven Aktionen.',
    rationale: 'Likelihood 3: Erfordert MITM-Position oder XSS-Vektor im selben Netzwerk. Impact 4: Vollständiger Admin-Zugriff mit gestohlener Session, aber zeitlich begrenzt auf Session-Lebensdauer.',
    sources: ['OWASP Session Management Cheat Sheet', 'CWE-614: Sensitive Cookie in HTTPS Session Without Secure Attribute'] },
];

// ── Demo CRA Requirements ───────────────────────────────────────

export const CRA_REQS: CraReq[] = [
  { id: 'A1-1', article: 'Annex I, Part I, Nr. 1', name: 'Keine bekannten Schwachstellen', status: 'partial', gap: 'OTA-Signaturprüfung fehlt, CVE-Tracking nicht formalisiert',
    evidence: 'OTA-Client akzeptiert unsignierte Pakete (vgl. Bedrohung T-002). Kein dokumentierter CVE-Monitoring-Prozess. SBOM nicht vorhanden.',
    rationale: 'Teilweise erfüllt: HTTPS wird für Download genutzt, aber ohne Integritätsprüfung des Pakets ist die Anforderung nicht vollständig adressiert.',
    measure: 'Signierten Update-Prozess implementieren, SBOM erstellen, CVE-Monitoring einrichten',
    criteria: ['Firmware-Pakete werden vor Installation kryptografisch verifiziert (z. B. Ed25519, RSA-2048+)', 'CVE-Monitoring-Prozess ist dokumentiert und wird mindestens wöchentlich ausgeführt', 'SBOM in SPDX- oder CycloneDX-Format liegt vor und wird bei jedem Release aktualisiert'] },
  { id: 'A1-2', article: 'Annex I, Part I, Nr. 2', name: 'Secure by Default', status: 'fail', gap: 'Standard-Passwort aktiv, unsichere Default-Konfigurationen',
    evidence: 'Login mit admin/admin erfolgreich (vgl. Bedrohung E-007). Port 1883 (unverschlüsseltes MQTT) im Auslieferungszustand geöffnet. Telnet-Service aktiv.',
    rationale: 'Nicht erfüllt: Mehrere unsichere Defaults in Kombination. CRA verlangt, dass Produkte im Auslieferungszustand keine bekannten Angriffsvektoren exponieren.',
    measure: 'Passwort-Änderung beim Erststart erzwingen, unsichere Ports deaktivieren',
    criteria: ['Erstinbetriebnahme erzwingt individuelle Passwort-Vergabe (min. 12 Zeichen, Komplexitätsanforderung)', 'Alle nicht für den Betrieb notwendigen Ports und Dienste sind im Auslieferungszustand deaktiviert', 'Konfiguration folgt einem dokumentierten Hardening-Guide'] },
  { id: 'A1-3', article: 'Annex I, Part I, Nr. 3', name: 'Schutz vor unbefugtem Zugriff', status: 'fail', gap: 'Kein MFA, schwaches Session-Management, MQTT ohne Auth',
    evidence: 'Session-Cookies ohne Secure/HttpOnly-Flag (vgl. Bedrohung E-008). MQTT-Broker akzeptiert Verbindungen ohne Authentifizierung. Kein MFA verfügbar.',
    rationale: 'Nicht erfüllt: Drei unabhängige Schwachstellen betreffen diese Anforderung. Jede einzelne wäre bereits als Lücke zu bewerten.',
    measure: 'MFA für Admin implementieren, MQTT-Authentifizierung aktivieren, Session-Tokens sichern',
    criteria: ['MFA für alle administrativen Zugänge implementiert (TOTP oder FIDO2)', 'MQTT-Broker erfordert Authentifizierung mit individuellen Credentials pro Gerät', 'Session-Cookies mit Secure-, HttpOnly- und SameSite-Flag; Token-Rotation nach Login; Timeout ≤ 30 min'] },
  { id: 'A1-4', article: 'Annex I, Part I, Nr. 4', name: 'Vertraulichkeit der Daten', status: 'fail', gap: 'MQTT-Verbindung unverschlüsselt (Port 1883)',
    evidence: 'Wireshark-Mitschnitt bestätigt Klartext-Übertragung von Credentials und Sensordaten auf Port 1883 (vgl. Bedrohung I-005).',
    rationale: 'Nicht erfüllt: Transportverschlüsselung ist eine Grundanforderung. Unverschlüsselte Kommunikation mit Credentials im Klartext ist ein direkter Verstoß.',
    measure: 'MQTT nur über TLS (Port 8883), Port 1883 deaktivieren',
    criteria: ['Gesamte Kommunikation über TLS 1.2+ verschlüsselt', 'Port 1883 ist deaktiviert und nicht konfigurierbar', 'TLS-Zertifikatsvalidierung auf Client- und Server-Seite aktiv'] },
  { id: 'A1-7', article: 'Annex I, Part I, Nr. 7', name: 'Verfügbarkeit & Ausfallsicherheit', status: 'partial', gap: 'Kein Rate-Limiting auf MQTT-Broker',
    evidence: 'Lasttest: Broker-Ausfall bei 500 gleichzeitigen Verbindungen (vgl. Bedrohung D-006). Kein Watchdog oder Auto-Restart konfiguriert.',
    rationale: 'Teilweise erfüllt: Grundlegende Verfügbarkeit ist gegeben, aber keine Schutzmaßnahmen gegen gezielte Überlastung implementiert.',
    measure: 'Rate-Limiting, Connection-Throttling und Watchdog implementieren',
    criteria: ['Rate-Limiting pro Client-IP konfiguriert (max. Verbindungen/Minute)', 'Connection-Throttling begrenzt gleichzeitige Verbindungen auf definierten Schwellwert', 'Watchdog-Prozess startet Broker-Dienst automatisch bei Ausfall (< 30s Recovery)'] },
  { id: 'A1-8', article: 'Annex I, Part I, Nr. 8', name: 'Sicherheits-Logging & Monitoring', status: 'fail', gap: 'Admin-Aktionen nicht protokolliert',
    evidence: 'Systemprüfung: Keine Log-Dateien für administrative Aktionen (vgl. Bedrohung R-004). Kein Syslog-Export. Keine Tamper-Protection für Logs.',
    rationale: 'Nicht erfüllt: Ohne Logging ist keine Nachvollziehbarkeit von Sicherheitsvorfällen möglich. Forensische Analyse nach einem Vorfall ist ausgeschlossen.',
    measure: 'Audit-Log für alle Admin-Aktionen, Log-Rotation, sichere Log-Übertragung',
    criteria: ['Alle administrativen Aktionen werden mit Zeitstempel, Benutzer-ID und Aktion protokolliert', 'Logs sind vor Manipulation geschützt (Append-Only oder signiert)', 'Log-Export an externes System (Syslog/SIEM) ist konfigurierbar und dokumentiert'] },
  { id: 'A2-1', article: 'Annex I, Part II, Nr. 1', name: 'Schwachstellen-Identifikation', status: 'partial', gap: 'Kein formaler Prozess, keine regelmäßigen Pentests dokumentiert',
    evidence: 'Interview: Ad-hoc Schwachstellen-Behebung, aber kein dokumentierter Vulnerability-Handling-Prozess. Kein Pentest-Bericht der letzten 12 Monate vorliegend.',
    rationale: 'Teilweise erfüllt: Schwachstellen werden reaktiv behoben, aber CRA verlangt einen systematischen, dokumentierten Prozess.',
    measure: 'Vulnerability-Management-Prozess definieren',
    criteria: ['Dokumentierter Vulnerability-Handling-Prozess gemäß ISO/IEC 30111 oder vergleichbar', 'Regelmäßige Sicherheitstests (Pentest, SAST, DAST) mindestens jährlich, dokumentiert', 'Verantwortliche Kontaktstelle für Schwachstellenmeldungen öffentlich erreichbar'] },
  { id: 'A2-8', article: 'Annex I, Part II, Nr. 8', name: 'SBOM', status: 'fail', gap: 'Keine SBOM vorhanden',
    evidence: 'Dokumentenprüfung: Weder SBOM noch Komponentenliste verfügbar. Third-Party-Libraries werden verwendet, aber nicht inventarisiert.',
    rationale: 'Nicht erfüllt: CRA verpflichtet zur Bereitstellung einer SBOM. Ohne Inventar der verwendeten Komponenten ist kein CVE-Monitoring möglich.',
    measure: 'SBOM in SPDX oder CycloneDX Format erstellen',
    criteria: ['SBOM im SPDX- oder CycloneDX-Format maschinenlesbar vorhanden', 'SBOM wird bei jedem Release automatisch generiert (CI/CD-Integration)', 'Alle direkten und transitiven Abhängigkeiten mit Version und Lizenz erfasst'] },
  { id: 'Art14', article: 'Artikel 14', name: 'Meldepflichten (24h/72h)', status: 'fail', gap: 'Kein Incident-Response-Prozess, keine ENISA-Melderoute',
    evidence: 'Interview: Kein dokumentierter IR-Prozess. Meldepflichten nach CRA Art. 14 sind dem Entwicklungsteam nicht bekannt. Kein ENISA-Konto registriert.',
    rationale: 'Nicht erfüllt: CRA Art. 14 verpflichtet zur Meldung aktiv ausgenutzter Schwachstellen innerhalb von 24h (Frühwarnung) und 72h (vollständiger Bericht) an ENISA.',
    measure: 'IR-Prozess dokumentieren, Meldewege zu ENISA/BSI definieren',
    criteria: ['Incident-Response-Prozess dokumentiert mit definierten Rollen, Eskalationsstufen und Zeitvorgaben', 'ENISA-Meldeplattform registriert und Meldeprozess getestet (Trockenübung)', 'Frühwarnmeldung innerhalb von 24h und vollständiger Bericht innerhalb von 72h sichergestellt'] },
  { id: 'Art13', article: 'Artikel 13', name: 'Technische Dokumentation', status: 'partial', gap: 'Unvollständige Architektur-Doku, keine Risikoanalyse vorhanden',
    evidence: 'Dokumentenprüfung: Architektur-Diagramm vorhanden, aber unvollständig (MQTT-Schnittstelle fehlt). Keine dokumentierte Risikoanalyse. Benutzerhandbuch vorhanden.',
    rationale: 'Teilweise erfüllt: Grundlegende Dokumentation existiert, aber die Anforderungen nach Annex VII (vollständige technische Doku inkl. Risikoanalyse) sind nicht adressiert.',
    measure: 'Technische Dokumentation nach Annex VII vervollständigen',
    criteria: ['Vollständige Systembeschreibung inkl. aller Schnittstellen und Datenflüsse', 'Dokumentierte Risikoanalyse gemäß CRA Annex VII', 'EU-Konformitätserklärung nach Art. 28 vorbereitet'] },
];

// ── STRIDE Meta ─────────────────────────────────────────────────

export const STRIDE_META: Record<string, { label: string; dot: string; badge: string }> = {
  S: { label: 'Spoofing', dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  T: { label: 'Tampering', dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  R: { label: 'Repudiation', dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  I: { label: 'Info Disclosure', dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  D: { label: 'Denial of Service', dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  E: { label: 'Elevation of Priv.', dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

export const MAIN_STEPS = ['System Intake', 'Threat Modeling', 'Risk Assessment', 'CRA Mapping', 'Report'] as const;
