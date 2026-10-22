import { MapPin, Sun, Rocket } from "lucide-react";

export function MissionBriefing() {
  return <div className="border-l-2 border-highlight pl-5 space-y-5">
    <p className="font-mono text-xs text-highlight">MOON CRASH · ÜBUNGSSITUATION</p>
    <h3 className="text-2xl font-semibold">Notlandung auf dem Mond</h3>
    <p className="max-w-2xl leading-relaxed text-foreground/90">Die Crew sollte sich mit dem Mutterschiff auf der Mondoberfläche treffen. Bei der Landung ist das Raumschiff jedoch abgestürzt – rund 320 Kilometer vom Treffpunkt entfernt. Ein großer Teil der Ausrüstung ist beschädigt. Nur 15 Gegenstände sind unversehrt geblieben.</p>
    <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm">
      <span className="flex items-center gap-2"><MapPin className="size-4 text-primary" />320 km bis zum Mutterschiff</span>
      <span className="flex items-center gap-2"><Sun className="size-4 text-primary" />Sonnenbeschienene Mondseite</span>
      <span className="flex items-center gap-2"><Rocket className="size-4 text-primary" />15 intakte Gegenstände</span>
    </div>
    <p className="max-w-2xl leading-relaxed text-muted-foreground">Die Crew muss den Treffpunkt erreichen. Welche Ausrüstung ist dafür am wichtigsten? Alle 15 Gegenstände werden nach ihrem Beitrag zum Überleben geordnet – vom wichtigsten bis zum am wenigsten wichtigen.</p>
    <p className="text-xs text-muted-foreground">Klassische Moon-Crash-Gruppenübung mit NASA-Referenzwertung; keine Anleitung für reale Mondmissionen.</p>
  </div>;
}