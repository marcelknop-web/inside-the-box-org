# Startseite, Tool-Zugänge und Service-Inhalte verfeinern

## Ziel
Die bestehende unveröffentlichte Überarbeitung gezielt fertigstellen: einen hochwertigen, eindeutig bedienbaren Themenwürfel, öffentliche Erklärseiten vor sämtlichen vorhandenen Passwortzugängen und konsistente Service-Inhalte in Deutsch, Englisch und Französisch. Bestehende Zugriffsmechanismen, Tool-Funktionen und Direktlinks bleiben unverändert.

## Umsetzung
- Den CSS-3D-Themenwürfel geometrisch schließen und visuell beruhigen: matte Navy-Flächen, klare Kanten/Fasen, gerichtetes Licht, dezenter Bodenschatten und ausschließlich kurze Beschriftungen auf den Flächen.
- Würfelbedienung vollständig synchronisieren: sichtbare inaktive Fläche wählt direkt, aktive Fläche sowie Enter/Leertaste schalten weiter, Pfeiltasten und bewusster horizontaler Swipe bleiben erhalten; Swipe löst keinen zusätzlichen Klick aus; Reduced Motion und kleine Displays werden berücksichtigt.
- Das globale Hintergrundraster entfernen und nur am Würfel ein sehr dezentes Bodenraster belassen; Header-Marke mit Symbol und lesbarem Schriftzug darstellen.
- Sämtliche tatsächlichen Passwort-Gates inventarisieren und ein gemeinsames dreisprachiges Einführungslayout ergänzen: Zielgruppe, Problem, Vorbereitung, Drei-Schritt-Ablauf, Ergebnisse, Grenzen und Sprung zum Login. Bereits entsperrte Sitzungen öffnen weiterhin direkt das Tool.
- Für jedes geschützte Tool ausschließlich verifizierte, spezifische Inhalte hinterlegen; Passwortprüfung, Tokens, Rollen und geschützte Tool-Inhalte nicht verändern. Separate bestehende Zugangsmasken ebenfalls mit dem gemeinsamen Erklärmuster versehen, ohne ihre Prüfung umzubauen.
- Relevante Service-Seiten redaktionell und visuell straffen: Leistungsname und Nutzen zuerst, Ergebnisse und Kontakt klar sichtbar, sekundäre Details kompakter, Typewriter-Darstellung auf Marketingseiten entfernen und verwandte Angebote sauber abgrenzen.
- Cyber-Krisenmanagement fachlich auf Vorbereitung, tatsächliche Krisenführung und Kommunikation ausrichten; Incident Management, BCM und Übungen mit sinnvollen Schnittstellen klar unterscheiden.
- Homepage-Kuration korrigieren: Wissen & Tools auf Fachartikel/Insights und KI-Lab begrenzen; Assessment-Tools primär unter Sicherheit & Compliance führen; Experimente nur aus Hauptübersichten entfernen, nicht löschen.
- Den großen Navigator-Chat auf Service-Seiten durch einen kleinen explizit aufklappbaren Zugang mit klarem Schließen ersetzen; keine Unterhaltung automatisch starten.
- Neue und überarbeitete Texte, Hinweise, ARIA-Bezeichnungen und Metadaten idiomatisch in DE/EN/FR ausgeben; kanonische URLs beibehalten und keine falschen hreflang-Verweise ergänzen.

## Technische Details
- Gemeinsame Intro-Daten und eine wiederverwendbare Gate-Erklärkomponente verwenden, damit Inhalte und Zugangszustand nicht auseinanderlaufen.
- Homepage-Themen und Links weiterhin ausschließlich aus `src/data/homeTopics.ts` speisen.
- Bestehende semantische Design-Tokens, DM Sans und IBM Plex Mono verwenden; keine neue schwere 3D-Bibliothek.
- Keine Änderungen an Cloud-Daten, Passwörtern, Rollen, Zugriffspolitiken, Authentifizierungsmechanik oder anderen Projekten.

## Prüfung
- Würfel bei 320, 390, 768, 1024 und 1440 Pixeln prüfen: aktive/inaktive Fläche, drei vollständige Wechsel, Tabs, Tastatur, Swipe und Reduced Motion.
- DE/EN/FR sowie Kontakt, Team, Impressum/Datenschutz, Service-Links und Rückwege prüfen.
- Jede gefundene geschützte Route öffentlich öffnen: Einführung vor Login sichtbar, geschützter Inhalt weiterhin verborgen; keine Passwörter ausprobieren und keine Produktivdaten anlegen.
- Repräsentative Service-Seiten und den kompakten Navigator auf Mobil/Desktop prüfen; Build-, Laufzeit- und Konsolenfehler kontrollieren.
- Nicht veröffentlichen.
