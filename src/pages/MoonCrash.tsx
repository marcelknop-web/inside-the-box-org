import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Check, Copy, Users, LockKeyhole, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { moonCrashItems } from "@/data/moonCrashItems";
import { isRanking } from "../../supabase/functions/_shared/moonCrashValidation";
import { RankingInput } from "@/components/moonCrash/RankingInput";
import { MoonCrashResults } from "@/components/moonCrash/Results";
import lunarImage from "@/assets/moon-crash.jpg";

type Person = { slot: number; name: string; claimed: boolean; submitted: boolean; ranking: number[] | null; score: number | null };
type Session = { code: string; title: string; revealed: boolean; trainer: boolean; participants: Person[]; reference: number[] | null; explanations: string[] | null; groupRanking: number[] | null; groupScore: number | null; winnerSlots: number[] };
type Credentials = { token: string; slot?: number };
const setupSchema = z.object({ title: z.string().trim().min(1).max(60), names: z.array(z.string().trim().min(1).max(60)).min(1).max(15) });
const rankSchema = z.array(z.number()).refine(isRanking);
const toOrder = (ranking: number[]) => ranking.map((rank, i) => ({ rank, i })).sort((a, b) => a.rank - b.rank).map(p => p.i);
const toRanking = (order: number[]) => moonCrashItems.map((_, i) => order.indexOf(i) + 1);
async function request<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("moon-crash", { body });
  if (error) {
    let message = "Verbindung fehlgeschlagen. Bitte erneut versuchen.";
    if (error.context instanceof Response) { const detail = await error.context.json().catch(() => null); if (detail?.error) message = detail.error; }
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
  const [role, setRole] = useState<"trainer" | number | null>(null);
  const [setupRole, setSetupRole] = useState<"trainer" | "participant" | null>(null);
  const [title, setTitle] = useState("Moon Crash · Crew 01");
  const [count, setCount] = useState(15);
  const [names, setNames] = useState(Array.from({ length: 15 }, (_, i) => `Teilnehmer ${String(i + 1).padStart(2, "0")}`));
  const [joinCode, setJoinCode] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [groupOrder, setGroupOrder] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setSession(null); setRole(null); setCredentials(null); setOrder([]); setGroupOrder([]); setNotice(""); setError("");
    try {
      const legacy = JSON.parse(localStorage.getItem(`moon-crash:${code}`) || "null") as Credentials | null;
      if (legacy) localStorage.setItem(`moon-crash:${code}:${legacy.slot ?? "trainer"}`, JSON.stringify(legacy));
    } catch { /* Ignore invalid stored credentials. */ }
  }, [code]);
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const refresh = async () => {
      try { const next = await request<Session>({ action: "status", code, ...credentials }); if (!cancelled) { setSession(next); setError(""); } }
      catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Verbindung fehlgeschlagen."); }
    };
    void refresh(); const interval = setInterval(refresh, 4000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [code, credentials]);
  const own = session?.participants.find(p => p.slot === credentials?.slot);
  useEffect(() => { if (own?.ranking) setOrder(toOrder(own.ranking)); }, [own?.ranking?.join(",")]);
  useEffect(() => { if (session?.groupRanking) setGroupOrder(toOrder(session.groupRanking)); }, [session?.groupRanking?.join(",")]);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Bitte erneut versuchen."); } finally { setBusy(false); }
  }
  function stored(nextRole: "trainer" | number): Credentials | null {
    try { return JSON.parse(localStorage.getItem(`moon-crash:${code}:${nextRole}`) || "null"); } catch { return null; }
  }
  async function chooseRole(nextRole: "trainer" | number) {
    setError(""); setNotice("");
    if (nextRole === role) return;
    const access = stored(nextRole);
    if (access) { setSession(null); setOrder([]); setGroupOrder([]); setCredentials(access); setRole(nextRole); return; }
    if (nextRole === "trainer") { setError("Trainerzugang ist nur im Browser der Sitzungserstellung verfügbar."); return; }
    await run(async () => {
      const result = await request<{ token: string }>({ action: "claim", code, slot: nextRole });
      const next = { token: result.token, slot: nextRole };
      localStorage.setItem(`moon-crash:${code}:${nextRole}`, JSON.stringify(next));
      setSession(null); setOrder([]); setGroupOrder([]); setCredentials(next); setRole(nextRole);
    });
  }
  async function create() {
    const parsed = setupSchema.safeParse({ title, names: names.slice(0, count) });
    if (!parsed.success) { setError("Titel und Namen ausfüllen. Für 1 bis 15 Personen."); return; }
    await run(async () => {
      const result = await request<{ code: string; token: string }>({ action: "create", ...parsed.data });
      localStorage.setItem(`moon-crash:${result.code}:trainer`, JSON.stringify({ token: result.token }));
      setParams({ session: result.code });
    });
  }
  const submitted = session?.participants.filter(p => p.submitted).length ?? 0;
  const participantLink = `${window.location.origin}/moon-crash?session=${code}`;
  return <div className="min-h-dvh bg-background text-foreground">
    <Helmet><html lang="de" /><title>Moon Crash · inside-the-box.org</title><meta name="description" content="Moon-Crash-Übung für bis zu 15 Personen: individuelle Prioritäten, Gruppenlösung und trainergeführte NASA-Auswertung." /><meta property="og:title" content="Moon Crash · Die Weisheit der Vielen" /><meta property="og:description" content="Gemeinsame Mondmission mit Einzel- und Gruppenbewertungen." /><meta property="og:type" content="website" /><meta name="twitter:card" content="summary" /></Helmet>
    <header className="border-b border-border"><div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-3"><Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />inside-the-box</Link><span className="font-mono text-xs text-highlight break-all">MOON CRASH{code ? ` / ${code}` : ""}</span></div></header>
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <section className="grid lg:grid-cols-[1fr_1.1fr] gap-6 items-center py-7 border-b border-border"><div><p className="text-primary font-mono text-xs mb-3">DIE WEISHEIT DER VIELEN</p><h1 className="text-4xl font-semibold mb-4">Moon Crash</h1><p className="text-foreground/80 leading-relaxed max-w-lg">Notlandung auf der sonnenbeschienenen Seite des Mondes. Das Mutterschiff ist <strong className="text-primary">320 km</strong> entfernt. <strong>15 Gegenstände</strong> bleiben für den Weg zurück.</p></div><img src={lunarImage} alt="Mondlandefähre und Astronauten auf der Mondoberfläche" width={1536} height={768} fetchPriority="high" className="w-full aspect-[2/1] object-cover rounded-md" /></section>
      {error && <p role="alert" className="my-5 border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm">{error}</p>}
      {notice && <p role="status" className="my-5 text-highlight text-sm">{notice}</p>}
      {!code ? <section className="py-8"><h2 className="text-2xl font-semibold mb-5">Teilnahme oder Trainer</h2><div className="flex gap-3 mb-7"><Button variant={setupRole === "participant" ? "default" : "secondary"} onClick={() => setSetupRole("participant")}><Users />Teilnehmen</Button><Button variant={setupRole === "trainer" ? "default" : "secondary"} onClick={() => setSetupRole("trainer")}><LockKeyhole />Trainer</Button></div>
        {setupRole === "participant" && <div className="max-w-md"><label className="text-sm">Sitzungscode<input aria-label="Sitzungscode" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().trim())} maxLength={12} className="mt-2 w-full h-11 rounded-md border border-input bg-card px-3 font-mono" /></label><Button className="mt-4" disabled={!/^[A-Z0-9]{12}$/.test(joinCode)} onClick={() => setParams({ session: joinCode })}><Users />Crew öffnen</Button></div>}
        {setupRole === "trainer" && <div><h3 className="text-xl font-semibold mb-5">Crew zusammenstellen</h3><div className="grid sm:grid-cols-[1fr_140px] gap-4 mb-6"><label className="text-sm">Sitzungstitel<input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} className="mt-2 w-full h-11 rounded-md border border-input bg-card px-3" /></label><label className="text-sm">Personen<select aria-label="Anzahl Teilnehmende" value={count} onChange={e => setCount(Number(e.target.value))} className="mt-2 w-full h-11 rounded-md border border-input bg-card px-3">{Array.from({ length: 15 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label></div><div className="grid sm:grid-cols-3 gap-3">{names.slice(0, count).map((name, i) => <label key={i} className="text-xs text-muted-foreground">PERSON {String(i + 1).padStart(2, "0")}<input aria-label={`Name ${i + 1}`} value={name} maxLength={60} onChange={e => setNames(old => old.map((n, j) => i === j ? e.target.value : n))} className="mt-1.5 w-full h-11 rounded-md border border-input bg-card px-3 text-foreground text-base" /></label>)}</div><Button onClick={create} disabled={busy} className="mt-6" size="lg">{busy ? <Loader2 className="animate-spin" /> : <Rocket />}Sitzung starten</Button></div>}
        <p className="mt-6 text-xs text-muted-foreground max-w-xl leading-relaxed">Teilnahme ohne Konto. Namen und Rangfolgen werden für die Sitzung gespeichert. Wer den Link hat, kann einen freien Platz wählen. Anzeigenamen oder Kürzel reichen aus.</p>
      </section> : !session ? <div className="py-10 flex gap-3 items-center"><Loader2 className="animate-spin size-5" />Sitzung wird geladen …<Button variant="ghost" onClick={() => setParams({})}>Zurück</Button></div> : <>
        <section className="py-7 border-b border-border"><div className="flex flex-wrap justify-between gap-4"><h2 className="text-2xl font-semibold">{session.title}</h2><span className="font-mono text-highlight">{submitted} / {session.participants.length} abgegeben</span></div>
          <div className="mt-5 flex flex-wrap gap-3"><Button variant={role === "trainer" ? "default" : "secondary"} disabled={busy} onClick={() => chooseRole("trainer")}><LockKeyhole />Trainer</Button>{role !== null && <Button variant="ghost" onClick={() => { setSession(null); setRole(null); setCredentials(null); setOrder([]); setGroupOrder([]); setNotice(""); }}>Person wechseln</Button>}</div>
          {session.trainer && role === "trainer" && <div className="mt-4"><Button variant="secondary" onClick={() => run(async () => { await navigator.clipboard.writeText(participantLink); setNotice("Teilnahme-Link kopiert."); })}><Copy />Teilnahme-Link kopieren</Button><p className="font-mono text-sm text-highlight mt-3 break-all">Sitzungscode: {code}</p><p className="text-xs text-muted-foreground mt-2">Trainerzugang bleibt in diesem Browser. Freigabe beendet alle Änderungen.</p></div>}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">{session.participants.map(person => <Button key={person.slot} variant="secondary" disabled={busy || session.revealed || (person.claimed && !stored(person.slot))} onClick={() => chooseRole(person.slot)} className={`h-auto min-h-20 flex-col items-start whitespace-normal text-left p-4 border ${role === person.slot ? "border-highlight" : "border-border"}`}><span className="font-mono text-xs text-muted-foreground flex justify-between w-full">{String(person.slot).padStart(2, "0")}{person.submitted && <Check className="text-highlight" />}</span><span className="break-words w-full">{person.name}</span><span className="text-xs text-muted-foreground">{session.revealed && person.score !== null ? `${person.score} Punkte` : person.submitted ? "Abgegeben" : person.claimed ? "In Bearbeitung" : "Platz wählen"}</span></Button>)}</div>
        </section>
        {!session.revealed && own && role === own.slot && <section className="py-8"><h2 className="text-2xl font-semibold mb-6">{own.name} · Prioritäten</h2><RankingInput order={order} onChange={setOrder} disabled={busy} /><Button disabled={busy || order.length !== 15} className="mt-6" onClick={() => run(async () => { const ranking = toRanking(order); rankSchema.parse(ranking); await request({ action: "submit", code, ...credentials, ranking }); setSession(await request<Session>({ action: "status", code, ...credentials })); setNotice("Rangfolge gespeichert. Ergebnisse folgen nach Trainerfreigabe."); })}><Check />{own.submitted ? "Änderungen speichern" : "Rangfolge abgeben"}</Button></section>}
        {!session.revealed && session.trainer && role === "trainer" && <section className="py-8"><div className="flex flex-wrap justify-between gap-4 border-b border-border pb-6 mb-6"><div><h2 className="text-2xl font-semibold">Trainer · Auswertung</h2><p className="mt-2 text-sm text-muted-foreground">{submitted} von {session.participants.length} Einzelwertungen abgegeben</p></div><Button disabled={busy || submitted === 0} onClick={() => { const missing = session.participants.length - submitted; if (!window.confirm(`${missing ? `${missing} Personen haben noch nicht abgegeben. ` : ""}${!session.groupRanking ? "Keine Gruppenlösung gespeichert. " : ""}NASA-Lösung und Ergebnisse endgültig für alle freigeben?`)) return; void run(async () => { setSession(await request<Session>({ action: "reveal", code, token: credentials?.token })); }); }}><LockKeyhole />Ergebnisse freigeben</Button></div><h3 className="text-xl font-semibold mb-2">Gemeinsame Gruppenlösung</h3><p className="text-sm text-muted-foreground mb-6">Die gemeinsam vereinbarte Rangfolge · optional vor der Freigabe</p><RankingInput order={groupOrder} onChange={setGroupOrder} disabled={busy} /><Button disabled={busy || groupOrder.length !== 15} className="mt-6" onClick={() => run(async () => { const ranking = toRanking(groupOrder); rankSchema.parse(ranking); setSession(await request<Session>({ action: "group", code, token: credentials?.token, ranking })); setNotice("Gruppenlösung gespeichert."); })}><Users />Gruppenlösung speichern</Button></section>}
        {!session.revealed && role === null && <p className="py-7 text-muted-foreground">Person 01–{String(session.participants.length).padStart(2, "0")} oder Trainer auswählen.</p>}
        {session.revealed && session.reference && <MoonCrashResults participants={session.participants} reference={session.reference} explanations={session.explanations} groupRanking={session.groupRanking} groupScore={session.groupScore} winnerSlots={session.winnerSlots} />}
      </>}
    </main>
  </div>;
}
