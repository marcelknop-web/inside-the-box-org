# Gesamtbericht: stringente Prüfbericht-Struktur

Ziel: Der Bericht soll wie ein Wirtschaftsprüfer-/Auditbericht lesen — ein durchgehender Argumentationsfaden statt vieler kleiner, wiederholter Blöcke. Inhalte und Zahlen bleiben unverändert (gleiche deterministische Ergebnisse), es ändert sich die Reihenfolge, Bündelung und Sprache.

## Was heute "zerklüftet" wirkt

- Der Geltungsbereich (Scope Verdict) erscheint doppelt: in Kapitel 1 und in Kapitel 2.
- Kapitel 1 mischt vier Ebenen (Summary, Attention Index, Audit Readiness, deterministische Root Causes).
- Root Causes tauchen in Kapitel 1 auf, die daraus abgeleiteten Maßnahmen erst in Kapitel 6 — ohne sichtbare Verbindung.
- AI-Inhalte liegen als Kapitel 9 mit 10+ eigenen Unterblöcken hinter dem Nachweisteil und wiederholen Teile der Aussagen aus Teil A.
- Viele Aussagen erscheinen als Label-Wert-Listen und Mono-Tabellen, wo ein Prüfbericht Prosa mit einem Satz Bewertung erwartet.

## Neue Struktur (Kapitelnummerierung durchgehend)

Teil A — Bericht (Management)
1. Zusammenfassung und Gesamturteil — Summary, Readiness-KPIs, Verdict-Balken, ein Absatz "Gesamturteil" (nur einmal), Verweis auf die Kapitel, in denen die Aussagen belegt werden.
2. Auftrag, Geltungsbereich und Aussagegrenzen — Scope Verdict, Anwendbarkeit, Claims/Limitations, Intake-Record; einzige Stelle für Scope.
3. Vorgehen und Bewertungsgrundlage — Assessment-Prinzipien, Herkunft der Ergebnisse, Evidence-Grading in Kurzform.
4. Feststellungen — Readiness je Anforderung (Matrix + "Positions requiring attention"), Attention Index und Audit-Readiness-Dimensionen wandern hierher, weil sie Feststellungen sind.
5. Ursachenanalyse — deterministische Root-Cause-Cluster, direkt gefolgt von den betroffenen Anforderungen; klar getrennter Unterabschnitt "AI-Hypothesen (nicht verifiziert)".
6. Risikolandschaft — unverändert, aber mit einem einleitenden Satz, der auf Kapitel 4/5 zurückbezieht.
7. Maßnahmenplan und Roadmap — jede Maßnahme referenziert die Root-Cause-ID (RC1…) und die Anforderungs-IDs, damit die Kette Feststellung -> Ursache -> Maßnahme sichtbar ist.
8. Fazit und Empfehlung — ein Absatz Gesamtaussage plus Voraussetzungen für die nächste Reifestufe.

Teil B — Nachweisteil
9. Nachweise und Verifikation je Anforderung (heute Kap. 8).
10. AI Insights & Advisory (heute Kap. 9) — als klar gekennzeichneter, nicht-prüfungsrelevanter Teil; nur die Blöcke, die nicht schon in Teil A stehen (Doppelungen aus Executive Insights entfernen).
Anhang A Arbeitspapiere & Nachvollziehbarkeit, Anhang B Scoring-Methodik — unverändert.

## Stilangleichung

- Jedes Kapitel beginnt mit 1–2 Sätzen Einordnung (was wird gezeigt, wie ist es zu lesen), danach Daten.
- Feststellungen im Prüfstil: Sachverhalt — Bewertung — Auswirkung, statt reiner Label-Wert-Zeilen.
- Einheitliche Überschriftentiefe: maximal Kapitel > Abschnitt > Feststellung; die heute punktuell verwendete 4. Ebene entfällt.
- Wiederholte Erklärtexte (z. B. Readiness-Disclaimer) erscheinen genau einmal, mit Querverweis.

## Technische Umsetzung

- `src/utils/metaAssessmentReportPdf.ts`: Reihenfolge der Renderblöcke umstellen, Section-Keys `sec1`–`sec10` neu belegen (DE/EN/FR-Labels anpassen), doppelte Scope- und Root-Cause-Ausgaben entfernen, TOC und `addBookmark`-Aufrufe an die neue Reihenfolge anpassen.
- Roadmap-Items um die Zuordnung zur Root-Cause-ID ergänzen (rein darstellend, aus den vorhandenen `controlIds` abgeleitet — keine Änderung an `engine.ts`).
- Executive-Brief-Modus behält seinen kompakten Aufbau, übernimmt aber die neuen Kapitelbezeichnungen.
- QA: PDF über das bestehende Skript rendern, Seiten als Bilder prüfen (keine Überdeckungen, keine abgeschnittenen Texte), Typecheck und Build.
