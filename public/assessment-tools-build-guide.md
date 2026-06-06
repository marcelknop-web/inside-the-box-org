# Build-Anleitung & Claude-Code-Prompt: Compliance-/Assessment-Tools

Diese Anleitung destilliert das „Best of" der bestehenden Assessment-Tools
(NIS-2, DORA, IEC 62443, IACS UR E26/E27, EU AI Act, TISAX, PCI-DSS) in ein
wiederverwendbares Baumuster. Du kannst sie direkt als Kontext an Claude Code
geben — oder den fertigen Prompt am Ende kopieren.

---

## 1. Das gemeinsame Erfolgsmuster (Architektur-Blueprint)

Jedes Tool folgt demselben 5-Phasen-Workflow als **Single-Page-State-Machine**
(ein `step`-State, kein Router-Wechsel zwischen Phasen):

```
INTAKE  →  ASSESSMENT  →  AI-REASONING  →  QUALITY-CHECK  →  PDF-REPORT
(Scope)    (Controls)     (Edge Function)   (clientseitig)    (jsPDF)
```

### Phase 1 — Intake (Scope-Erfassung)
- Mehrere Sub-Steps mit Fortschrittsbalken (`SubStepHeader` mit
  Segment-Bar + `n/total` in `font-mono`).
- Auswahl über `Chip`-Buttons (selektierbar, Icon + Label + Desc).
- Erfasst: Entitätstyp/Sektor, Kritikalität, Infrastruktur, Lieferkette, Rollen.
- **Test-Cases / Demo-Szenarien**: vordefinierte `DEMO_SCENARIOS`, die das
  Intake mit einem Klick befüllen (z. B. „Kreuzfahrtschiffe" für E26). Macht
  das Tool sofort demonstrierbar.

### Phase 2 — Assessment (Controls beantworten)
- Fragen/Controls kommen aus einem **zentralen Daten-File** (`src/data/*.ts`),
  nicht hartkodiert in der Page.
- Pro Control: Status `pass | partial | fail` + optionale Evidenz-Notiz +
  optionaler Datei-Upload (Dokumenten-Extraktion).
- **Scoring-Methodik 100/50/0**: `pass`=100 %, `partial`=50 %, `fail`=0 %,
  gewichtet pro Kategorie → Gesamt-Reifegrad.
- Risiken über Likelihood × Impact (1–5) → Score → Stufe
  (low/medium/high/critical) mit Farbcodierung.

### Phase 3 — AI-Reasoning (Edge Function)
- Eine **Supabase Edge Function** ruft das **Lovable AI Gateway** an:
  `https://ai.gateway.lovable.dev/v1/chat/completions`, Modell
  `google/gemini-3-flash-preview`, Header `Authorization: Bearer ${LOVABLE_API_KEY}`.
- **Datenintegritäts-Policy (kritisch)**: Die KI darf **niemals Findings,
  Zahlen oder Belege erfinden**. Sie formuliert nur das aus, was die
  regelbasierte Logik bereits entschieden hat („begründe, warum X als Y
  eingestuft wird"). Das Urteil (`verdict`) wird clientseitig/regelbasiert
  berechnet, die KI liefert nur die Prosa.
- Anonym, kein User-Tracking, EU-gehostet.

### Phase 4 — Quality-Check (clientseitig)
- `runXQualityCheck()` prüft das Audit auf Lücken/Inkonsistenzen **bevor** der
  Report erzeugt wird (z. B. fehlende Evidenz bei `pass`, Widersprüche,
  Traceability-Lücken). Ergebnis im `QualityCheckPanel`.
- Charts (`*AuditCharts.tsx`) visualisieren Score-Verteilung pro Kategorie.

### Phase 5 — PDF-Report (jsPDF, clientseitig)
- Erzeugt komplett im Browser (`jsPDF`), **kein Upload, keine Persistenz**.
- Shared Engine `pdfCore.ts`: A4, feste/explizite Positionierung (keine
  Auto-Flow-Überraschungen), Seitenumbruch-Logik, Kopf-/Fußzeile, Wasserzeichen.
- **Prosa-Helfer**: `humanizeList()`, `humanizeEvidence()`, `safeLowerFirst()`
  verwandeln stichpunktartige Eingaben in flüssige, audit-taugliche Sätze.
- Report-Struktur ~9 Kapitel: Deckblatt → Management Summary → Methodik →
  Scope → Findings pro Kategorie → Risiken → Maßnahmen (SMART) → Anhänge
  (Traceability) → Disclaimer.
- **PDF-Constraints**: Windows-1252-kompatible Zeichen, Font-Resets vor jedem
  Block, explizite Y-Positionsverwaltung.

---

## 2. Tech-Stack & Konventionen (nicht verhandelbar)

- **React 18 + Vite 5 + TypeScript 5 + Tailwind v3**, shadcn/ui-Komponenten.
- **Backend = Supabase** (Edge Functions für KI). Kein Python. KI nur über
  Lovable AI Gateway, kein direkter OpenAI/Anthropic-Call.
- **i18n DE/EN/FR**: `LanguageContext` + `t()`-Keys. Daten-Files sind
  i18n-aware (Funktionen nehmen `t` entgegen, statt feste Strings). Findings
  werden über `localizeFindings.ts` lokalisiert. DE-Ton: **unpersönlich/sachlich**.
- **Design-Tokens, keine Direktfarben**: semantische HSL-Tokens aus `index.css`
  / `tailwind.config.ts` (`bg-background/40`-Panels, `border-primary/15`).
  Gold `#f5b800` primary, Cyan `#00bcd4` highlight, Dark Theme.
- **Typografie**: DM Sans (UI/Narrativ), IBM Plex Mono (Zahlen, Header, Stats).
- **Shared Components**: `SiteChrome` (Layout-Hülle), `PageMeta` (SEO/Helmet),
  `PasswordGate` (`storageKey` + `label`) für geschützte Tools.
- **State**: lokal mit `useState`/`useMemo`/`useCallback`, `memo` für teure
  Sub-Komponenten. Kein globaler Store nötig.
- **Edge-Function-Härtung**: In-Memory-Rate-Limiting (pro IP + Tageslimit),
  strikte Input-Validierung (Typ, Längen, max. Anzahl Antworten), CORS-Header,
  saubere Status-Codes (402/429/503), JSON-Parsing mit Markdown-Fence-Cleanup.

---

## 3. Datei-Bauplan pro neuem Tool

```
src/pages/<Tool>ComplianceTool.tsx     # Page = State-Machine (5 Phasen)
src/data/<tool>Data.ts                 # Controls, Kategorien, Demo-Szenarien, Typen
src/data/<tool>DataI18n.ts             # EN/FR Findings-Übersetzungen
src/components/<Tool>AuditCharts.tsx   # Score-Visualisierung
src/utils/<tool>QualityCheck.ts        # Pre-Report-Validierung
src/utils/<tool>ReportPdf.ts           # Report-Aufbau (nutzt pdfCore.ts)
supabase/functions/<tool>-reasoning/index.ts  # KI-Begründung
# + Route in src/App.tsx (lazy), Eintrag in AssessmentTools.tsx
```

---

## 4. Fertiger Prompt für Claude Code

> Kopiere alles unterhalb der Linie in Claude Code. Ersetze `<STANDARD>` und
> die fachlichen Details durch deinen konkreten Standard.

---

Du baust ein neues Compliance-/Assessment-Tool für `<STANDARD>` in einer
bestehenden React-18 + Vite + TypeScript + Tailwind-v3 + shadcn/ui-App mit
Supabase-Backend. Halte dich exakt an das folgende, bewährte Baumuster.

**Architektur — eine Single-Page-State-Machine mit 5 Phasen** (ein `step`-State,
kein Routenwechsel): INTAKE → ASSESSMENT → AI-REASONING → QUALITY-CHECK →
PDF-REPORT.

1. **Intake**: Sub-Steps mit Segment-Fortschrittsbalken (`n/total`,
   monospace). Auswahl über selektierbare Chip-Buttons (Icon + Label + Desc).
   Erfasse Sektor/Entitätstyp, Kritikalität, Infrastruktur, Lieferkette, Rollen.
   Biete 3–5 vordefinierte Demo-Szenarien, die das Intake per Klick befüllen.

2. **Assessment**: Lade Controls aus einem zentralen, i18n-fähigen Daten-File
   (`src/data/<tool>Data.ts` — Funktionen nehmen `t` entgegen, keine fixen
   Strings). Pro Control: Status `pass|partial|fail` + Evidenz-Notiz + optionaler
   Datei-Upload. Scoring 100/50/0, gewichtet pro Kategorie zu einem Reifegrad.
   Risiken als Likelihood×Impact (1–5) mit farbcodierten Stufen.

3. **AI-Reasoning**: Erstelle eine Supabase Edge Function
   `supabase/functions/<tool>-reasoning/index.ts`, die das Lovable AI Gateway
   (`https://ai.gateway.lovable.dev/v1/chat/completions`, Modell
   `google/gemini-3-flash-preview`, `Authorization: Bearer ${LOVABLE_API_KEY}`)
   aufruft. KRITISCH: Die KI darf KEINE Findings, Zahlen oder Belege erfinden —
   das Urteil wird regelbasiert clientseitig berechnet, die KI formuliert nur
   die Begründung aus. Füge In-Memory-Rate-Limiting (pro IP + Tageslimit),
   strikte Input-Validierung (Typen, Längen, max. Anzahl), CORS-Header und
   saubere Fehler-Status (402/429/503) hinzu. Bereinige Markdown-Code-Fences
   vor `JSON.parse`.

4. **Quality-Check**: `src/utils/<tool>QualityCheck.ts` prüft VOR der
   Report-Erzeugung auf Lücken/Widersprüche (z. B. `pass` ohne Evidenz,
   Traceability-Lücken). Zeige Ergebnis im `QualityCheckPanel`. Visualisiere
   Scores in `src/components/<Tool>AuditCharts.tsx`.

5. **PDF-Report**: `src/utils/<tool>ReportPdf.ts` erzeugt den Report
   vollständig clientseitig mit jsPDF (kein Upload, keine Persistenz). Nutze die
   bestehende `src/utils/pdfCore.ts`-Engine (A4, explizite Positionierung,
   Seitenumbrüche, Prosa-Helfer `humanizeList`/`humanizeEvidence`/`safeLowerFirst`,
   Windows-1252-kompatible Zeichen, Font-Resets). Struktur: Deckblatt →
   Management Summary → Methodik → Scope → Findings je Kategorie → Risiken →
   SMART-Maßnahmen → Anhänge (Traceability) → Disclaimer.

**Konventionen**:
- i18n DE/EN/FR über `LanguageContext` + `t()`; DE-Ton unpersönlich/sachlich;
  Findings über `localizeFindings.ts` lokalisieren.
- Nur semantische HSL-Design-Tokens (keine Direktfarben). Dark Theme, Gold
  primary, Cyan highlight. DM Sans für UI, IBM Plex Mono für Zahlen/Header.
- Verwende `SiteChrome`, `PageMeta`; für geschützte Tools `PasswordGate`
  (`storageKey`, `label`).
- State lokal mit `useState/useMemo/useCallback`, `memo` für teure Komponenten.
- Registriere die Route lazy in `src/App.tsx` und ergänze einen Eintrag in
  `src/pages/AssessmentTools.tsx`.

Liefere alle Dateien gemäß diesem Bauplan und halte jede Phase modular getrennt.

---

## 4b. Feinheiten, die die Tools stark machen (optional, aber empfohlen)

- **QA → Auto-Fix → Re-QA-Schleife**: Nach dem ersten Quality-Check werden bei
  Demo-/regelbasierten Läufen deterministische Auto-Fixes angewandt
  (`auditFixes.ts`), danach ein zweiter Check. Dokumenten-/KI-basierte Läufe
  werden **nie** auto-gefixt (Datenintegrität). Fixes sind regelbasiert
  (z. B. Effort/Priorität aus Threat-Score ableiten), nie erfunden.
- **Draft-Persistenz**: Auto-Save in `localStorage` bei jeder Änderung +
  optionales Cloud-Save über Edge Function, das einen 6-stelligen Restore-Code
  zurückgibt.
- **Scoring-Modell bewusst wählen**: *Conformance* (NIS-2: `pass`=konform) vs.
  *Applicability* (E26: `pass`=nicht anwendbar) — gleiches `pass/partial/fail`-
  Enum, andere Labels. Beim Bau festlegen, welches Modell gilt.
- **Sektor-Varianten in Demo-Daten**: Schlüssel-Risiken können sektorspezifische
  Varianten haben (Energie/Gesundheit/Transport …), der Rest bleibt generisch.
- **PDF-Font-Stack**: IBM Plex Serif (Body), Instrument Sans (Headings),
  IBM Plex Mono (Daten/IDs) — async geladen, gecached, mit Times/Helvetica/
  Courier-Fallback. `PdfDoc`-Klasse mit `y`-Cursor + automatischem
  `checkSpace`/`newPage` + Orphan-/Widow-Schutz.
- **Animations-Politur**: `Typewriter` auf Headings, `StaggerReveal` um jede
  Phase (kein erzwungenes Auto-Scrolling außer in Chat/Simulator).
- **PasswordGate**: SHA-256-Hash im Source (kein Klartext-Passwort),
  `sessionStorage`-Key pro Tool, einmalige Freischaltung pro Session.
- **PageMeta**: setzt `html lang`, Titel/Description, Canonical und `hreflang`
  für DE/EN/FR auf derselben URL + OG/Twitter-Tags.

## 5. Checkliste vor „fertig"

- [ ] Daten-File ist i18n-fähig (kein hartkodierter Sprach-String).
- [ ] Demo-Szenarien befüllen das Intake vollständig.
- [ ] Scoring 100/50/0 + gewichtete Kategorie-Reife korrekt.
- [ ] Edge Function: Rate-Limit + Validierung + KI erfindet nichts.
- [ ] Quality-Check läuft vor PDF und blockt bei harten Fehlern.
- [ ] PDF rein clientseitig, keine Persistenz, Windows-1252-sicher.
- [ ] Nur Design-Tokens, drei Sprachen, SiteChrome/PageMeta vorhanden.
