# Notnagel GUI: Feinschliff für Kundenpräsentation

Rein visuelle Politur der Oberfläche. Wizard-Logik, Feldsemantik, KI-Prompts, Qualitätsprüfung und DOCX-Export bleiben unverändert. Farbwelt (Navy/Gold/Cyan) und Voxel-Charakter bleiben – nur ruhiger, sauberer, präziser.

## Was heute unprofessionell wirkt

- Große leere Fläche unter den Panels: Inhalt endet bei ca. einem Drittel der Höhe, das Raster läuft ins Nichts.
- Zweispaltiges Raster endet ungleich lang (linke Spalte deutlich kürzer als rechte) – wirkt „abgeschnitten“.
- Stepper ist zentriert, Inhalt links – zwei verschiedene Achsen auf einem Screen.
- Footer: sechs Aktionen in einer Reihe, „Hilfe“-Badge überlappt den Weiter-Button, „Weiter zu den Prozessen → →“ hat einen Pfeil doppelt.
- Titelbildschirm: Headline und zwei Kacheln kleben oben, riesiger Leerraum darunter; die Kachel-Texte sind ungleich lang („Schaden“ vs. voller Satz).
- Feld-Ebene: Hinweistexte unter den Feldern unterschiedlich hoch, dadurch springende Grundlinien in der Feldreihe.

## Die Änderungen

**Vertikale Komposition**
- Der Inhaltsbereich wird ein echtes Vollhöhen-Layout: Kopf, Inhalt, Fußzeile teilen die Viewporthöhe; der Inhalt wird vertikal zentriert statt oben angeklebt. Kein Leerlauf-Raster mehr unter dem letzten Panel.
- Panels einer Zeile werden auf gleiche Höhe gezogen, damit keine Spalte früher endet.
- Hintergrundraster erhält eine sanfte Vignette nach unten, sodass leere Flächen absichtlich wirken statt vergessen.

**Achse und Rhythmus**
- Stepper, Überschrift und Panels teilen eine linke Kante und dieselbe Maximalbreite.
- Einheitliche Abstandsskala (Panel-Innenraum, Abstand Panel zu Panel, Abstand Überschrift zu Inhalt) statt heute gemischter Werte.
- Überschriftenblock kompakter: Level-Zeile, Titel und Untertitel enger gesetzt, Titelgröße etwas reduziert.

**Fußzeile**
- Drei klare Zonen: links Navigation (Start, Zurück), Mitte Werkzeuge (Ton, Neu, Hilfe), rechts die Primäraktion.
- Der offene-Punkte-Zähler wandert vom überlappenden Badge in den Hilfe-Button als eingebettete Zahl.
- Primäraktion mit genau einem Pfeil und gekürztem Label („Weiter: Prozesse“).
- Feste Höhe der Fußzeile, Inhalt darüber mit passendem Abstand – keine Überlappung mehr auf Desktop und Mobile.

**Panels, Felder, Buttons**
- Bevel dezenter: dünnere Blockkanten und flacherer Schatten, damit die Optik hochwertig statt spielzeughaft wirkt.
- Panel-Titel einheitlich in Größe und Laufweite; Trennlinie leichter.
- Eingabefelder: einheitliche Höhe, klarer Fokusring in Gold, Hinweistexte auf eine Zeile normiert und in gleichmäßigem Abstand.
- Auswahl-Chips (normativer Rahmen) in gleichmäßigem Raster mit gleicher Höhe, aktiver Zustand ruhiger.

**Titelbildschirm**
- Zentrierte Komposition auf voller Höhe: Kicker, Headline, ein kurzer Absatz, Ergebnis-Kacheln als gleichmäßiges Raster mit gleich langen Kurzbeschriftungen, Startbutton als klarer Fokus darunter.

## Technisches

- `src/pages/Notnagel.tsx`: Layout-Container auf `h-[100dvh]` mit `flex-col` und scrollbarer Mitte; Zentrierung des Inhalts; Vereinheitlichung der Abstände; Raster mit `items-stretch`; `StepNav` in drei Zonen mit fixer Höhe; Labels gekürzt; Hilfe-Zähler in den Button integriert; Titelbildschirm-Sektion neu komponiert. Reveal-Kaskade (`StepSection`, `Cascade`, `Typewriter`) bleibt strukturell unverändert.
- `src/components/notnagel/VoxelUI.tsx`: `VoxelPanel` erhält `h-full` und einheitliche Innenabstände/Typo; `VoxelButton` bekommt eine `size`-Variante und ruhigere Bevel-Klassen.
- `src/components/notnagel/VoxelHud.tsx`: Header-Höhe fixiert, Level-Chip typografisch angeglichen, Stepper auf die Inhaltsachse gesetzt.
- `src/index.css`: `--voxel`-Schatten/Bevel-Werte abgeschwächt, Fokusring-Regel für Notnagel-Eingaben, Vignette-Utility für den Rasterhintergrund.
- `tailwind.config.ts`: `boxShadow.voxel*` auf die neuen, flacheren Werte angepasst.
- Kontrolle: Screenshots bei 1280×800 (Desktop, ohne Scrollen) und 390×844 (Mobile, kein horizontaler Überlauf) für Titelbildschirm sowie Schritte 1, 2 und 5.
