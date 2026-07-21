
# ERNSTLFALL Feinschliff

Drei Bausteine — Inhaltsqualität, Word-Export, Robustheit/Kosten. Keine Änderungen an Wizard-Flow, Design-Tokens, i18n-Verhalten oder Passwort-Gate.

## 1) Inhaltliche Qualität (Edge Function)

Datei: `supabase/functions/ernstfall-generate/index.ts`

- **System-Prompt schärfen** ohne aufzublähen:
  - Kausalitätsregel: „Jeder Inject referenziert einen konkreten Vorgänger (Ursache→Wirkung); keine parallelen, unverbundenen Handlungsstränge."
  - Ground-Truth-Regel: Timeline ≥ Injects+2, jede erwähnte Person/System muss in `bankProfil` oder Timeline vorkommen (keine Neu-Erfindung im Ablauf).
  - Meldepflichten-Konsistenz: Fristen als absolute Uhrzeit relativ zur Klassifizierungs-Uhrzeit im Timeline (bei DORA T+4h, T+72h, T+1M explizit ausrechnen), nicht generisch „innerhalb 24h".
  - Rückfragen-Regel: Antwort verweist auf Timeline-Fakt oder markiert explizit „nicht bekannt" (verhindert Halluzination durch Übungsleitung).
  - Rollen-Spannungsfeld: Immer als Konflikt zwischen zwei konkreten Zielen (z. B. „schnelle Wiederaufnahme vs. forensische Beweissicherung"), nicht als Charakter-Beschreibung.
  - Anti-Wiederholung: „Diskussionsimpulse und Rückfragen dürfen inhaltlich zwischen Injects nicht doppeln."
  - Diversitäts-Klausel: Einspielkanäle über die Injects streuen (Telefon, E-Mail, Ticket, Mitarbeiter-Meldung, Medienanfrage, Aufsichtsschreiben — nicht 5× dieselbe Quelle).
- **Schema minimal erweitern** (rückwärtskompatibel im UI, docx nutzt es falls vorhanden):
  - `groundTruth.klassifizierungsZeitpunkt` (string) — Ankerpunkt für Fristenrechnung.
  - `injects[].abhaengigVon` (string, optional) — Inject-ID des Vorgängers.
- **Modell-Fallback**: Aktuell nur `gemini-2.5-flash`. Bei 502/Parse-Fehler einen einzigen Retry mit gestrafftem Prompt (kein zweites Modell — Kosten bleiben planbar).

## 2) Word-Export aufwerten

Datei: `src/pages/Ernstfall.tsx`

- **Deckblatt-Block je Dokument**: Klassifizierungsleiste am Kopf + Fußzeile mit „Übungsname · Version · Erzeugt am".
- **Inhaltsverzeichnis** in Trainer Guide und Drehbuch (`TableOfContents`, `headingStyleRange: "1-3"`), Heading-Styles mit `outlineLevel` versehen.
- **Inject-Karten**:
  - Kopf-Streifen mit Zeitpunkt/Phase/PFLICHT als farbige Info-Zeile.
  - `abhaengigVon` als „Anschluss an …" ausweisen.
  - Seitenumbruch nur zwischen Karten, nicht innerhalb (Paragraph `keepNext`/`keepLines` auf Karten-Titel).
- **Ablaufplan** als Zeitachsen-Tabelle mit Zebra-Streifen (bereits vorhanden) + Summenzeile Gesamtdauer.
- **Meldepflichten-Tabelle** um Spalte „Berechnete Uhrzeit" (aus `klassifizierungsZeitpunkt` + Frist) im Trainer Guide.
- **Teilnehmer-Arbeitsbuch**: Keine `groundTruth`, keine Regieanweisungen (aktuell schon so — Prüfung + Kommentar im Code, damit ein späterer Refactor das nicht bricht).
- **Konsistente Typografie**: Bereits gesetzte Marken (DARKBLUE/RED/ALTROW/HEADERGREY) bleiben; keine neuen Farben.
- **QA**: Nach Umbau lokale Erzeugung eines Beispiel-ZIPs (Beispiel-Exercise als Fixture in Tests-freiem Fall via manuellem Klick) — nicht Teil des Codes.

## 3) Robustheit & Kosten

Datei: `src/pages/Ernstfall.tsx` + Function

- **Draft-Autosave**: Wizard-State (Bank, Themen, Parameter) und letztes generiertes `exercise` in `localStorage` (`ernstlfall:draft:v1`), Recovery-Banner in Step 1 „Entwurf fortsetzen / verwerfen".
- **Progress ehrlicher**: Statt fake-linear jetzt echte Phasen — Request gesendet → warte auf KI (unbestimmt, Puls-Balken) → JSON empfangen → Word 1/5…5/5 → ZIP. Terminal-Log bleibt.
- **Cancel-Button** während Generierung: `AbortController` an `fetch` weitergeben, im Log als „Abgebrochen" markieren.
- **Retry-Button** bei Fehler statt Neustart, wenn Konfiguration unverändert.
- **Function-seitig**:
  - `max_tokens` explizit setzen (~4500 für 8 Injects), verhindert unnötig lange Antworten.
  - Bei Parse-Fehler: ein einziger Retry mit `temperature: 0.2` + Hinweis „Nur JSON, kein Prosa-Präfix" — spart User einen kompletten Neustart bei sporadischem Format-Ausrutscher.
  - Antwort-Größe (Bytes) in `ai_usage_logs.meta` mitloggen, damit sich Output-Blähungen früh sehen lassen.

## Nicht enthalten

- Inline-Edit der Injects vor Export (war Option, nicht gewählt).
- Streaming der KI-Antwort (aufwendig für JSON-Modus, geringer Nutzen).
- Neue Modelle / Anbieter.

## Aufwand

- Function: ~1 Datei, ~40 Zeilen Delta.
- Frontend: `Ernstfall.tsx`, ~120 Zeilen Delta über Autosave, Cancel, docx-Erweiterungen.
- Kein DB-Migrationsbedarf.
