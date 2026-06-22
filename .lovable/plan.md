# IACS UR E26 — Berichtskritik umsetzen

Ziel: Die vier bestätigten Schwachpunkte der Berichtskritik beheben, ohne die belastbare Datenbasis (Data-Integrity-Policy: keine erfundenen Findings) anzutasten. Nur Auswertungs-, Kalibrierungs- und Darstellungslogik wird geändert.

## 1. KPI klären — „Coverage Rate" → Conformance Score + Aufschlüsselung (Punkt 6)

Heute: Die Kennzahl heißt „Coverage Rate" und die Methodik-Erklärung behauptet „nicht anwendbar = 100 %, anwendbar = 0 %". Das liest sich wie „nur 7 % von E26 erfüllt".

- KPI umbenennen in **Conformance Score** (DE „Konformitätsgrad", FR „Taux de conformité").
- Rechenweg unverändert lassen, aber **korrekt und konventionell beschreiben**: Pass = 100, Partial = 50, Fail = 0, gemittelt über alle Anforderungen.
- **Zusätzlich** (gemäß „Beides anzeigen") eine klare Aufschlüsselung als eigene Kennzahl/Zeile: „X erfüllt · Y teilweise · Z nicht erfüllt (von N)".
- Die irreführende invertierte Methodik-Erklärung (Abschnitt 2) wird durch den korrekten Conformance-Wortlaut ersetzt — in DE/EN/FR.

## 2. Compliance und Risiko strikt trennen (Punkt 3)

Heute werden Anforderungs-Konformität und Risikobewertung im selben Befund vermischt.

- Pro Befund klar zwei getrennte Aussagen ausweisen:
  - **Anforderungs-Konformität**: erfüllt / teilweise erfüllt / nicht erfüllt (Labels von der heutigen „anwendbar/nicht anwendbar"-Umdeutung zurück auf klare Konformitätsbegriffe).
  - **Risiko-Rating**: Likelihood × Impact (5×5), separat beschriftet.
- Management Summary erhält zwei getrennte Blöcke: „Konformität" (Conformance Score + Aufschlüsselung) und „Risikolage" (Kritisch/Hoch/Mittel/Gering).
- Threat-Landscape und Requirement-Übersicht bleiben getrennte Abschnitte, aber Überschriften/Einleitungen machen die Trennung explizit.

## 3. Maritime Risiko-Kalibrierung (Punkt 2)

Heute: Flache Likelihood/Impact-Ableitung; reine Accountability-Findings (z. B. Shared Account) können kritischer wirken als Verlust der Navigationsfähigkeit.

- Zentrale Kalibrierungsfunktion (eine Stelle, konsistent für Anzeige, Matrix und PDF):
  - **Safety-kritische OT** (Navigation/ECDIS, Steuerung/Steering, Antrieb/Propulsion, Recovery/Manual-Ops, Power/PMS) erhalten einen **Impact-Floor** (mind. 4, bei Verlust der Manövrier-/Navigationsfähigkeit 5 — SOLAS-Bezug).
  - **Reine Accountability-/Audit-Trail-Findings** (Shared Account, fehlende Einzelanmeldung) werden im Impact **gedeckelt**, sodass sie nicht automatisch „Critical" erreichen.
- Garantie: angezeigte Likelihood, angezeigter Impact und Score sind immer konsistent (Score = L × I), kein Mismatch wie „5×3 = 25".

## 4. Kompensationsmaßnahmen berücksichtigen (Punkt 5)

Heute: fehlende Evidenz → sofort FAIL.

- Deklarierte/dokumentierte Schutzmaßnahmen (intake `measures`: aktiv/dokumentiert/auditiert) können einen Befund von **Fail auf Partial** anheben, wenn sie die Anforderung plausibel teilweise abdecken.
- Im Befund wird ein Hinweis ergänzt: „Kompensierende Maßnahme berücksichtigt: …" — nur auf Basis tatsächlich erklärter Maßnahmen (keine Erfindung).

## Betroffene Dateien (technisch)

- `src/data/iec62443Ur26Data.ts` — `deriveThreatsFromReqs` + neue Kalibrierungs-/Kompensationslogik; Conformance-Helper.
- `src/utils/iec62443Ur26ReportPdf.ts` — KPI-Umbenennung, Aufschlüsselung, Methodik-Wortlaut (DE/EN/FR), Trennung Konformität/Risiko, Kompensations-Hinweis.
- `src/pages/Iec62443Ur26ComplianceTool.tsx` — UI-Labels/KPIs analog (Conformance Score + Aufschlüsselung, getrennte Risiko-/Konformitätsanzeige).
- `src/utils/iec62443Ur26AuditFixes.ts` — bestehende Maritime-Impact-Regel (E1) in die zentrale Kalibrierung überführen; Konsistenz Score = L×I.

## Ausdrücklich unverändert

- Keine erfundenen Findings/Evidenzen (Data-Integrity-Policy).
- Dokumenten-Assessment-Engine (`iecDocumentAssessment.ts`, Edge Function) und AI-Reasoning bleiben unangetastet.
- PDF-Layout-Kern (`pdfCore.ts`) bleibt unverändert.
