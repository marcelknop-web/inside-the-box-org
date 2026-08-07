# Notnagel als Voxel-Game-Interface

Notnagel wird von der hellen Business-Oberfläche in ein voll immersives, aber professionelles Game-Interface umgebaut — Voxel-/Block-Optik im Site-Branding (Navy, Gold, Cyan), Pixel-Headlines, Game-HUD und optionale Sounds. Die BCM-Logik, die Fragen, der KI-Coach, die Qualitätssicherung und die DOCX-Exporte bleiben unverändert.

## Look & Feel

- **Farbwelt**: Dark HUD — Hintergrund `#080b10`, Panels `#141c28`, Primär-Akzent Gold `#f5b800`, Status/Highlight Cyan `#00bcd4`. Kein eigener Farbraum, alles über die bestehenden Design-Tokens.
- **Voxel-Panels**: Karten und Eingabefelder erhalten harte Kanten (kein `rounded-2xl`), 2–3 px Blockrahmen und einen versetzten „Block-Schatten" (Pixel-Bevel: helle Oberkante, dunkle Unterkante). Optische Anmutung: gestapelte Blöcke statt schwebender Cards.
- **Hintergrund**: subtiles Voxel-Raster (Isometrie-Andeutung) plus dezenter Tiefen-Gradient, statt der heutigen Millimeterpapier-Fläche. Ruhig genug, dass Formulartext klar lesbar bleibt.
- **Typografie**: Pixel-Font (Press Start 2P, selbst gehostet als Asset) ausschließlich für Headlines, Step-Titel, HUD-Labels und Buttons-Caps. Fließtext, Formularlabels und Eingaben bleiben DM Sans / IBM Plex Mono — Lesbarkeit hat Vorrang.

## Game-HUD

- **Kopfzeile** wird zur HUD-Leiste: Voxel-Logo-Block, Titel in Pixel-Font, „Fortschritt" als segmentierte Energieleiste (5 Blöcke = 5 Schritte) statt dünner Linie, plus Sound-Toggle und Reset als HUD-Icons.
- **Stepper** wird zur Level-/Quest-Anzeige: 5 Voxel-Kacheln, aktuelles Level gold-glühend, erledigte Level mit Häkchen-Block, kommende gedimmt.
- **Fußnavigation** wird zur Aktionsleiste mit blockigen Buttons („◀ ZURÜCK" / „WEITER ▶") und Press-Effekt (Button senkt sich um 2 px, Bevel invertiert).
- **Landing (Step 0)** wird ein Titelbildschirm: Voxel-Szene, Spieltitel „NOTNAGEL", Untertitel, „ASSISTENT STARTEN" als Hauptbutton, darunter die drei Info-Kacheln als Voxel-Blöcke. Die bestehende sequentielle Reveal-Logik bleibt, wirkt jetzt als Terminal-/Konsolen-Einblendung.
- **Fortschritts-Feedback**: beim Schrittwechsel ein kurzer Level-Up-Sweep (Blockraster wischt durch), 400–600 ms, respektiert `prefers-reduced-motion`.
- **Coach-FAB** wird ein Voxel-Helper-Block (Buch/Hilfe-Icon), bleibt an heutiger Position.

## Sound (standardmäßig aus)

- Toggle im HUD, Zustand in `localStorage`, Standard = aus. Kein Autoplay.
- Vier dezente Effekte über ElevenLabs generiert und als Assets abgelegt: Klick (blockiger Tap), Schrittwechsel (Level-Up), Erfolg/Export fertig, Fehler/Blocker. Kein Hintergrundmusik-Loop.

## Nicht Teil des Umbaus

- Wizard-Reihenfolge, Feldsemantik, Schadens-/Aktivierungsstufen, KI-Prompts, Qualitätsprüfung, DOCX-Ausgabe.
- Andere Seiten der Website bleiben unangetastet.

## Technische Umsetzung

- **Tokens**: neue Voxel-Tokens (`--voxel-bevel-light`, `--voxel-bevel-dark`, `--voxel-panel`, Block-Shadow, Pixel-Grid-Background) in `src/index.css`; Keyframes für Level-Sweep, Button-Press und Gold-Glow dort ergänzt. Tailwind-Erweiterung (`boxShadow.voxel`, `fontFamily.pixel`) in `tailwind.config.ts`.
- **Font**: Press Start 2P als WOFF2 via `lovable-assets` hochladen, `@font-face` mit `font-display: swap`, nur für Headline-Klassen.
- **Neue Komponenten** unter `src/components/notnagel/`: `VoxelPanel.tsx` (Block-Card mit Bevel), `VoxelButton.tsx` (primary/ghost, Press-State), `HudBar.tsx` (Titel, Energieleiste, Sound-Toggle, Reset), `LevelStepper.tsx`, `TitleScreen.tsx` (Step-0-Szene), `LevelSweep.tsx`.
- **`src/pages/Notnagel.tsx`**: die lokalen Helfer `Card`, `SectionHead`, `StepNav`, `inputCls`, `Hint`, `Field` sowie die Tile-/Button-Stacks werden auf die Voxel-Komponenten und Dark-Tokens umgestellt. Hardcodierte Farben (`#FBFCFC`, `#0E4749`, `text-neutral-*`, `teal-*`) werden durch semantische Tokens ersetzt. Reveal-/Scroll-Logik bleibt strukturell unverändert.
- **`src/components/notnagel/NotnagelCoach.tsx`**: nur Styling auf Voxel/Dark angepasst, Logik unverändert.
- **Sound**: `src/hooks/useNotnagelAudio.ts` nach dem Muster von `useSocLifeAudio.ts` — vier MP3-Assets, gepuffert, mit Mute-Persistenz.
- **Kontrast**: alle Text-/Flächenpaare gegen den Dark-Hintergrund geprüft, Fokusring (Gold) bleibt aktiv.
