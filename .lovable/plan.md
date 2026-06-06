# Universal Assessment — 3-Layer-Architektur (revisionssicher + KI-Insights)

## Ziel

Die KI trifft **keine** Compliance-Entscheidungen mehr. Findings/Scores/Risiken/Empfehlungen entstehen deterministisch aus den Intake-Antworten (revisionssicher, reproduzierbar). Die KI wird dort eingesetzt, wo sie stark ist: **Muster erkennen, Zusammenhänge erklären, Management-Narrativ formulieren**.

```text
Layer 1  Deterministic Assessment Engine   (Source of Truth)
            User Answers -> Rules -> Findings -> Risks -> Recommendations -> Score
Layer 2  AI Insight Engine                 (Analyse, erklärend)
            Root Cause · Cross-Control · Gap-Cluster · Virtual-Auditor-Fragen
Layer 3  AI Reporting Engine               (Narrativ)
            Executive Risk Narrative · Roadmap-Begründung
```

Bei identischen Antworten -> identische Bewertung. KI-Text ist additiv und als „erklärend, nicht bewertend" gekennzeichnet (Data-Integrity-Policy bleibt).

## Layer 1 — Compliance wird deterministisch

Heute entscheidet die Edge Function `meta-assessment-reasoning` den Status (pass/partial/fail). Das wird ersetzt durch regelbasierte Auswertung im bestehenden `engine.ts`.

- **Neues Feld an `ProfileRequirement`: `rule`** — eine deterministische Regel gegen Intake-Antworten, z. B.:
  - `requiresAll` / `requiresAny`: Liste von Intake-Optionen (z. B. `measures:mfa`), die pass/partial bestimmen.
  - Ergebnis-Logik: alle erfüllt -> `pass`, teils erfüllt -> `partial`, keine -> `fail`.
- **Neue Funktion `deriveFindings(profile, answers, lang)`** in `engine.ts`: erzeugt `AssessedRequirement[]` rein aus Antworten (evidence/gap als faktische Kurztexte aus den getroffenen Antworten, keine erfundenen Nachweise).
- **Risiken** werden aus den `fail`/`partial`-Findings deterministisch abgeleitet (Mapping Requirement -> Risiko mit fixem likelihood/impact-Default pro Kategorie), statt von der KI.
- Scoring/Quality/Maturity/Recommendations/Roadmap bleiben wie gebaut (laufen jetzt auf den deterministischen Findings).

NIS2-Pilot bekommt die `rule`-Mappings (12 Anforderungen gegen die Intake-Felder `measures`, `roles`, `supplyChain`, `classification`).

## Layer 2 + 3 — Neue Edge Function `assessment-insights`

Eine Function, die **nur** die fertig berechneten deterministischen Ergebnisse erhält (Findings, Risiken, Score, Kategorien) und erklärenden Text zurückgibt. Sie sieht die Rohantworten nur als Kontext, ändert aber keine Bewertung.

Output (JSON, dreisprachig je nach `language`):
1. **executiveNarrative** — 4–6 Sätze Management-Lagebild (Layer 3).
2. **rootCauses** — pro Schwerpunkt: Symptom -> vermutete Grundursache.
3. **gapClusters** — Findings zu 2–4 Kernthemen gruppiert („nicht 20 Probleme, sondern 3").
4. **crossControlInsights** — erkannte Zusammenhänge zwischen Defiziten.
5. **roadmapRationale** — Begründung der (deterministisch sortierten) Phasen 0–3/3–6/6–12.
6. **auditorQuestions** — 4–6 vertiefende Audit-Rückfragen („Virtual Auditor").

Guardrails: strikt erklärend, keine Statusänderung, keine erfundenen Fakten; Rate-Limiting/Validierung wie in der bestehenden Function; Modell `google/gemini-3-flash-preview`.

(Benchmark-Analyse = Punkt 4 des Reviews -> später, sobald anonymisierte Vergleichsdaten existieren. Nicht in diesem Schritt.)

## Workflow in `MetaAssessmentTool.tsx`

```text
Standard -> Intake -> [Layer 1 sofort, lokal] -> Dashboard/Report
                                   -> "KI-Insights laden" (Layer 2/3, optional)
```

- Findings/Score/Risiken/Empfehlungen erscheinen **sofort** (kein KI-Call nötig, deterministisch).
- Darüber ein Abschnitt **„KI-Analyse (erklärend)"** mit Executive Narrative, Gap-Clustern, Root Causes, Cross-Control, Roadmap-Begründung, Auditor-Fragen — nachgeladen per Button, klar als KI-generiert/erklärend markiert.
- Demo-Mechanismus (pro Schritt) bleibt unverändert.

## Migrationsschritte / Risiken

1. `types.ts`: `rule` an `ProfileRequirement`; Insight-Typen ergänzen.
2. `engine.ts`: `deriveFindings` + deterministische Risiko-Ableitung.
3. `nis2Profile.ts`: `rule`-Mappings für alle 12 Anforderungen.
4. Neue Function `assessment-insights` (Layer 2/3); alte `meta-assessment-reasoning` bleibt vorerst bestehen, wird aber nicht mehr für Statusentscheidungen genutzt (später entfernbar).
5. `MetaAssessmentTool.tsx`: lokale Berechnung + Insights-Sektion.

Risiko: `rule`-Mappings müssen fachlich sauber sein (bestimmen jetzt die Bewertung). Bestehende Einzeltools bleiben unberührt.

## Was bewusst NICHT passiert
- Keine `User Answer -> AI decides -> Compliance Result`-Kette mehr.
- Keine DB-/Schema-Änderung, keine Persistenz (Client-side bleibt).
- Kein Eingriff in NIS2/DORA/E26-Einzeltools.
