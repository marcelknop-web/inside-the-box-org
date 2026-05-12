## Ziel

Ein neues Compliance-Tool **„EU AI Act Readiness Assessment"** unter `/ai-act-readiness` (über `ChatView`-Catchall, mit `PasswordGate` wie die anderen Tools), das die jeweils besten Bausteine der bestehenden Tools kombiniert:

- **Aus NIS-2:** Phasenmodell (Intake → Risikolandschaft → Anforderungen → Report) + Quality-Gates + Auto-Fixes + PDF-Engine
- **Aus CRA:** Produkt-/System-spezifische Klassifizierung (hier: AI-System-Klassifizierung statt Produktkategorien)
- **Aus IEC 62443/UR27:** Strukturierte Risikobewertung mit Reifegradmodell und Audit-Charts (Radar/Heatmap/Gantt)
- **Aus DORA:** KI-gestützte Reasoning-Edge-Function für Klassifizierungs-Begründungen

## Regulatorische Basis

EU-Verordnung 2024/1689 (AI Act). Abgedeckte Kernbereiche:

1. **Risikoklassifizierung** — Verbotene Praktiken (Art. 5), Hochrisiko-Systeme (Art. 6 + Anhang III), GPAI (Art. 51 ff.), begrenztes/minimales Risiko
2. **Anforderungen für Hochrisiko-Systeme** — Risikomanagement (Art. 9), Daten-Governance (Art. 10), Technische Dokumentation (Art. 11), Aufzeichnungen (Art. 12), Transparenz (Art. 13), Menschliche Aufsicht (Art. 14), Genauigkeit/Robustheit/Cybersicherheit (Art. 15)
3. **Pflichten der Anbieter** (Art. 16) und **Betreiber** (Art. 26)
4. **GPAI-Modelle** — Art. 53 (alle GPAI) + Art. 55 (systemisches Risiko)
5. **Transparenzpflichten** (Art. 50) — KI-Interaktion, Deepfakes, synthetische Inhalte
6. **Konformitätsbewertung & CE-Kennzeichnung** (Art. 43, 48)

## Datei-Struktur

```text
src/
  pages/
    AiActReadinessTool.tsx          (~1000 Zeilen, Vorbild Nis2ComplianceTool)
  components/
    AiActAuditCharts.tsx            (~230 Zeilen, Vorbild Nis2AuditCharts)
  data/
    aiActData.ts                    (~600 Zeilen — Risiken, Anforderungen, Demo-Szenarien)
    aiActDataI18n.ts                (~200 Zeilen)
  utils/
    aiActQualityCheck.ts            (~320 Zeilen)
    aiActAuditFixes.ts              (~160 Zeilen)
    aiActReportPdf.ts               (~1100 Zeilen, basierend auf nis2ReportPdf)
supabase/functions/
  ai-act-reasoning/index.ts         (Edge Function, Vorbild dora-reasoning)
```

Plus Erweiterungen in:
- `src/i18n/{de,en,fr}.ts` — `aiAct.*`-Namespace (~80 Keys)
- `src/pages/ChatView.tsx` — Lazy-Import + Service-Definition + `explicitRoutes`-Eintrag + Navigations-Eintrag

## Phasenmodell (analog NIS-2)

1. **Intake-Wizard (8 Schritte)**
   - Organisation & Rolle (Anbieter / Betreiber / Importeur / Händler)
   - AI-System-Beschreibung (Name, Zweck, Domäne)
   - Risikoklasse-Indikatoren (Anhang-III-Bereiche, Echtzeit-Biometrie, etc.)
   - GPAI-Klassifizierung (Foundation Model? FLOPS-Schwelle? Systemisches Risiko?)
   - Daten & Trainingsbasis (Quellen, Bias-Tests, DSGVO-Konformität)
   - Implementierte Maßnahmen (Reifegradmodell: aktiv / dokumentiert / auditiert / zertifiziert) — z. B. Risikomanagementsystem, Logging, Human Oversight, Robustheitstests
   - Bekannte Lücken & Dokumenten-Upload (nur Metadaten)
   - Zusammenfassung & Demo-Szenarien (Cycling-Button)

2. **Risikoklassifizierung** — Automatische Einstufung in *verboten / hochrisiko / GPAI / begrenzt / minimal* basierend auf Intake. Mit Begründung (optional via Edge Function).

3. **AI-Risikolandschaft** — Strukturiertes Risiko-Modell:
   - Kategorien: **B**ias/Fairness, **R**obustness, **T**ransparency, **P**rivacy, **S**ecurity, **G**overnance/Oversight, **E**nvironmental
   - Pro Risiko: likelihood × impact (5×5), Evidenz, Quellen, AI-Act-Artikelreferenz
   - Heatmap + Radar

