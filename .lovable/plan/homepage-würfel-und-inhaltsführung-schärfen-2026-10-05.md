# Homepage, Würfel und Inhaltsführung schärfen

## Ziel
Die öffentliche Oberfläche wird spürbar ruhiger und schneller erfassbar: eine klare Reihenfolge aus Thema, Nutzen und nächstem Schritt; eine eigenständig komponierte mobile Startseite; ein geometrisch korrekt beschrifteter Würfel; reduzierte Leistungs- und Tool-Einstiege mit vollständig erreichbarer fachlicher Tiefe.

## Umsetzung
- Die Startseite redaktionell verdichten: doppelte Abschnittsbezeichnungen entfernen, Themenwahl auf kurze lokalisierte Titel reduzieren und Angebote mit einer sofort sichtbaren Hauptleistung sowie zurückhaltend aufklappbaren Nebenlinks darstellen.
- Für 320/390 px einen kompakten mobilen Kopfbereich mit bedienbarem Menü, erreichbarer Sprachwahl, 30–36 px großer H1, ca. 190–220 px sichtbarem Würfel und drei mindestens 44 px hohen Themenwahlen gestalten; Tablet und Desktop bleiben in ihrer bestehenden Komposition erhalten.
- Den Themenwürfel so korrigieren, dass jede Beschriftung genau eine feste lokale Flächenorientierung erhält. Auswahlabhängige Gegenrotationen und Inhaltsanimationen entfallen; nur der gesamte Würfel dreht kumuliert um die bestehende Raumdiagonale. Klick-, Wisch-, Pfeiltasten- und Reduced-Motion-Verhalten bleiben erhalten.
- Die 14 Leistungsseiten auf eine knappe Erstansicht reduzieren: H1, ein Nutzensatz, Kontaktaktion und drei kurze Ergebniskarten. Ablauf plus Vorbereitung kommen gemeinsam in eine geschlossene Offenlegung; alle technischen Inhalte erscheinen gesammelt in einer zweiten geschlossenen Offenlegung.
- Öffentliche Tool-Erklärungen auf Zweck, Nutzen und nächsten Schritt verdichten; geschützter Zugang, Sicherheitslogik und Tool-Inhalte bleiben unverändert.
- DE/EN/FR sprachlich gleichwertig halten, „Ansprechpartner“ verwenden und unbelegte Rechts- oder Zertifizierungszusagen vermeiden.

## Technische Details
- Gemeinsame Inhalte bleiben datengetrieben über `homeTopics`, `serviceDetails` und `toolIntroductions`.
- Mobile Navigation erhält einen echten Offen/Geschlossen-Zustand mit ARIA-Angaben, Tastaturfokus und ausreichenden Touchflächen.
- Die zwei Offenlegungen der Leistungsseite verwenden die vorhandene zugängliche Accordion-Komponente und sind initial geschlossen.
- Das bestehende Millimeterpapier, die Navy-/Gold-Tokens, Gates, Metadaten, Footer, Tool-Workflows und Zugangskontrollen werden nicht strukturell verändert.

## Prüfung
- Homepage bei 320×667, 390×844, 768 und 1440 px auf Bildaufbau, Überlauf und Bedienung prüfen; DE/EN/FR sowie Menü, Themenwahl, Würfel/Angebot-Synchronisation testen.
- Alle drei Würfel-Endlagen und eine Zwischenlage visuell prüfen; feste Flächenbeschriftung anhand der CSS-Matrizen und Screenshots kontrollieren.
- Mindestens zwei Leistungsseiten mit geschlossenen und geöffneten Bereichen prüfen; anschließend alle 14 Routen auf eine H1, zwei initial geschlossene Offenlegungen und horizontalen Überlauf testen.
- Repräsentative Tool-Erklärungen bis zum weiterhin erreichbaren Login prüfen.
- Vorschau-Build und Laufzeitprotokolle kontrollieren. Nicht veröffentlichen.
