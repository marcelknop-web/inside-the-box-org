# Abschließender Korrekturlauf für alle öffentlichen Unterseiten

## Umsetzung

### Einheitliche öffentliche Seiten

- Die 14 Marketing-Leistungsseiten auf eine gemeinsame, hochwertige Struktur umstellen: kompakter Marken-Header, Themen-Rückweg, eine Leistungs-H1, kurze Nutzenzeile, konkrete Leistung, Ergebnisse, Kundenvorbereitung, kleiner Ablauf, Kontaktaktion und gezielte verwandte Links.
- Lange fachliche Vertiefungen erhalten, aber sekundär und aufklappbar darstellen. Den großen Navigator durch das bestehende kompakte Panel ersetzen.
- Wissen & KI-Lab, Fachartikelübersicht, Team, Kontakt sowie öffentliche Tool-Einführungen gestalterisch angleichen. Impressum und Datenschutz nur in Layout und Lesbarkeit ändern, nicht inhaltlich umschreiben.
- DM Sans für lesbaren Fließtext und IBM Plex Mono gezielt für Kategorien, Nummern und technische Metadaten verwenden.

### Millimeterpapier-System

- Das feine technische Raster auf Navy als gemeinsames Motiv für Landingpage und Unterseiten wiederherstellen und vereinheitlichen.
- Kleine Teilungen mit zurückhaltenden Hauptlinien verwenden; auf Mobilgeräten dezenter, ohne Moiré oder konkurrierende Muster.
- Längere Texte auf ruhige dunkle Flächen beziehungsweise sanfte Abdunklungen setzen. Den korrigierten 120°-Würfel und seine Bodentiefe unverändert erhalten.

### Redaktion und Navigation

- DE/EN/FR vollständig und idiomatisch kürzen: Jede Leistung beantwortet schnell Problem, Leistung, Ergebnis und Einstieg.
- Wiederholungen, Fülltexte und pauschale Versprechen entfernen; keine neuen Leistungen, Kennzahlen, Zusagen oder Compliance-Garantien ergänzen.
- Das KI-Lab präzisiert den Unterschied zwischen direkt nutzbaren und geschützten Werkzeugen. Experimente bleiben erreichbar, erscheinen aber nicht als Beratungsangebote; Direktlinks und Daten bleiben bestehen.
- Vorhandene Team- und Kontaktdaten übernehmen und sinnvolle Rückwege zwischen Thema, Leistung und Startseite sicherstellen.

### Öffentliche Tool-Zugänge

- Den gemeinsamen Seitenrahmen in alle Tool-Einführungen integrieren: Marke, Startseiten-Rückweg, DE/EN/FR-Auswahl und responsiver Footer mit Kontakt/Impressum.
- Den 320-px-Überlauf im Footer und in allen gemeinsamen Gate-Bausteinen beseitigen; lange Bezeichnungen und Navigation dürfen umbrechen.
- Für jedes geschützte Tool lokalisierte Titel und Beschreibungen setzen. Kanonische Routen referenzieren sich selbst; Alias-Routen verweisen auf ihr kanonisches Ziel.
- `/itsm` anhand der tatsächlichen Funktionen aus `itsm-tool.html` konkret beschreiben: Servicekatalog, Prozesse, Gruppen, Berechtigungen, Mappings, Abhängigkeiten, Qualitäts-/Compliance-Prüfung, Visualisierung und Import/Export.
- `/itsm-dev` klar als internes Entwicklungswerkzeug mit zusätzlichen Testmodulen kennzeichnen, nicht als Kundenangebot.
- Passwortprüfung, Sitzungslogik, RLS und alle Inhalte hinter dem Login unverändert lassen.

## Verifikation

- Die gemeinsame Service-Vorlage und repräsentative Seiten aus allen drei Themen bei 320, 390, 768, 1024 und 1440 px prüfen; DE/EN/FR aktiv durchschalten.
- Horizontale Überläufe numerisch mit `scrollWidth <= innerWidth` prüfen sowie H1, abgeschnittene Inhalte, Fokus, Buttons, Themen-/Service-Rückwege, kompaktes Panel, Kontakt, Team und Rechtliches kontrollieren.
- Alle 19 gefundenen Gate-Routen einschließlich Alias-Schreibweisen bei 320 px öffnen. Je Route Einführung vor genau einem geschützten Zugang, Sprache, H1, Seitentitel, Beschreibung und Canonical auslesen.
- Build und Browserzustand bestätigen. Keine Passwörter eingeben, keine Produktivdaten anlegen und nicht veröffentlichen.

## Technische Leitplanken

- Gemeinsame Seitenbausteine und die vorhandenen dreisprachigen Inhaltsmodelle nutzen, damit Struktur, Metadaten und Rückwege nicht auseinanderlaufen.
- Bestehende Design-Tokens für Navy, Gold, Cyan, Typografie und Flächen beibehalten; keine parallele zweite Designsprache einführen.
- Rechtstexte, Zugangskontrollen und Tool-Implementierungen hinter dem Login bleiben funktional unangetastet.
