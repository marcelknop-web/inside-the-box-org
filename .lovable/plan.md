# Abschließender Korrekturlauf für öffentliche Tool-Zugänge

## Umsetzung

- Den gemeinsamen öffentlichen Seitenrahmen direkt in die Tool-Einführung integrieren: Marke, Rückweg zur Startseite, DE/EN/FR-Auswahl und responsiver Footer mit Kontakt/Impressum.
- Den 320-px-Überlauf im Footer und in allen gemeinsam genutzten Gate-Bausteinen beseitigen; lange Bezeichnungen und Navigation dürfen umbrechen.
- Für jedes geschützte Tool lokalisierte Titel und Beschreibungen aus der gemeinsamen Einführungsdatenquelle setzen.
- Canonicals für kanonische Routen selbstreferenzierend setzen; Alias-Routen auf ihr kanonisches Ziel verweisen.
- `/itsm` anhand der tatsächlichen Funktionen aus `itsm-tool.html` konkret beschreiben; `/itsm-dev` ausdrücklich als internes Entwicklungs- und Prüfwerkzeug kennzeichnen.
- Passwortprüfung, Sitzungslogik, RLS und die Inhalte hinter dem Login unverändert lassen.

## Verifikation

- Alle gefundenen Gate-Routen und Alias-Schreibweisen bei 320 px im Browser öffnen und `scrollWidth <= innerWidth` messen.
- Auf jeder öffentlichen Einführung Sprache, H1, Passwortfeld, Seitentitel, Beschreibung und Canonical auslesen.
- DE/EN/FR auf repräsentativen Seiten aktiv durchschalten und Persistenz prüfen.
- Keine Passwörter eingeben, keine Daten anlegen und nicht veröffentlichen.
