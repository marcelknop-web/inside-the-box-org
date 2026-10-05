# Startseite auf drei Themenbereiche umbauen

## Ziel
Den freigegebenen Entwurf als neue öffentliche Startseite umsetzen: klare Navigation, interaktive 3D-Drehbox, drei vollständig verlinkte Leistungsbereiche sowie kompakte Zugänge zu Wissen, Tools, Team und Kontakt.

## Umsetzung
- Die bisherige fünfstufige Einstiegslogik durch drei Themen ersetzen: Sicherheit & Compliance, Krisen vorbereiten & bewältigen, Üben & trainieren.
- Die CSS-3D-Box als zugängliche React-Komponente bauen: Auswahl per Klick, Tastatur und horizontalem Wischen; kein Autoplay; reduzierte Bewegung berücksichtigen.
- Pro Thema genau drei Angebotsgruppen zeigen und jede Gruppe mit den bereits vorhandenen Detailseiten verbinden.
- Wissen & Tools als eigenen, kuratierten Bereich integrieren; geschäftlich relevante Werkzeuge sichtbar lassen und bestehende Direktlinks/Zugangsschutz unverändert erhalten.
- Header um Leistungen, Wissen & Tools, Team, Kontakt und DE/EN/FR ergänzen; bestehende Team-, Kontakt-, Impressums- und Datenschutzinhalte weiterverwenden.
- Startseitentexte und Metadaten vollständig auf Deutsch, Englisch und Französisch bereitstellen.
- Service-Detailseiten nicht neu erfinden, aber ihre bestehende Navigation, Rückwege und Canonicals prüfen und konsistent halten.

## Technische Details
- Bestehende Design-Tokens, DM Sans und IBM Plex Mono verwenden; neue visuelle Werte nur als semantische Tokens ergänzen.
- Neue fokussierte Komponenten und Inhaltsdaten für Themenbox, Angebotskarten und kuratierte Tool-Gruppen erstellen.
- Auswahlzustand pro Sitzung erhalten, ohne beim erneuten Besuch einen alten Unterbereich zu erzwingen.
- Semantische Links für Navigation und Ziele, Buttons nur für lokale Zustandswechsel.
- Keine Änderungen an Backends, Zugriffsschutz, Datenbankregeln oder Tool-Engines.

## Prüfung
- Desktop: 1024 und 1440 Pixel; Mobil/Tablet: 320, 390 und 768 Pixel.
- Alle Themen, Boxflächen, Tastatur, Wischen, Sprachwechsel, Header, Kontakt sowie repräsentative Service- und Tool-Links testen.
- Textüberläufe, Fokuszustände, Touch-Ziele, Kontrast und reduzierte Bewegung prüfen.
- Aktuellen Preview-Build und Browser-Fehler kontrollieren; nicht veröffentlichen.
