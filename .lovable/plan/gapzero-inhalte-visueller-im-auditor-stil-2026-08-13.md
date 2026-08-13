# GapZero: Inhalte visueller — im Auditor-Stil

Ziel: Ergebnisse werden als Datenvisualisierung gelesen, nicht als Textwand. Keine Deko, keine Icon-Spielereien — nur präzise, ruhige Grafik im Prüfberichts-Duktus (Haarlinien, Graustufen + ein Akzent, Monospace-Zahlen).

## 1. PDF-Report (Executive Brief + Full Report)

Bestehende Visual-Bausteine bleiben, werden aber konsequent überall eingesetzt, wo heute Prosa/Listen stehen:

- **Kapitel-Kopfzeile mit Kennzahlleiste**: Jedes Hauptkapitel bekommt eine schmale Kopfzeile (Kapitelnummer, Titel, 2–3 relevante Zahlen). Ersetzt einleitende Textblöcke.
- **Readiness-Panel (Kap. 1)**: Statt reiner KPI-Kacheln ein kombiniertes Panel — Score-Gauge (Halbbogen), Pass/Partial/Gap-Balken, Trend-freie Verteilung je Kategorie als horizontale Stapelbalken.
- **Findings (Kap. 4)**: Kategorie-Übersicht als kompakte „small multiples" (je Kategorie ein Mini-Balken mit Pass/Partial/Gap) vor der Detailtabelle. Verdikte in der Tabelle als Statusglyphe + Text (nicht nur Farbe).
- **Root Causes (Kap. 5)**: Cluster-Diagramm — je Root Cause eine Zeile mit Anzahl betroffener Anforderungen als proportionaler Balken und den Requirement-IDs als Chips.
- **Risiken (Kap. 6)**: bestehende Heatmap prominenter (halbe Seite), darunter Top-Risiken als Rangliste mit Score-Balken statt Textliste.
- **Maßnahmen (Kap. 7)**: bestehende Roadmap-Lanes um eine Aufwands-/Prioritäts-Matrix ergänzen (Effort × Impact, Punkte mit Action-IDs).
- **Evidence (Part B)**: Evidence-Grading als Verteilungsbalken (verified / documented / self-declared) plus Coverage-Balken je Kategorie.
- **Scope (Kap. 2)**: Applicability als Entscheidungspfad-Grafik (Vessel/CBS-Level → Verdikt) anstelle der Feldliste; Claims/Limitations bleiben Text.
- Durchgängige Legenden und ASCII-sichere Glyphen; alle neuen Blöcke nutzen die vorhandenen umbruch-/seitensicheren Primitiven, damit nichts abgeschnitten wird.

## 2. Web-UI (/gapzero, Assessment + Ergebnisscreen)

- **Ergebnis-Kopf**: Readiness als ruhiger Gauge + Pass/Partial/Gap-Segmentleiste, Zahlen in Monospace, Kategorie-Chips mit Mini-Balken.
- **Findings-Liste**: pro Kategorie ein aufklappbarer Block mit Fortschrittsbalken; Verdikt als Glyphe + Label; Filter (alle / nur Gaps / nur Partial).
- **Risiken**: Heatmap-Raster (Likelihood × Impact) als kompakte Web-Variante, klickbar → scrollt zum Risiko.
- **Root Causes**: Karten mit betroffenen Requirement-Chips statt Absätzen.
- **Roadmap**: Zeitleiste (0–3 / 3–6 / 6–12 Monate) als Lane-Grafik, konsistent zum PDF.
- **Intake**: unverändert in der Logik; nur visuelle Fortschrittsanzeige je Sektion (erledigt/offen) ergänzen.

## 3. Konsistenz & Guardrails

- Alle Grafiken lesen ausschließlich `computed`/Engine-Werte — keine neuen Berechnungen, keine abweichenden Zahlen zwischen UI, PDF und JSON.
- Farben ausschließlich über bestehende semantische Tokens; Status nie nur über Farbe (immer Glyphe/Label).
- Report-Struktur (10 Kapitel) und Wortlaut der Aussagen bleiben; es ändert sich die Darstellungsform.

## Technische Umsetzung

- `src/utils/pdfCore.ts`: neue Primitiven `chapterHeaderBar`, `gaugeScore`, `smallMultiples`, `rootCauseBars`, `effortImpactMatrix`, `distributionBar`, `decisionPath` — alle mit `checkSpace`/`wrap` wie die bestehenden.
- `src/utils/metaAssessmentReportPdf.ts`: Kapitel 1, 2, 4–7 und Part B auf die neuen Bausteine umstellen (Textblöcke, die Zahlen wiederholen, entfallen).
- `src/pages/MetaAssessmentTool.tsx`: Ergebnisbereich in kleine Präsentationskomponenten auslagern (`src/components/metaAssessment/ReadinessPanel.tsx`, `FindingsByCategory.tsx`, `RiskHeatmapWeb.tsx`, `RootCauseCards.tsx`, `RoadmapLanes.tsx`) — reine Darstellung, Props aus `computed`.
- QA: Test-PDF rendern, alle Seiten als Bilder prüfen (kein Clipping/Überlappung); Web-Ansicht auf Mobile und Desktop prüfen.
