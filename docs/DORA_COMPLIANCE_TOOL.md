# DORA Compliance Audit Tool — Technische Dokumentation

> **Version:** 1.0  
> **Stand:** März 2026  
> **Route:** `/dora`  
> **Regulatorische Grundlage:** Verordnung (EU) 2022/2554 — Digital Operational Resilience Act

---

## 1. Überblick

Das DORA Compliance Audit Tool ist eine interaktive Web-Applikation zur Durchführung strukturierter Konformitätsprüfungen nach dem Digital Operational Resilience Act (DORA). Es richtet sich an Wirtschaftsprüfer, Compliance-Beauftragte und IT-Risikomanager in Finanzunternehmen.

### Kernfunktionen

- **Geführte Datenerfassung** (8-stufiger Intake-Wizard)
- **IKT-Risikolandschaft** mit CIAGTR-Kategorisierung (Confidentiality, Integrity, Availability, Governance, Third-Party, Resilience)
- **Quantitative Risikobewertung** mit 5×5-Matrix (Likelihood × Impact)
- **DORA-Anforderungsmapping** mit Konformitätsbewertung (pass/partial/fail)
- **Automatisierte Qualitätssicherung** (Quality Gates nach den „10 Goldenen Regeln")
- **Automatische Korrekturen** (regelbasierte Fixes ohne Erfindung von Inhalten)
- **PDF-Berichterstellung** (Prüfbericht nach MaRisk/BAIT/DORA-Standards)
- **Interaktive Visualisierungen** (Radar-Charts, Gantt-Charts, Heatmaps, Compliance-Gauges)
- **Mehrsprachigkeit** (Deutsch, Englisch, Französisch)

---

## 2. Architektur

### 2.1 Dateistruktur

```
src/
├── pages/
│   └── DoraComplianceTool.tsx          # Hauptkomponente (1160 Zeilen)
├── components/
│   ├── DoraAuditCharts.tsx             # Audit-Dashboard mit KPI-Charts (505 Zeilen)
│   └── DoraFindingsView.tsx            # Findings & Fixes Visualisierung (288 Zeilen)
├── data/
│   └── doraData.ts                     # Datenmodelle, Konstanten, Demo-Szenarien (538 Zeilen)
├── utils/
│   ├── doraQualityCheck.ts             # Quality-Gate-Engine (512 Zeilen)
│   ├── doraAuditFixes.ts               # Automatische Korrekturen (244 Zeilen)
│   └── doraReportPdf.ts                # PDF-Berichterstellung (1268 Zeilen)
├── i18n/
│   ├── de.ts                           # Deutsche Übersetzungen
│   ├── en.ts                           # Englische Übersetzungen
│   └── fr.ts                           # Französische Übersetzungen
supabase/
└── functions/
    └── dora-reasoning/index.ts         # Edge Function für KI-gestützte Begründungen
```

### 2.2 Technologie-Stack

| Technologie | Verwendungszweck |
|---|---|
| React 18 + TypeScript | UI-Framework |
| Tailwind CSS | Styling (semantische Design-Tokens) |
| Recharts | Interaktive Diagramme (Radar, Bar, Pie, Gantt) |
| jsPDF | Client-seitige PDF-Generierung |
| Framer Motion | Animationen (StaggerReveal, Typewriter) |
| Lovable AI Gateway | KI-gestützte Reasoning-Engine (Gemini) |

### 2.3 Datenfluss

```
IntakeWizard (Datenerfassung)
    │
    ▼
DORA_RISKS / DORA_REQS (Demo-Daten / statische Risiken)
    │
    ├──▶ RiskLandscape (Phase 2 — CIAGTR-Übersicht)
    ├──▶ RiskMatrix (Phase 3 — 5×5-Bewertung)
    ├──▶ DORAMapping (Phase 4 — Anforderungs-Konformität)
    │
    ▼
ReportView (Phase 5)
    │
    ├──▶ runDoraQualityCheck()  ──▶  QaResult
    ├──▶ applyDoraAuditFixes()  ──▶  Korrigierte Risiken/Anforderungen
    ├──▶ DoraFindingsView       ──▶  Findings & Fixes Dashboard
    ├──▶ DoraAuditCharts        ──▶  Vollständiges Audit-Dashboard
    └──▶ generateDoraReport()   ──▶  PDF-Datei
```

---

## 3. Datenmodelle

### 3.1 DoraRisk

```typescript
interface DoraRisk {
  id: number;
  category: string;        // 'C' | 'I' | 'A' | 'G' | 'T' | 'R' (CIAGTR)
  name: string;             // Bezeichnung des Risikos
  component: string;        // Betroffene IKT-Komponente
  attacker: string;         // Bedrohungsakteur
  path: string;             // Angriffspfad
  doraRef: string;          // DORA-Artikelreferenz (z.B. "Art. 8")
  likelihood: number;       // 1-5 (Eintrittswahrscheinlichkeit)
  impact: number;           // 1-5 (Auswirkung)
  evidence: string;         // Evidenzbeschreibung mit E-ID
  rationale: string;        // Quantitative Herleitung der Bewertung
  sources: string[];        // Quellen (DORA-Artikel, Standards)
  evidenceQuality: number;  // 1-5 (Qualität der Evidenz)
  reproducibility: string;  // 'easy' | 'medium' | 'hard'
}
```

**Risiko-ID-Format:** `{Kategorie}-{ID dreistellig}` → z.B. `C-001`, `A-005`

**Risiko-Score:** `likelihood × impact`
- ≥ 20: Kritisch (rot)
- ≥ 13: Hoch (orange)
- ≥ 6: Mittel (gelb)
- < 6: Niedrig (grün)

### 3.2 DoraReq

```typescript
interface DoraReq {
  id: string;              // z.B. "D5-1"
  article: string;         // DORA-Artikel (z.B. "Art. 5 Abs. 1")
  name: string;            // Anforderungsbezeichnung
  status: 'pass' | 'partial' | 'fail';
  gap: string;             // Beschreibung der Lücke
  measure: string;         // Empfohlene Maßnahme
  evidence: string;        // Evidenz
  rationale: string;       // Begründung
  criteria: string[];      // SMARTE Umsetzungskriterien
  effort: string;          // Aufwandsschätzung (z.B. "40-60h")
  priority: string;        // P0 | P1 | P2 | P3
}
```

### 3.3 DoraIntakeData

```typescript
interface DoraIntakeData {
  entityName: string;           // Name des Finanzunternehmens
  entityType: string[];         // Unternehmensart(en)
  criticality: string;         // 'standard' | 'significant' | 'critical'
  description: string;         // Freitextbeschreibung
  infrastructure: string[];    // Ausgewählte IKT-Infrastruktur
  thirdPartyProviders: string[];  // Drittanbieter
  roles: string[];             // Beteiligte Rollen
  customRole: string;          // Benutzerdefinierte Rolle
  measures: Record<string, MeasureEntry>;  // Implementierte Maßnahmen
  knownIssues: string;         // Bekannte Schwachstellen
  files: { name: string; size: number; type: string }[];
}

interface MeasureEntry {
  active: boolean;
  documented: boolean;
  audited: boolean;
  certified: boolean;  // ISO 27001 o.ä.
}
```

### 3.4 CIAGTR-Risikokategorien

| Kürzel | Bezeichnung (DE) | Bezeichnung (EN) |
|---|---|---|
| C | Vertraulichkeit | Confidentiality |
| I | Integrität | Integrity |
| A | Verfügbarkeit | Availability |
| G | Governance | Governance |
| T | Drittanbieter | Third-Party |
| R | Resilienz | Resilience |

---

## 4. Ablauf der Prüfung (5 Phasen)

### Phase 1: Datenerfassung (IntakeWizard)

8 Sub-Schritte im geführten Wizard:

| Schritt | Inhalt | Pflichtfelder |
|---|---|---|
| 0 | Unternehmensname & -art | entityName, entityType |
| 1 | Kritikalitätseinstufung | criticality |
| 2 | Beschreibung & Drittanbieter | — (optional) |
| 3 | IKT-Infrastruktur | infrastructure |
| 4 | Rollen & bekannte Schwachstellen | roles |
| 5 | Sicherheitsmaßnahmen (Reifegradmodell) | — (optional) |
| 6 | Dokumenten-Upload | — (optional) |
| 7 | Zusammenfassung & Start | — |

**Demo-Funktion:** Auf Schritt 0 zykliert der „Demo"-Button durch verschiedene Szenarien (definiert in `DEMO_SCENARIOS`).

**Reifegradmodell** (4 Stufen):
1. **Basis** — Maßnahme aktiv
2. **Teilweise** — aktiv + dokumentiert
3. **Vollständig** — aktiv + dokumentiert + auditiert
4. **Zertifiziert** — aktiv + dokumentiert + auditiert + zertifiziert (z.B. ISO 27001)

### Phase 2: IKT-Risikolandschaft (RiskLandscape)

- Übersicht der 6 CIAGTR-Kategorien mit Risikozählung
- Expandierbare Risikokarten mit:
  - Bedrohungsakteur & Angriffspfad
  - Evidenz & Herleitung (quantitative Begründung)
  - Likelihood/Impact Score-Bars
  - Quellen-Referenzen

### Phase 3: Risikomatrix (RiskMatrix)

- Zusammenfassung: Kritisch/Hoch/Mittel/Niedrig
- Interaktive 5×5-Heatmap (Likelihood × Impact)
- Sortierte Risikotabelle mit Score und Priorität

### Phase 4: DORA-Mapping (DORAMapping)

- Compliance-Gauge (Prozentsatz konform)
- Statistik: pass/partial/fail pro Anforderung
- Expandierbare Anforderungskarten mit Evidenz, Lücken, Maßnahmen, SMARTE Kriterien

### Phase 5: Report & Export (ReportView)

Sequentieller 3-Schritt-Workflow:

```
[1] Prüfung starten  →  [2] Empfehlungen umsetzen  →  [3] PDF Final
```

Der jeweils nächste logische Schritt wird in der Export-Leiste optisch hervorgehoben.

---

## 5. Qualitätssicherung (Quality Gates)

### 5.1 Prüfkategorien

Die Quality-Gate-Engine (`doraQualityCheck.ts`) führt **~30 automatisierte Prüfungen** in 5 Kategorien durch:

| Kategorie | Prüfungen | Beispiel |
|---|---|---|
| **A. Konsistenzprüfung** | A1-1 bis A3-1b | Bidirektionale Traceability Risiko↔Anforderung |
| **B. Fachliche Korrektheit** | B1 bis B5 | Plausibilität Risikoscore ↔ Konformitätsstatus |
| **C. Evidenzprüfung** | C1 bis C2 | Evidenzqualität bei kritischen Risiken |
| **D. Redaktionelle Prüfung** | D1 bis D3 | Tippfehler, Formatierung |
| **E. Regulatorische Prüfung** | E1 bis E2 | Kritikalität ↔ Prüfungsumfang |

### 5.2 Schweregrade

| Schweregrad | Bedeutung |
|---|---|
| **critical** | Bericht darf nicht abgegeben werden |
| **major** | Wesentlicher Mangel, bedingte Freigabe |
| **minor** | Geringfügiger Mangel, Empfehlung |

### 5.3 Verdikt

| Verdikt | Bedingung |
|---|---|
| `passed` | 0 kritische Fehler, ≤ 2 Mängel gesamt |
| `conditional` | 0 kritische Fehler, > 2 Mängel |
| `failed` | ≥ 1 kritischer Fehler |

---

## 6. Automatische Korrekturen (Audit Fixes)

Die Fix-Engine (`doraAuditFixes.ts`) implementiert **regelbasierte Korrekturen**. Grundregel: **Es wird kein Inhalt erfunden** — alle Korrekturen leiten sich aus vorhandenen Daten ab.

### 6.1 Implementierte Fix-Regeln

| Check-ID | Korrektur |
|---|---|
| **A2-1** | Fehlende Risiko-Anforderung-Verknüpfungen herstellen (via Keyword-Matching) |
| **A3-1** | Pass-Status → partial/fail herabstufen bei hohem Risikoscore |
| **A3-1b** | Partial → fail bei kritischem Risiko (Score ≥ 20) |
| **B1** | D8-1 (Schutzmaßnahmen) → fail bei unverschlüsselter Kommunikation |
| **B2** | D9-2 (Zugangskontrolle) → fail bei IDOR-Schwachstellen |
| **B3** | D19-1 (Meldepflichten) → fail setzen |
| **B4** | Aufwandsschätzungen ableiten (basierend auf Risikoscore) |
| **B5** | Prioritäten ableiten (P0-P3 basierend auf Status + Score) |
| **C1/C1b** | Hinweis bei unzureichender Evidenzqualität |
| **C2** | Hinweis bei fehlenden Quellen |
| **D3** | Tippfehler-Korrektur (bekannte Typo-Map) |

### 6.2 Iteratives Vorgehen

Nach Anwendung der Fixes wird automatisch ein erneuter Quality-Check durchgeführt. Der Score verbessert sich schrittweise. Die Prüfhistorie wird dokumentiert (Iteration #1, #2, ...).

---

## 7. Visualisierungen

### 7.1 Findings & Fixes Dashboard (DoraFindingsView)

Wird unmittelbar nach der Prüfung angezeigt:
- **Befunde nach Schweregrad** (Pie-Chart: Kritisch/Wesentlich/Geringfügig)
- **Befunde nach Kategorie** (Bar-Chart: Konsistenz/Technik/Evidenz/Redaktion/Regulatorik)
- **Before/After Vergleich** (Score-Vergleich mit Trendanzeige)
- **Detaillierte Finding-Liste** mit Status (offen/behoben)

### 7.2 Vollständiges Audit-Dashboard (DoraAuditCharts)

Einklappbar nach Anwendung der Fixes, 4 Tabs:

| Tab | Inhalt |
|---|---|
| **Übersicht** | KPI-Karten, Compliance-Gauge |
| **Risikoanalyse** | CIAGTR-Radar-Chart, Risiko-Heatmap, Top-Risiko-Balkendiagramm (mit Befundnamen) |
| **Compliance** | DORA-Kapitel-Konformität, Status-Verteilung |
| **Maßnahmenplan** | Gantt-Chart (Wasserfall-Stil, sortierbar nach Priorität/Artikel, 52 Wochen) |

### 7.3 Gantt-Chart Details

- **Sortierung:** Nach Priorität (P0→P3) oder DORA-Artikel
- **Phasen:** P0 (0-4 Wo.), P1 (1-3 Mo.), P2 (3-6 Mo.), P3 (6-12 Mo.)
- **Tooltip bei Hover:** Maßnahme, Aufwand, Priorität, Artikel-Referenz
- **Aufwandsstunden** inline angezeigt

---

## 8. PDF-Berichterstellung

### 8.1 Berichtsstruktur

```
Deckblatt (VERTRAULICH)
Inhaltsverzeichnis

1  Ausgangslage und Zielsetzung
2  Zusammenfassung für die Geschäftsleitung (Management Summary)
   - ROI/Wirtschaftliche Betrachtung
3  Gegenstand der Prüfung
   3.1  Unternehmensprofil
   3.2  IKT-Infrastruktur und Drittanbieter
   3.3  Implementierte Sicherheitsmaßnahmen
   3.4  Bekannte Schwachstellen
   3.5  Eingereichte Dokumentation
4  Feststellungen im Einzelnen
   4.1  IKT-Risikolandschaft
   4.2  DORA-Konformitätslücken
5  Handlungsempfehlungen und Roadmap
   5.1  Priorisierte Maßnahmen (P0-P3)
   5.2  Remediation-Roadmap
   5.3  Wirtschaftliche Betrachtung
6  Methodik und Prüfungsgrundlagen
   6.1  Risikobewertungsmatrix

Anhänge:
A  Strukturierte Prüfdaten (maschinenlesbar)
B  Prüfwerkzeuge und Versionen
C  Evidenz-Material-Index
D  Qualitätssicherung
E  Arbeitspapiere (Working Papers)
```

### 8.2 Aufwandsschätzungen im Bericht

Jede nicht-konforme Anforderung enthält:
- Geschätzter Aufwand (Stunden)
- Annahmen (Ressourcen, externe Unterstützung, Lizenzen, Abhängigkeiten)
- Unsicherheiten
- Validierungsbasis (Benchmark/Erfahrungswert)

### 8.3 Technische Details

- **Bibliothek:** jsPDF (client-seitig, kein Server-Upload)
- **Encoding:** Windows-1252 (mit korrekten Umlauten ä, ö, ü, ß)
- **Seitenumbrüche:** Automatisch mit Überlaufschutz für Grafiken und Tabellen
- **Berichts-ID:** Automatisch generiert (Format: `DORA-YYYY-XXXXX`)

---

## 9. Edge Function: dora-reasoning

**Endpunkt:** `POST /functions/v1/dora-reasoning`

Generiert KI-gestützte Begründungen für Incident-Einstufungen basierend auf DORA Art. 19.

### Request

```json
{
  "answers": { "q1": { "label": "Ja", "value": "yes" }, ... },
  "verdict": "major" | "borderline" | "none",
  "language": "de" | "en" | "fr"
}
```

### Response

```json
{
  "reasoning": "Begründungstext basierend auf DORA Art. 19 Kriterien..."
}
```

### Rate Limiting

- **Per IP:** 10 Anfragen pro Minute
- **Global:** 300 Anfragen pro Tag
- **Modell:** Gemini 3 Flash Preview (via Lovable AI Gateway)

---

## 10. Demo-Szenarien

Das Tool enthält vordefinierte Szenarien in `DEMO_SCENARIOS`, die über den Demo-Button im Intake-Wizard geladen werden. Bei jedem Klick auf Schritt 0 wird das nächste Szenario zyklisch eingeblendet.

---

## 11. Internationalisierung (i18n)

Alle UI-Texte sind über den `LanguageContext` und die Translation-Dateien (`de.ts`, `en.ts`, `fr.ts`) lokalisiert. Die Sprachauswahl erfolgt über das `dora.*`-Namespace mit ~100+ Keys.

**Berichtstexte** verwenden eine separate I18N-Map in `doraReportPdf.ts` für die PDF-Generierung.

---

## 12. Prüfungsgrundsätze (10 Goldene Regeln)

Die Engine erzwingt folgende Grundsätze:

| # | Regel | Automatisiert |
|---|---|---|
| 1 | Dokument vor Abgabe auf Formatfehler prüfen | ✅ (D1, D2) |
| 2 | Risikobewertungen quantitativ herleiten | ✅ (A3-1) |
| 3 | Konsistenz Institutsprofil ↔ Prüfungsumfang | ✅ (E1, E2) |
| 4 | Bidirektionale Traceability | ✅ (A2-1) |
| 5 | Evidenzklassen definieren | ✅ (C1, C1b) |
| 6 | Quality-Gates verbindlich machen | ✅ (Verdikt-System) |
| 7 | Aufwandsschätzungen mit Annahmen | ✅ (B4) |
| 8 | Wirtschaftliche Betrachtung | ✅ (PDF Sec. 5.3) |
| 9 | Zielgruppenadäquate Aufbereitung | ✅ (Summary/Report/Appendix) |
| 10 | KI-gestützte Qualitätssicherung | ✅ (Edge Function) |

---

## 13. Sicherheit & Datenschutz

- **Keine Datenübertragung:** Alle Analysen laufen client-seitig im Browser
- **Kein Backend-Speicher:** Eingabedaten werden nicht persistiert
- **PDF-Generierung:** Erfolgt lokal via jsPDF
- **Datei-Upload:** Nur Metadaten (Name, Größe, Typ) werden erfasst, keine Dateiinhalte
- **Edge Function:** Nur für optionale KI-Begründungen, anonymisiert

---

## 14. Erweiterungspunkte

| Bereich | Mögliche Erweiterung |
|---|---|
| Risikodaten | Eigene Risikokataloge statt Demo-Daten |
| Anforderungen | Erweiterung auf zusätzliche DORA-Artikel |
| Export | DOCX-Export, Excel-Export |
| Persistenz | Speicherung von Prüfungsergebnissen in der Datenbank |
| Multi-Tenant | Mandantenfähigkeit mit Benutzerauthentifizierung |
| API-Integration | Anbindung an GRC-Systeme (ServiceNow, Archer) |
