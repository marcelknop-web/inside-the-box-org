import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Progress } from '@/components/ui/progress';

// ── Demo data ──────────────────────────────────────────────────

const EXAMPLE_INTAKE = {
  productName: 'SmartGate Pro',
  version: '2.4.1',
  productType: 'IoT-Gateway (Hardware + Software)',
  craClass: 'Klasse I',
  description: 'Industrielles IoT-Gateway, das Sensordaten aus Produktionsanlagen erfasst, verarbeitet und an eine Cloud-Plattform überträgt. Unterstützt MQTT, REST-API, OTA-Updates via HTTPS.',
  components: 'Embedded Linux, MQTT-Broker, REST-API-Server, OTA-Update-Client, Web-UI (Admin)',
  interfaces: 'MQTT (Port 1883/8883), REST-API (Port 443), Web-UI (Port 8080), USB (Wartung), WLAN/LAN',
  users: 'Produktionsleiter (Admin), Maschinenbediener (Lesen), Wartungstechniker (Vollzugriff)',
  existingControls: 'TLS für Cloud-Verbindung, Basis-Authentifizierung Web-UI',
  knownIssues: 'Standard-Admin-Passwort nach Auslieferung aktiv, kein MFA',
};

interface Threat {
  id: number; stride: string; name: string; component: string; attacker: string; path: string; cra: string; likelihood: number; impact: number;
}

const THREATS: Threat[] = [
  { id: 1, stride: 'S', name: 'Spoofing des MQTT-Brokers', component: 'MQTT-Interface', attacker: 'Externer Angreifer (Netzwerkzugang)', path: 'Angreifer positioniert sich als legitimer MQTT-Broker → Gerät verbindet sich mit False-Server → Datenabfluss und Steuerungsübernahme', cra: 'Annex I, Part I, Nr. 3', likelihood: 3, impact: 4 },
  { id: 2, stride: 'T', name: 'Manipulation der Firmware via OTA', component: 'OTA-Update-Client', attacker: 'Supply-Chain-Angreifer / Insider', path: 'Unsigniertes Firmware-Paket wird in Update-Server eingeschleust → Gerät lädt und installiert Malware → Persistente Kompromittierung', cra: 'Annex I, Part I, Nr. 1', likelihood: 2, impact: 5 },
  { id: 3, stride: 'T', name: 'Parameter-Manipulation via REST-API', component: 'REST-API-Server', attacker: 'Authentifizierter Nutzer (privilege escalation)', path: 'Nutzer sendet manipulierte API-Parameter → Fehlendes Input-Validation → Konfigurationsänderungen außerhalb eigener Berechtigung', cra: 'Annex I, Part I, Nr. 3', likelihood: 4, impact: 3 },
  { id: 4, stride: 'R', name: 'Fehlende Audit-Logs Admin-Aktionen', component: 'Web-UI Admin', attacker: 'Interner Nutzer (Insider Threat)', path: 'Admin-Aktionen werden nicht protokolliert → Konfigurationsänderungen nicht nachvollziehbar → DSGVO/CRA-Compliance-Problem', cra: 'Annex I, Part I, Nr. 8', likelihood: 3, impact: 3 },
  { id: 5, stride: 'I', name: 'Klartext-MQTT (Port 1883)', component: 'MQTT-Interface', attacker: 'Netzwerk-Mitleser (MITM)', path: 'Unverschlüsselte MQTT-Verbindung → Passwort-Sniffing → Vollständiger Zugriff auf Sensor-Daten und Steuerbefehle', cra: 'Annex I, Part I, Nr. 4', likelihood: 4, impact: 4 },
  { id: 6, stride: 'D', name: 'DoS auf MQTT-Broker', component: 'MQTT-Broker', attacker: 'Externer Angreifer', path: 'Flood-Angriff auf MQTT-Port → Broker-Überlastung → Produktionsausfall durch fehlende Sensor-Kommunikation', cra: 'Annex I, Part I, Nr. 7', likelihood: 3, impact: 4 },
  { id: 7, stride: 'E', name: 'Standard-Admin-Passwort aktiv', component: 'Web-UI Admin', attacker: 'Opportunistischer Angreifer', path: 'Standard-Passwort (admin/admin) nicht geändert → Vollständiger Admin-Zugriff ohne Aufwand → Komplette Gerätekompromittierung', cra: 'Annex I, Part I, Nr. 2', likelihood: 5, impact: 5 },
  { id: 8, stride: 'E', name: 'Session-Hijacking Web-UI', component: 'Web-UI Admin', attacker: 'Netzwerk-Angreifer', path: 'Unsicheres Session-Management → Token-Diebstahl → Zugriff auf Admin-Interface ohne Authentifizierung', cra: 'Annex I, Part I, Nr. 3', likelihood: 3, impact: 4 },
];

