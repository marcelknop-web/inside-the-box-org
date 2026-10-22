import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowUp, ArrowDown, Check, Copy, Users, LockKeyhole, Rocket, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { moonCrashItems } from "@/data/moonCrashItems";
import { isRanking } from "../../supabase/functions/_shared/moonCrashValidation";
import lunarImage from "@/assets/moon-crash.jpg";

type Person = { slot: number; name: string; claimed: boolean; submitted: boolean; ranking: number[] | null; score: number | null };
type Session = { code: string; title: string; revealed: boolean; trainer: boolean; participants: Person[]; reference: number[] | null; explanations: string[] | null };
type Credentials = { token: string; slot?: number };
const setupSchema = z.object({ title: z.string().trim().min(1).max(60), names: z.array(z.string().trim().min(1).max(60)).min(1).max(15) });
const rankSchema = z.array(z.number()).refine(isRanking);

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("moon-crash", { body });
  if (error) {
    let message = "Verbindung fehlgeschlagen. Bitte erneut versuchen.";
    if (error.context instanceof Response) {
      const detail = await error.context.json().catch(() => null);
      if (detail?.error) message = detail.error;
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export default function MoonCrash() {
  const [params, setParams] = useSearchParams();
  const code = (params.get("session") || "").toUpperCase();
  const [session, setSession] = useState<Session | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [title, setTitle] = useState("Moon Crash · Crew 01");
  const [count, setCount] = useState(15);
  const [names, setNames] = useState(Array.from({ length: 15 }, (_, i) => `Teilnehmer ${String(i + 1).padStart(2, "0")}`));
  const [joinCode, setJoinCode] = useState("");
  const [order, setOrder] = useState(moonCrashItems.map((_, i) => i));
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSession(null); setSelected(null); setNotice("");
    try { setCredentials(JSON.parse(localStorage.getItem(`moon-crash:${code}`) || "null")); }
    catch { setCredentials(null); }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const next = await request<Session>({ action: "status", code, ...credentials });
        if (!cancelled) { setSession(next); setError(""); }
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Verbindung fehlgeschlagen."); }
    };
    void refresh();
    const interval = setInterval(refresh, 4000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [code, credentials]);

  const own = session?.participants.find(p => p.slot === credentials?.slot);
  useEffect(() => {
    if (own?.ranking) setOrder(own.ranking.map((rank, i) => ({ rank, i })).sort((a, b) => a.rank - b.rank).map(item => item.i));
  }, [own?.ranking?.join(",")]);

  function remember(nextCode: string, next: Credentials) {
    localStorage.setItem(`moon-crash:${nextCode}`, JSON.stringify(next));
    setCredentials(next);
  }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Bitte erneut versuchen."); }
    finally { setBusy(false); }
  }
  async function create() {
    const parsed = setupSchema.safeParse({ title, names: names.slice(0, count) });
    if (!parsed.success) { setError("Sitzungstitel und alle Namen ausfüllen (maximal 60 Zeichen). Für 1 bis 15 Personen."); return; }
    await run(async () => {
      const result = await request<{ code: string; token: string }>({ action: "create", ...parsed.data });
      remember(result.code, { token: result.token });
      setParams({ session: result.code });
    });
  }
  async function claim(slot: number) {
    await run(async () => {
      const result = await request<{ token: string }>({ action: "claim", code, slot });
      remember(code, { token: result.token, slot });
      setOrder(moonCrashItems.map((_, i) => i));
    });
  }
  function move(index: number, target: number) {
    setOrder(previous => { const next = [...previous]; const [item] = next.splice(index, 1); next.splice(target, 0, item); return next; });
  }
  const submitted = session?.participants.filter(p => p.submitted).length || 0;
  const resultPerson = session?.participants.find(p => p.slot === (selected ?? credentials?.slot)) || session?.participants.find(p => p.submitted);
  const resultRanking = resultPerson?.ranking;
  const reference = session?.reference;
  const participantLink = `${window.location.origin}/moon-crash?session=${code}`;

  return <div className="min-h-dvh bg-background text-foreground">
    <Helmet><html lang="de" /><title>Moon Crash · inside-the-box.org</title><meta name="description" content="Moon-Crash-Übung für bis zu 15 Personen: individuelle Rangfolgen, NASA-Musterlösung und gemeinsame Auswertung." /><meta property="og:title" content="Moon Crash · Die Weisheit der Vielen" /><meta property="og:description" content="Gemeinsame Mondmission mit individuellen Bewertungen und NASA-Auswertung." /><meta property="og:type" content="website" /><meta name="twitter:card" content="summary" /></Helmet>
    <header className="border-b border-border"><div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-3"><Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />inside-the-box</Link><span className="font-mono text-xs text-highlight">MISSION CONTROL{code ? ` / ${code}` : " / MOON CRASH"}</span></div></header>
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <section className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-center py-8 border-b border-border">
        <div><p className="text-primary font-mono text-xs mb-3">DIE WEISHEIT DER VIELEN</p><h1 className="text-4xl sm:text-5xl font-semibold mb-4">Moon Crash</h1><p className="text-foreground/80 leading-relaxed max-w-lg">Notlandung auf der sonnenbeschienenen Seite des Mondes. Die Crew hat überlebt. Das Mutterschiff ist <strong className="text-primary">320 km</strong> entfernt. Nur <strong>15 Gegenstände</strong> konnten geborgen werden.</p><div className="flex flex-wrap gap-6 mt-5 font-mono text-xs text-muted-foreground"><span>01 / PRIORISIEREN</span><span>02 / VERGLEICHEN</span><span>03 / REFLEKTIEREN</span></div></div>
        <img src={lunarImage} alt="Mondlandefähre und zwei Astronauten auf der sonnenbeschienenen Mondoberfläche" width={1536} height={768} fetchPriority="high" className="w-full aspect-[2/1] object-cover rounded-md" />
      </section>
      {error && <p role="alert" className="my-5 border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm">{error}</p>}
      {notice && <p role="status" className="my-5 text-highlight text-sm">{notice}</p>}
      {!code ? <section className="py-8 grid lg:grid-cols-[1fr_320px] gap-10">
        <div><h2 className="text-2xl font-semibold mb-5">Crew zusammenstellen</h2><div className="grid sm:grid-cols-[1fr_140px] gap-4 mb-6"><label className="text-sm">Sitzungstitel<input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} className="mt-2 w-full h-11 rounded-md border border-input bg-card px-3" /></label><label className="text-sm">Personen<select aria-label="Anzahl Teilnehmende" value={count} onChange={e => setCount(Number(e.target.value))} className="mt-2 w-full h-11 rounded-md border border-input bg-card px-3">{Array.from({ length: 15 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label></div>
        <div className="grid sm:grid-cols-3 gap-3">{names.slice(0, count).map((person, i) => <label key={i} className="text-xs text-muted-foreground">PERSON {String(i + 1).padStart(2, "0")}<input aria-label={`Name ${i + 1}`} value={person} maxLength={60} onChange={e => setNames(old => old.map((n, j) => i === j ? e.target.value : n))} className="mt-1.5 w-full h-11 rounded-md border border-input bg-card px-3 text-foreground text-base" /></label>)}</div>
        <Button onClick={create} disabled={busy} className="mt-6" size="lg">{busy ? <Loader2 className="animate-spin" /> : <Rocket />}Sitzung starten</Button></div>
        <aside className="border-l border-border pl-6"><h2 className="text-xl mb-4">An Sitzung teilnehmen</h2><label className="text-sm">Sitzungscode<input aria-label="Sitzungscode" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={12} className="mt-2 w-full h-11 rounded-md border border-input bg-card px-3 font-mono" /></label><Button variant="secondary" className="mt-4" disabled={!/^[A-Z0-9]{12}$/.test(joinCode)} onClick={() => setParams({ session: joinCode })}><Users />Crew öffnen</Button><p className="mt-8 text-xs leading-relaxed text-muted-foreground">Namen und Rangfolgen werden für diese gemeinsame Sitzung gespeichert. Teilnahme ohne Konto. Wer den Link hat, kann einen freien Platz wählen. Anzeigenamen oder Kürzel reichen aus.</p></aside>
      </section> : !session ? <div className="py-10 flex gap-3 items-center"><Loader2 className="animate-spin size-5" />Sitzung wird geladen …<Button variant="ghost" onClick={() => setParams({})}>Zurück</Button></div> : <>
        <section className="py-7 border-b border-border"><div className="flex flex-wrap justify-between items-center gap-4"><div><p className="text-xs font-mono text-muted-foreground mb-2">{session.trainer ? "ÜBUNGSLEITUNG" : "CREW"}</p><h2 className="text-2xl font-semibold">{session.title}</h2></div><span className="font-mono text-highlight">{submitted} / {session.participants.length} abgegeben</span></div>
        {session.trainer && <div className="mt-5 flex flex-wrap gap-3 items-center"><Button variant="secondary" onClick={() => run(async () => { await navigator.clipboard.writeText(participantLink); setNotice("Teilnahme-Link kopiert."); })}><Copy />Teilnahme-Link kopieren</Button><Button disabled={busy || session.revealed || submitted === 0} onClick={() => { if (submitted < session.participants.length && !window.confirm(`${session.participants.length - submitted} Personen haben noch nicht abgegeben. Trotzdem endgültig freigeben?`)) return; void run(async () => { const next = await request<Session>({ action: "reveal", code, token: credentials?.token }); setSession(next); }); }}><LockKeyhole />{session.revealed ? "Auswertung freigegeben" : "NASA-Lösung freigeben"}</Button><p className="text-xs text-muted-foreground basis-full">Der Trainerzugang bleibt in diesem Browser gespeichert. Nach Freigabe sind keine Änderungen mehr möglich.</p></div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">{session.participants.map(person => <Button key={person.slot} variant="secondary" disabled={busy || (!session.revealed && !session.trainer && Boolean(credentials?.slot || person.claimed))} onClick={() => { if (session.revealed || session.trainer) setSelected(person.slot); else void claim(person.slot); }} className={`h-auto min-h-20 flex-col items-start whitespace-normal text-left p-4 border ${selected === person.slot || own?.slot === person.slot ? "border-highlight" : "border-border"}`}><span className="font-mono text-xs text-muted-foreground flex justify-between w-full">{String(person.slot).padStart(2, "0")}{person.submitted && <Check className="text-highlight" />}</span><span className="break-words w-full">{person.name}</span><span className="text-xs text-muted-foreground">{session.revealed && person.score !== null ? `${person.score} Abweichungspunkte` : person.submitted ? "Abgegeben" : person.claimed ? "In Bearbeitung" : "Platz wählen"}</span></Button>)}</div>
        </section>
        {!session.revealed && own && <section className="py-8 max-w-3xl"><div className="flex flex-wrap justify-between gap-3 mb-5"><h2 className="text-2xl">{own.name} · Rangfolge</h2><span className="text-xs font-mono text-highlight">1 = WICHTIGSTE / 15 = UNWICHTIGSTE</span></div><div className="divide-y divide-border border-y border-border">{order.map((item, i) => <div key={item} className="flex gap-3 items-center py-2.5"><span className="font-mono text-primary w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span><span className="flex-1 text-sm sm:text-base">{moonCrashItems[item]}</span><select aria-label={`Rang für ${moonCrashItems[item]}`} value={i + 1} onChange={e => move(i, Number(e.target.value) - 1)} className="bg-card border border-input rounded-md h-10 w-16 px-2 font-mono">{order.map((_, rank) => <option key={rank} value={rank + 1}>{rank + 1}</option>)}</select><div className="flex"><Button size="icon" variant="ghost" title="Nach oben" aria-label={`${moonCrashItems[item]} nach oben`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button><Button size="icon" variant="ghost" title="Nach unten" aria-label={`${moonCrashItems[item]} nach unten`} disabled={i === 14} onClick={() => move(i, i + 1)}><ArrowDown /></Button></div></div>)}</div><Button disabled={busy} className="mt-6" onClick={() => run(async () => { const ranking = moonCrashItems.map((_, i) => order.indexOf(i) + 1); rankSchema.parse(ranking); await request({ action: "submit", code, ...credentials, ranking }); const next = await request<Session>({ action: "status", code, ...credentials }); setSession(next); setNotice("Rangfolge gespeichert. Die Auswertung erscheint nach Freigabe durch die Übungsleitung."); })}><Check />{own.submitted ? "Änderungen speichern" : "Rangfolge abgeben"}</Button></section>}
        {!session.revealed && !own && <p className="py-7 text-muted-foreground">{session.trainer ? selected ? `${session.participants.find(p => p.slot === selected)?.name}: ${session.participants.find(p => p.slot === selected)?.submitted ? "Rangfolge abgegeben" : "Noch nicht abgegeben"}.` : "Die Crew bewertet individuell. Die Musterlösung bleibt bis zur Freigabe verborgen." : "Einen freien Platz mit dem eigenen Namen auswählen."}</p>}
        {session.revealed && reference && <section className="py-8"><div className="flex flex-wrap gap-6 justify-between items-end mb-7"><div><p className="text-highlight text-xs font-mono mb-2">MISSION DEBRIEF</p><h2 className="text-3xl">Individuelle Auswertung</h2><p className="text-muted-foreground text-sm mt-2">Summe der absoluten Rangabweichungen. Je kleiner, desto näher an der NASA-Musterlösung.</p></div><div className="text-right"><span className="text-4xl font-mono text-primary">{resultPerson?.score ?? "—"}</span><p className="text-sm mt-1">{resultPerson?.name || "Keine Abgabe"}</p></div></div>
        <div className="grid lg:grid-cols-[280px_1fr] gap-8"><div><h3 className="text-lg mb-4 flex items-center gap-2"><BarChart3 className="size-5 text-highlight" />Crew-Vergleich</h3>{[...session.participants].filter(p => p.score !== null).sort((a,b) => (a.score ?? 0) - (b.score ?? 0)).map(p => <Button key={p.slot} variant="ghost" onClick={() => setSelected(p.slot)} className="w-full justify-between mb-2 whitespace-normal text-left"><span className="break-words">{p.name}</span><span className="font-mono text-highlight shrink-0">{p.score}</span></Button>)}</div><div className="min-w-0"><div className="grid grid-cols-[1fr_45px_45px_40px] sm:grid-cols-[1fr_70px_70px_60px] text-xs text-muted-foreground font-mono border-b border-border pb-3 gap-2"><span>GEGENSTAND</span><span>CREW</span><span>NASA</span><span>Δ</span></div>{moonCrashItems.map((item, i) => <div key={item} className="py-3 border-b border-border"><div className="grid grid-cols-[1fr_45px_45px_40px] sm:grid-cols-[1fr_70px_70px_60px] gap-2 text-sm items-start"><span>{item}</span><span className="font-mono">{resultRanking?.[i] ?? "—"}</span><span className="font-mono text-highlight">{reference[i]}</span><span className={`font-mono ${resultRanking && Math.abs(resultRanking[i] - reference[i]) >= 5 ? "text-primary" : "text-muted-foreground"}`}>{resultRanking ? Math.abs(resultRanking[i] - reference[i]) : "—"}</span></div><p className="text-xs leading-relaxed text-muted-foreground mt-2 max-w-lg">{session.explanations?.[i]}</p></div>)}</div></div><p className="mt-8 text-xs leading-relaxed text-muted-foreground">Historische Lern- und Diskussionsübung, keine aktuelle Missions- oder Überlebensanweisung. Die Lösung folgt den vereinfachten Annahmen der Übung. Quelle: <a href="https://starchild.gsfc.nasa.gov/docs/StarChild/space_level2/problems_space_solution.html" target="_blank" rel="noreferrer" className="text-highlight underline">NASA StarChild</a>.</p>
        </section>}
      </>}
    </main>
  </div>;
}