// Nordstern – 7-Etappen-Route Athen → Bodrum
// Koordinaten als SVG-viewBox-Punkte (0..100 normalisiert)
export interface Stage {
  id: string;
  from: string;
  to: string;
  nm: number; // Seemeilen
  topicHint: 'navigation' | 'recht' | 'wetter' | 'seemannschaft';
  scene: string; // Mini-Setting für Scene-Wrapper
  x: number; y: number; // Zielhafen
  fromX: number; fromY: number; // Starthafen
}

export const STAGES: Stage[] = [
  { id: 's1', from: 'Athen / Piräus', to: 'Kap Sounion', nm: 28, topicHint: 'navigation',
    scene: 'Sie laufen am frühen Morgen aus Piräus aus. Der Hafenmeister winkt – los geht\'s Richtung Kap Sounion.',
    fromX: 12, fromY: 35, x: 22, y: 42 },
  { id: 's2', from: 'Kap Sounion', to: 'Kea', nm: 20, topicHint: 'wetter',
    scene: 'Ein Meltemi kündigt sich an. Sie peilen Kea, der Tempelfelsen verschwindet langsam achteraus.',
    fromX: 22, fromY: 42, x: 32, y: 48 },
  { id: 's3', from: 'Kea', to: 'Mykonos', nm: 55, topicHint: 'navigation',
    scene: 'Lange Etappe durch die Kykladen. Sie planen die Querung – Strom, Drift, Versatz.',
    fromX: 32, fromY: 48, x: 50, y: 55 },
  { id: 's4', from: 'Mykonos', to: 'Naxos', nm: 22, topicHint: 'recht',
    scene: 'Reger Verkehr: Fähren, Charteryachten, ein Frachter querab. Die KVR ist Ihr bester Freund.',
    fromX: 50, fromY: 55, x: 58, y: 62 },
  { id: 's5', from: 'Naxos', to: 'Astypalea', nm: 60, topicHint: 'seemannschaft',
    scene: 'Nachtetappe. Wache einteilen, Lichterführung prüfen, Crew briefen.',
    fromX: 58, fromY: 62, x: 72, y: 60 },
  { id: 's6', from: 'Astypalea', to: 'Kos', nm: 38, topicHint: 'wetter',
    scene: 'Sommer-Meltemi mit 6–7 Bft. Reff im Groß, Fock dicht – ab in den Süden.',
    fromX: 72, fromY: 60, x: 80, y: 52 },
  { id: 's7', from: 'Kos', to: 'Bodrum', nm: 18, topicHint: 'recht',
    scene: 'Grenzübertritt nach Türkei. Flagge, Papiere, Einklarierung – alles bereit?',
    fromX: 80, fromY: 52, x: 90, y: 48 },
];

export const PORTS = [
  { name: 'Piräus', x: 12, y: 35 },
  { name: 'Sounion', x: 22, y: 42 },
  { name: 'Kea', x: 32, y: 48 },
  { name: 'Mykonos', x: 50, y: 55 },
  { name: 'Naxos', x: 58, y: 62 },
  { name: 'Astypalea', x: 72, y: 60 },
  { name: 'Kos', x: 80, y: 52 },
  { name: 'Bodrum', x: 90, y: 48 },
];