interface CraReq {
  id: string; article: string; name: string; status: 'pass' | 'partial' | 'fail'; gap: string; measure: string;
}

const CRA_REQS: CraReq[] = [
  { id: 'A1-1', article: 'Annex I, Part I, Nr. 1', name: 'Keine bekannten Schwachstellen', status: 'partial', gap: 'OTA-Signaturprüfung fehlt, CVE-Tracking nicht formalisiert', measure: 'Signierten Update-Prozess implementieren, SBOM erstellen, CVE-Monitoring einrichten' },
  { id: 'A1-2', article: 'Annex I, Part I, Nr. 2', name: 'Secure by Default', status: 'fail', gap: 'Standard-Passwort aktiv, unsichere Default-Konfigurationen', measure: 'Passwort-Änderung beim Erststart erzwingen, unsichere Ports deaktivieren' },
  { id: 'A1-3', article: 'Annex I, Part I, Nr. 3', name: 'Schutz vor unbefugtem Zugriff', status: 'fail', gap: 'Kein MFA, schwaches Session-Management, MQTT ohne Auth', measure: 'MFA für Admin implementieren, MQTT-Authentifizierung aktivieren, Session-Tokens sichern' },
  { id: 'A1-4', article: 'Annex I, Part I, Nr. 4', name: 'Vertraulichkeit der Daten', status: 'fail', gap: 'MQTT-Verbindung unverschlüsselt (Port 1883)', measure: 'MQTT nur über TLS (Port 8883), Port 1883 deaktivieren' },
  { id: 'A1-7', article: 'Annex I, Part I, Nr. 7', name: 'Verfügbarkeit & Ausfallsicherheit', status: 'partial', gap: 'Kein Rate-Limiting auf MQTT-Broker', measure: 'Rate-Limiting, Connection-Throttling und Watchdog-Mechanismus implementieren' },
  { id: 'A1-8', article: 'Annex I, Part I, Nr. 8', name: 'Sicherheits-Logging & Monitoring', status: 'fail', gap: 'Admin-Aktionen nicht protokolliert, keine zentrale Log-Verwaltung', measure: 'Audit-Log für alle Admin-Aktionen, Log-Rotation und sichere Log-Übertragung' },
  { id: 'A2-1', article: 'Annex I, Part II, Nr. 1', name: 'Schwachstellen-Identifikation', status: 'partial', gap: 'Kein formaler Prozess, keine regelmäßigen Pentests dokumentiert', measure: 'Vulnerability-Management-Prozess definieren und dokumentieren' },
  { id: 'A2-8', article: 'Annex I, Part II, Nr. 8', name: 'Software Bill of Materials (SBOM)', status: 'fail', gap: 'Keine SBOM vorhanden', measure: 'SBOM in SPDX oder CycloneDX Format erstellen und pflegen' },
  { id: 'Art14', article: 'Artikel 14', name: 'Meldepflichten (24h/72h)', status: 'fail', gap: 'Kein Incident-Response-Prozess, keine ENISA-Melderoute etabliert', measure: 'IR-Prozess dokumentieren, Meldewege zu ENISA/BSI definieren und testen' },
  { id: 'Art13', article: 'Artikel 13', name: 'Technische Dokumentation', status: 'partial', gap: 'Unvollständige Architektur-Dokumentation, keine Risikoanalyse vorhanden', measure: 'Technische Dokumentation nach Annex VII vervollständigen' },
];

