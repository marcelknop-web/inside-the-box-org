import { MapPin, Sun, Rocket } from "lucide-react";

export function MissionBriefing() {
  return <div className="space-y-5">
    <h3 className="text-2xl font-semibold">Notlandung auf dem Mond</h3>
    <div className="grid grid-cols-3 gap-3 max-w-xl">
      {[{ Icon: MapPin, big: "320 km", small: "zum Mutterschiff" }, { Icon: Sun, big: "Tag", small: "Sonnenseite" }, { Icon: Rocket, big: "15", small: "Gegenstände" }].map(({ Icon, big, small }) =>
        <div key={small} className="rounded-lg border border-border bg-card p-4 text-center"><Icon className="size-7 text-primary mx-auto mb-2" /><p className="font-mono text-xl text-highlight">{big}</p><p className="text-xs text-muted-foreground">{small}</p></div>)}
    </div>
    <p className="max-w-xl text-foreground/90">Wähle die Gegenstände nacheinander – den wichtigsten zuerst.</p>
  </div>;
}
