import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { reference, explanations, scoreRanking, winningSlots } from "../_shared/moonCrash.ts";
import { MAX_PARTICIPANTS, isRanking } from "../_shared/moonCrashValidation.ts";

const rankingSchema = z.array(z.number()).refine(isRanking);

const name = z.string().trim().min(1).max(60);
const code = z.string().regex(/^[A-Z0-9]{12}$/);
const token = z.string().regex(/^[a-f0-9]{64}$/);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), title: name, names: z.array(name).min(1).max(MAX_PARTICIPANTS) }),
  z.object({ action: z.literal("latest") }),
  z.object({ action: z.literal("status"), code, token: token.optional(), slot: z.number().int().min(1).max(15).optional() }),
  z.object({ action: z.literal("claim"), code, slot: z.number().int().min(1).max(15) }),
  z.object({ action: z.literal("submit"), code, slot: z.number().int().min(1).max(15), token, ranking: rankingSchema }),
  z.object({ action: z.literal("reveal"), code, token }),
  z.object({ action: z.literal("group"), code, token, ranking: rankingSchema }),
]);
const makeToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
}
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Nur POST ist erlaubt." }, 405);
  try {
    if (Number(req.headers.get("content-length") || 0) > 12000) return response({ error: "Eingabe zu groß." }, 400);
    const raw = await req.text();
    if (raw.length > 12000) return response({ error: "Eingabe zu groß." }, 400);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return response({ error: "Eingaben prüfen: Namen und eindeutige Ränge von 1 bis 15 erforderlich." }, 400);
    const body = parsed.data;
    const db = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    if (body.action === "create") {
      const trainerToken = makeToken();
      const joinCode = makeToken().slice(0, 12).toUpperCase();
      const { data: session, error } = await db.from("moon_crash_sessions").insert({ code: joinCode, trainer_hash: await hash(trainerToken), title: body.title }).select("id").single();
      if (error || !session) throw new Error("create");
      const { error: peopleError } = await db.from("moon_crash_participants").insert(body.names.map((person, index) => ({ session_id: session.id, slot: index + 1, name: person })));
      if (peopleError) {
        await db.from("moon_crash_sessions").delete().eq("id", session.id);
        throw new Error("participants");
      }
      return response({ code: joinCode, token: trainerToken });
    }
    if (body.action === "latest") {
      const { data } = await db.from("moon_crash_sessions").select("code").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!data) return response({ error: "Noch keine Sitzung gestartet. Bitte auf die Übungsleitung warten." }, 404);
      return response({ code: data.code });
    }
    const { data: session, error } = await db.from("moon_crash_sessions").select("*").eq("code", body.code).single();
    if (error || !session) return response({ error: "Sitzung nicht gefunden. Sitzungscode prüfen." }, 404);
    if (body.action === "claim") {
      const participantToken = makeToken();
      const { data, error: claimError } = await db.rpc("moon_crash_claim", { p_session: session.id, p_slot: body.slot, p_hash: await hash(participantToken) });
      if (claimError) throw new Error("claim");
      if (!data) return response({ error: "Dieser Platz ist bereits belegt oder die Auswertung ist freigegeben." }, 409);
      return response({ token: participantToken });
    }
    if (body.action === "submit") {
      const { data, error: submitError } = await db.rpc("moon_crash_submit", { p_session: session.id, p_slot: body.slot, p_hash: await hash(body.token), p_ranking: body.ranking });
      if (submitError) throw new Error("submit");
      if (!data) return response({ error: "Speichern nicht möglich: Platz nicht autorisiert oder Auswertung bereits freigegeben." }, 409);
      return response({ saved: true });
    }
    const trainer = body.token ? await hash(body.token) === session.trainer_hash : false;
    if (body.action === "reveal" || body.action === "group") {
      if (!trainer) return response({ error: "Nur die Übungsleitung kann die Auswertung freigeben." }, 403);
      const { data: saved, error: revealError } = await db.rpc("moon_crash_trainer_action", { p_session: session.id, p_hash: await hash(body.token), p_ranking: body.action === "group" ? body.ranking : null, p_reveal: body.action === "reveal" });
      if (revealError) throw new Error("reveal");
      if (!saved) return response({ error: "Aktion nicht möglich: Auswertung bereits freigegeben oder noch keine Abgabe vorhanden." }, 409);
      if (body.action === "reveal") session.revealed = true;
      else session.group_ranking = body.ranking;
    }
    const { data: people, error: peopleError } = await db.from("moon_crash_participants").select("*").eq("session_id", session.id).order("slot");
    if (peopleError || !people) throw new Error("status");
    const suppliedHash = body.token ? await hash(body.token) : "";
    return response({ code: session.code, title: session.title, revealed: session.revealed, trainer,
      participants: people.map(p => ({ slot: p.slot, name: p.name, claimed: Boolean(p.token_hash), submitted: Boolean(p.submitted_at),
        ranking: session.revealed || (body.action === "status" && p.slot === body.slot && p.token_hash === suppliedHash) ? p.ranking : null,
        score: session.revealed && p.ranking ? scoreRanking(p.ranking) : null,
      })),
      reference: session.revealed ? reference : null,
      explanations: session.revealed ? explanations : null,
      groupRanking: session.revealed || trainer ? session.group_ranking : null,
      groupScore: session.revealed && session.group_ranking ? scoreRanking(session.group_ranking) : null,
      winnerSlots: session.revealed ? winningSlots(people.map(p => ({ slot: p.slot, score: p.ranking ? scoreRanking(p.ranking) : null }))) : [],
    });
  } catch (error) {
    if (error instanceof SyntaxError) return response({ error: "Ungültige Eingabe." }, 400);
    return response({ error: "Sitzung konnte nicht verarbeitet werden. Bitte erneut versuchen." }, 500);
  }
});