const STRIDE_META: Record<string, { label: string; dot: string; badge: string }> = {
  S: { label: 'Spoofing', dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  T: { label: 'Tampering', dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20' },
  R: { label: 'Repudiation', dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  I: { label: 'Info Disclosure', dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  D: { label: 'Denial of Service', dot: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  E: { label: 'Elevation of Priv.', dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
};

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
      <span className="text-xs font-bold w-4 text-muted-foreground">{value}</span>
    </div>
  );
}

const STEPS = ['System Intake', 'Threat Modeling', 'Risk Assessment', 'CRA Mapping', 'Report'];

// ── Phase 1: Intake ────────────────────────────────────────────
function IntakeForm({ data, setData, onNext }: { data: typeof EXAMPLE_INTAKE; setData: React.Dispatch<React.SetStateAction<typeof EXAMPLE_INTAKE>>; onNext: () => void }) {
  const F = ({ label, field, rows }: { label: string; field: keyof typeof EXAMPLE_INTAKE; rows?: number }) => (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{label}</label>
      {rows
        ? <textarea rows={rows} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none" value={data[field]} onChange={e => setData(p => ({ ...p, [field]: e.target.value }))} />
        : <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" value={data[field]} onChange={e => setData(p => ({ ...p, [field]: e.target.value }))} />
      }
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-foreground">
        Erfassen Sie alle relevanten Systeminformationen. Je vollständiger die Angaben, desto präziser das KI-Assessment.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="Produktname" field="productName" />
        <F label="Version" field="version" />
        <F label="Produkt-Typ" field="productType" />
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">CRA-Klassifizierung</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" value={data.craClass} onChange={e => setData(p => ({ ...p, craClass: e.target.value }))}>
            <option>Default (Selbstbewertung)</option>
            <option>Klasse I (Dritte oder Normen)</option>
            <option>Klasse II (Pflicht-Drittprüfung)</option>
            <option>Kritisch (EU-Prüfung)</option>
          </select>
        </div>
      </div>
      <F label="Systembeschreibung" field="description" rows={3} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="Hauptkomponenten" field="components" rows={2} />
        <F label="Schnittstellen & Protokolle" field="interfaces" rows={2} />
        <F label="Nutzerrollen" field="users" rows={2} />
        <F label="Bestehende Sicherheitsmaßnahmen" field="existingControls" rows={2} />
      </div>
      <F label="Bekannte Schwachstellen / offene Punkte" field="knownIssues" rows={2} />
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="font-semibold">KI-Analyse starten →</Button>
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
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-foreground">
        <strong>{threats.length} Bedrohungen</strong> identifiziert. Klicken Sie auf eine Bedrohung für Details.
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(STRIDE_META).map(([k, m]) => (
          <div key={k} className="bg-card border border-border rounded-lg p-3 text-center">
            <div className={`w-8 h-8 rounded-full ${m.dot} text-white font-bold text-sm flex items-center justify-center mx-auto mb-1`}>{k}</div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className="text-xl font-bold text-foreground">{counts[k] || 0}</div>
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
                  <div className="text-xs text-muted-foreground">{t.component} · {t.cra}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${risk.cls}`}>{risk.label} ({t.likelihood * t.impact})</span>
                {exp === t.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
              {exp === t.id && (
                <div className="border-t border-border bg-secondary/30 px-4 py-3 text-sm space-y-2">
                  <div><span className="font-semibold text-muted-foreground">Angreifer: </span><span className="text-foreground">{t.attacker}</span></div>
                  <div><span className="font-semibold text-muted-foreground">Angriffspfad: </span><span className="text-foreground">{t.path}</span></div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div><div className="text-xs text-muted-foreground mb-1">Likelihood ({t.likelihood}/5)</div><ScoreBar value={t.likelihood} /></div>
                    <div><div className="text-xs text-muted-foreground mb-1">Impact ({t.impact}/5)</div><ScoreBar value={t.impact} /></div>
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
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-foreground">
        Bedrohungen nach <strong>Likelihood × Impact</strong> priorisiert.
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([['Kritisch', 'bg-destructive', cnt.kritisch], ['Hoch', 'bg-orange-500', cnt.hoch], ['Mittel', 'bg-yellow-500', cnt.mittel], ['Niedrig', 'bg-green-500', cnt.niedrig]] as [string, string, number][]).map(([l, c, n]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${c} text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2`}>{n}</div>
            <div className="text-sm font-semibold text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm font-semibold text-foreground mb-3">Risikomatrix</div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="w-20 text-right pr-3 text-muted-foreground font-normal pb-1">Impact ↑</th>
                {[1, 2, 3, 4, 5].map(i => <th key={i} className="w-12 text-center text-muted-foreground font-semibold pb-1">{i}</th>)}
                <th className="pl-2 text-muted-foreground font-normal">← Likelihood</th>
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3, 2, 1].map(imp => (
                <tr key={imp}>
                  <td className="text-right pr-3 text-muted-foreground font-semibold py-0.5">{imp}</td>
                  {[1, 2, 3, 4, 5].map(lik => {
                    const score = lik * imp;
                    const pts = threats.filter(t => t.likelihood === lik && t.impact === imp);
                    return (
                      <td key={lik} className={`w-12 h-10 ${matrixColor(score)} text-center align-middle border border-background`} title={pts.map(p => p.name).join('\n') || ''}>
                        {pts.length > 0 && (
                          <div className="w-6 h-6 bg-background/90 rounded-full text-foreground font-bold text-xs flex items-center justify-center mx-auto shadow cursor-help">{pts.length}</div>
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
                    <td className="px-3 py-2.5 text-center font-semibold text-foreground">{t.likelihood}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-foreground">{t.impact}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-foreground">{t.likelihood * t.impact}</td>
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

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-foreground">
        Automatisches Mapping der Risiken auf <strong>CRA-Anforderungen</strong>.
      </div>
      <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-secondary" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" className={scoreColor.replace('text-', 'stroke-')} strokeWidth="3"
              strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${scoreColor}`}>{score}%</span>
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
          <div className="text-4xl font-bold text-destructive">{fail}</div>
          <div className="text-sm text-muted-foreground">kritische Lücken</div>
          <div className="text-xs text-muted-foreground">vor Audit schließen</div>
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
function Report({ data, threats, reqs }: { data: typeof EXAMPLE_INTAKE; threats: Threat[]; reqs: CraReq[] }) {
  const critRisks = threats.filter(t => t.likelihood * t.impact >= 20);
  const fail = reqs.filter(r => r.status === 'fail');
  const partial = reqs.filter(r => r.status === 'partial');
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-foreground">
        <strong>✔ Assessment abgeschlossen.</strong> In der Produktionsversion wird hier automatisch ein gebrandeter DOCX/PDF-Report generiert.
      </div>
      <div className="bg-card border-l-4 border-primary rounded-lg p-5 border border-border">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cyber Risk Assessment Report</div>
            <div className="text-lg font-bold text-foreground mt-0.5">{data.productName} {data.version}</div>
          </div>
          <div className="sm:text-right text-xs text-muted-foreground">
            <div>{today}</div>
            <div className="mt-0.5">{data.craClass}</div>
          </div>
        </div>
        <div className="h-px bg-border mb-3" />
        <p className="text-sm text-foreground leading-relaxed">
          Das Cyber Risk Assessment für <strong>{data.productName} {data.version}</strong> ({data.productType}) wurde am {today} durchgeführt.
          Es wurden insgesamt <strong>{threats.length} Bedrohungen</strong> identifiziert, davon{' '}
          <strong className="text-destructive">{critRisks.length} mit kritischem Risikoscore (≥ 20)</strong>.
          Von {reqs.length} geprüften CRA-Anforderungen weist das Produkt <strong className="text-destructive">{fail.length} vollständige Lücken</strong> und{' '}
          {partial.length} teilweise erfüllte Anforderungen auf.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
          <span className="text-sm font-bold text-destructive">Sofortmaßnahmen — {fail.length} kritische Lücken</span>
        </div>
        {fail.map((r, i) => (
          <div key={r.id} className={`flex gap-3 px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/30'} ${i < fail.length - 1 ? 'border-b border-border' : ''}`}>
            <span className="font-bold text-destructive w-5 flex-shrink-0">{i + 1}.</span>
            <div>
              <div className="font-semibold text-foreground">{r.name}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{r.measure}</div>
              <div className="text-muted-foreground/60 text-xs mt-0.5">{r.article}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([['Gesamtbedrohungen', threats.length, 'text-foreground'], ['Kritische Risiken', critRisks.length, 'text-destructive'], ['CRA-Lücken', fail.length, 'text-destructive']] as [string, number, string][]).map(([l, n, c]) => (
          <div key={l} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className={`text-3xl font-bold ${c}`}>{n}</div>
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
  const [data, setData] = useState(EXAMPLE_INTAKE);

  const handleIntakeNext = useCallback(() => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(1); }, 1800);
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setData(EXAMPLE_INTAKE);
  }, []);

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background'}>
      {!embedded && <PageMeta title="CRA Compliance Tool" description="AI Cyber Risk & CRA Compliance Assessment" />}

      {/* Stepper */}
      <div className="border-b border-border px-4 py-3 mb-1">
        <div className="flex items-center max-w-5xl mx-auto overflow-x-auto">
          {STEPS.map((s, i) => (
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
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-secondary'}`} />}
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
              <div className="text-lg font-bold text-foreground">{STEPS[step]}</div>
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                  <RotateCcw className="w-4 h-4 mr-1" /> Neu starten
                </Button>
              )}
            </div>
            {step === 0 && <IntakeForm data={data} setData={setData} onNext={handleIntakeNext} />}
            {step === 1 && <ThreatModel threats={THREATS} onNext={() => setStep(2)} />}
            {step === 2 && <RiskAssessment threats={THREATS} onNext={() => setStep(3)} />}
            {step === 3 && <CRAMapping reqs={CRA_REQS} onNext={() => setStep(4)} />}
            {step === 4 && <Report data={data} threats={THREATS} reqs={CRA_REQS} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CraComplianceTool;
