import { useState } from "react";
import { Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moonCrashItems } from "@/data/moonCrashItems";
import { PersonalAnalysis } from "@/components/moonCrash/PersonalAnalysis";

type Person = { slot: number; name: string; score: number | null; ranking: number[] | null };
export function MoonCrashResults({ participants, reference, explanations, groupRanking, groupScore, winnerSlots, ownSlot }: { ownSlot?: number | null; participants: Person[]; reference: number[]; explanations: string[] | null; groupRanking: number[] | null; groupScore: number | null; winnerSlots: number[] }) {
  const ranked = participants.filter(p => p.score !== null && p.ranking).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const [selected, setSelected] = useState<number | "group">(ownSlot != null && participants.some(p => p.slot === ownSlot && p.ranking) ? ownSlot : groupRanking ? "group" : ranked[0]?.slot ?? 0);
  const fallback = groupRanking ? "group" as const : ranked[0]?.slot ?? 0;
  const valid = selected === "group" ? !!groupRanking : participants.some(p => p.slot === selected && p.ranking);
  if (!valid && fallback !== selected) setSelected(fallback);
  const person = participants.find(p => p.slot === selected);
  const ranking = selected === "group" ? groupRanking : person?.ranking;
  const label = selected === "group" ? "Gruppenlösung" : person?.name ?? "Keine Abgabe";
  const winners = ranked.filter(p => winnerSlots.includes(p.slot));
  const maxScore = Math.max(1, ...ranked.map(p => p.score ?? 0), groupScore ?? 0);
  const meanScore = ranked.length ? ranked.reduce((sum, p) => sum + (p.score ?? 0), 0) / ranked.length : null;
  return <section className="py-8">
    <p className="font-mono text-xs text-highlight mb-2">MISSION DEBRIEF</p><h2 className="text-3xl font-semibold">Die Weisheit der Vielen</h2><p className="mt-2 text-sm text-muted-foreground">Absolute Rangabweichungen zur NASA-Lösung · Weniger Punkte sind besser.</p>
    <div className="grid md:grid-cols-3 gap-6 py-7 border-b border-border">
      <div><Trophy className="size-7 text-primary mb-3" /><p className="text-xs font-mono text-muted-foreground">{winners.length > 1 ? "GEMEINSAME GEWINNER" : "GEWINNER"}</p><h3 className="text-xl font-semibold mt-2 break-words">{winners.map(p => p.name).join(" · ") || "Keine Abgabe"}</h3><p className="text-3xl font-mono text-primary mt-2">{ranked[0]?.score ?? "—"}<span className="text-sm text-muted-foreground"> Punkte</span></p></div>
      <div><Users className="size-7 text-highlight mb-3" /><p className="text-xs font-mono text-muted-foreground">GEMEINSAME GRUPPENLÖSUNG</p><p className="text-3xl font-mono text-highlight mt-3">{groupScore ?? "—"}<span className="text-sm text-muted-foreground"> Punkte</span></p><p className="text-sm text-muted-foreground mt-2">{groupRanking ? "Gemeinsam vereinbarte Prioritäten" : "Keine Gruppenlösung abgegeben"}</p></div>
      <div><p className="text-xs font-mono text-muted-foreground mt-10">DURCHSCHNITT DER EINZELLÖSUNGEN</p><p className="text-3xl font-mono mt-3">{meanScore === null ? "—" : meanScore.toFixed(1)}<span className="text-sm text-muted-foreground"> Punkte</span></p>{meanScore !== null && groupScore !== null && <p className="text-sm mt-2 text-highlight">{groupScore < meanScore ? `${(meanScore - groupScore).toFixed(1)} Punkte besser als der Einzel-Durchschnitt` : groupScore > meanScore ? `${(groupScore - meanScore).toFixed(1)} Punkte über dem Einzel-Durchschnitt` : "Gleichauf mit dem Einzel-Durchschnitt"}</p>}</div>
    </div>
    {ranking && <PersonalAnalysis key={String(selected)} label={label} ranking={ranking} reference={reference} crewScores={ranked.map(p => p.score ?? 0)} groupScore={groupScore} />}
    <div className="grid lg:grid-cols-[280px_1fr] gap-8 pt-8">
      <div><h3 className="text-xl mb-4">Crew-Vergleich</h3>{[...(groupRanking ? [{ slot: "group" as const, name: "Gruppenlösung", score: groupScore }] : []), ...ranked].map(p => <Button key={p.slot} variant="ghost" aria-pressed={selected === p.slot} onClick={() => setSelected(p.slot)} className={`w-full h-auto min-h-16 flex-col items-stretch px-3 py-3 whitespace-normal text-left mb-2 ${selected === p.slot ? "bg-secondary border-l-2 border-highlight" : ""}`}><span className="flex justify-between gap-3"><span className="min-w-0 break-words">{p.name}</span><span className="font-mono text-highlight">{p.score}</span></span><svg viewBox="0 0 240 5" className="!w-full !h-2" aria-hidden="true"><rect width="240" height="5" rx="2" className="fill-muted" /><rect width={Math.max(2, ((p.score ?? 0) / maxScore) * 240)} height="5" rx="2" className={p.slot === "group" ? "fill-highlight" : "fill-primary"} /></svg></Button>)}</div>
      <div className="min-w-0"><h3 className="text-xl font-semibold mb-3 break-words">{label} vs. NASA</h3><div className="flex flex-wrap gap-4 text-xs font-mono mb-5"><span className="text-highlight">● NASA</span><span className="text-primary">● {label}</span><span className="text-muted-foreground">1 = höchste / 15 = niedrigste Priorität</span></div>
        {moonCrashItems.map((item, i) => <div key={item} className="py-4 border-b border-border"><div className="flex justify-between gap-3 text-sm"><span>{item}</span><span className="font-mono shrink-0 text-primary">Δ {ranking ? Math.abs(ranking[i] - reference[i]) : "—"}</span></div><svg viewBox="0 0 480 36" className="w-full h-12 mt-2" role="img" aria-label={`${item}: NASA Rang ${reference[i]}, ${label} Rang ${ranking?.[i] ?? "nicht abgegeben"}`}><line x1="16" x2="464" y1="18" y2="18" className="stroke-border" strokeWidth="2" />{Array.from({ length: 15 }, (_, r) => <line key={r} x1={16 + r * 32} x2={16 + r * 32} y1="14" y2="22" className="stroke-border" />)}{ranking && <line x1={16 + (reference[i] - 1) * 32} x2={16 + (ranking[i] - 1) * 32} y1="18" y2="18" className="stroke-primary" strokeWidth="3" />}<circle cx={16 + (reference[i] - 1) * 32} cy="18" r="6" className="fill-highlight" />{ranking && <circle cx={16 + (ranking[i] - 1) * 32} cy="18" r="9" fill="none" className="stroke-primary" strokeWidth="2" />}</svg><div className="flex gap-4 font-mono text-xs"><span className="text-highlight">NASA {reference[i]}</span><span className="text-primary">{label} {ranking?.[i] ?? "—"}</span></div><p className="text-xs leading-relaxed text-muted-foreground mt-2">{explanations?.[i]}</p></div>)}
      </div>
    </div><p className="mt-8 text-xs leading-relaxed text-muted-foreground">Historische Lernübung, keine aktuelle Überlebensanweisung. Quelle: <a href="https://starchild.gsfc.nasa.gov/docs/StarChild/space_level2/problems_space_solution.html" target="_blank" rel="noreferrer" className="text-highlight underline">NASA StarChild</a>.</p>
  </section>;
}