4. **Anforderungs-Mapping** — Pass/Partial/Fail je AI-Act-Artikel, mit Lücke, Maßnahme, SMARTen Kriterien, Aufwand, Priorität (P0–P3)

5. **Report & Export** — Quality-Check → Auto-Fixes → PDF („AI-ACT-YYYY-XXXXX")

## Quality-Gates (analog DORA/NIS-2)

- **A. Konsistenz** — Bidirektionale Traceability Risiko ↔ AI-Act-Artikel
- **B. Fachlich** — Plausibilität: Hochrisiko-System ohne Risikomanagement (Art. 9) → fail erzwingen; GPAI mit FLOPS ≥ 10²⁵ → systemisches Risiko erzwingen
- **C. Evidenz** — Evidenzqualität bei kritischen Risiken
- **D. Redaktion** — Tippfehler, Formatierung
- **E. Regulatorik** — Verbotene Praktiken (Art. 5) → automatisch `failed`-Verdikt

## Charts (analog NIS-2)

- KPI-Karten + Compliance-Gauge
- Radar (B/R/T/P/S/G/E-Kategorien)
- 5×5-Heatmap der AI-Risiken
- Top-5-Risiken Bar-Chart
- AI-Act-Kapitel-Konformität (Art. 9–15, 16, 26, 50, 53, 55)
- Gantt-Roadmap nach Priorität (P0 0–4 Wo., P1 1–3 Mo., P2 3–6 Mo., P3 6–12 Mo.)

## PDF-Bericht (Vorbild nis2ReportPdf)

Struktur: Deckblatt → TOC → 1 Ausgangslage → 2 Management Summary (mit Risikoklasse + ROI) → 3 Prüfungsgegenstand (3.1 Organisation, 3.2 AI-System, 3.3 Maßnahmen, 3.4 bekannte Schwachstellen, 3.5 Dokumentation) → 4 Feststellungen (4.1 Risikolandschaft, 4.2 Konformitätslücken) → 5 Roadmap → 6 Methodik → Anhänge A–E (strukturierte Daten, Werkzeuge, Evidenz, QA, Arbeitspapiere). Windows-1252-Encoding, jsPDF, client-seitig.

## Edge Function `ai-act-reasoning`

Eingabe: Intake-Daten + Klassifizierungs-Verdict (`prohibited` / `highRisk` / `gpaiSystemic` / `gpai` / `limited` / `minimal`) + Sprache. Ausgabe: Begründungstext basierend auf AI-Act-Artikel-Kriterien. Modell: `google/gemini-3-flash-preview` via Lovable AI Gateway. Rate-Limiting (10/min/IP, 300/Tag) wie `dora-reasoning`.

## i18n

Vollständig DE/EN/FR via `aiAct.*`-Namespace. Tonalität konsistent mit Memory-Regeln (impersonal DE, terse, professional, IBM Plex Mono für Daten, DM Sans für Narrativ).

## Integration in ChatView

- Lazy-Import `AiActReadinessTool`
- Service-Definition `'ai-act-readiness'` (Icon `Brain` oder `Cpu`)
- `explicitRoutes` ergänzen → URL `/ai-act-readiness` funktioniert direkt
- Navigations-Eintrag in „Compliance"-Cluster mit `isNew: true`
- `PasswordGate` analog zu `cra-check` / `nis2-compliance`

## Out of Scope

- Keine Persistenz in Supabase (analog zu allen anderen Compliance-Tools — alles client-seitig)
- Keine Anbindung an externe AI-Register/Notified Bodies
- Keine Übersetzung des PDF-Reports (Bericht bleibt deutsch wie bei NIS-2)
- Keine eigene Auth (PasswordGate genügt)

## Technische Risiken

- **Datenmodellierung AI Act ist umfangreich** — Wir beschränken uns auf Hochrisiko-Anforderungen Art. 9–15 + 16/26/50/53/55. Erweiterung später möglich.
- **Klassifizierungs-Logik (verboten vs. Hochrisiko)** kann komplex werden — wir nutzen klare Indikator-Checkboxes im Intake statt Freitext-Heuristik.
- **Bundle-Größe** — Lazy-Loading + Code-Splitting wie bei den anderen Tools.

## Geschätzter Umfang

~3500 Zeilen neuer Code + Edge Function + i18n. Implementierung in einem Rutsch möglich, da die Vorlagen 1:1 adaptiert werden.
