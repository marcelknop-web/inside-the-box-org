// Original item order from the NASA StarChild exercise; ranks stay server-side until release.
export const reference = [15, 4, 6, 8, 13, 11, 12, 1, 3, 9, 2, 10, 7, 14, 5];
export const explanations = [
  "Ohne Sauerstoff in der Mondatmosphäre können Streichhölzer nicht brennen.",
  "Kompakte Energieversorgung für den Weg zum Mutterschiff.",
  "Hilft beim Überqueren von Kratern und beim Sichern oder Unterstützen Verletzter.",
  "Kann als Schutz vor Sonnenstrahlung genutzt werden.",
  "Auf der sonnenbeschienenen Seite nach den Annahmen dieser Übung nicht erforderlich.",
  "In der historischen Lösung als mögliche Antriebshilfe eingeordnet; geringer Nutzen.",
  "Sperriger Ersatz für das Nahrungskonzentrat und nur mit Wasser nutzbar.",
  "Unverzichtbar zum Überleben; die Menge deckt den wichtigsten Bedarf.",
  "Hilft bei der Orientierung anhand der Sterne auf der Mondoberfläche.",
  "Die Gasflasche des Floßes wird in der historischen Lösung als mögliche Antriebshilfe betrachtet.",
  "Ersetzt Flüssigkeitsverluste auf der sonnenbeschienenen Seite.",
  "Dienen als Notsignal bei Sichtkontakt zum Mutterschiff.",
  "Versorgt Verletzungen; das Original nennt auch Injektionsnadeln.",
  "Der Mond hat kein globales Erdmagnetfeld, das einen gewöhnlichen Kompass zur Navigation nutzbar macht.",
  "Kontakt zum Mutterschiff; FM-Funk erfordert grundsätzlich Sichtverbindung.",
];
export function scoreRanking(ranking: number[]) {
  return ranking.reduce((sum, rank, index) => sum + Math.abs(rank - reference[index]), 0);
}