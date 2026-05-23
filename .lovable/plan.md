## Blind Spot — OT Crisis Simulator

New single-player TTX app at route `/blind-spot`, following the project's existing tech-atelier patterns (dark bg, gold #f5b800 accent, DM Sans / IBM Plex Mono, Edge Function for AI).

### Important deviation from prompt
You asked for Anthropic Claude API called from the frontend. Per project standards I'll use the **Lovable AI Gateway** (anonymous, no key needed, already wired everywhere else) via a new Edge Function `blind-spot-chat`. Model: `google/gemini-2.5-flash` (fast, in-character role play). Same behavior, no API key setup, no frontend secret exposure. Tell me if you want Claude specifically — that needs an `ANTHROPIC_API_KEY` secret + different edge function.

### Build steps

1. **Edge Function** `supabase/functions/blind-spot-chat/index.ts`
   - Accepts `{ role, phase, situation, userRole, userInput, history }`
   - Builds role-specific system prompt (IT-Ops / OT-Ops / IC / Mgmt-Comms variants)
   - Calls Lovable AI Gateway, returns assistant text
   - Handles 429/402 with user-facing errors
   - `verify_jwt = false` in `config.toml`

2. **Scenario data** `src/data/blindSpotScenario.ts`
   - 4 roles with descriptions
   - 4 phases (T+0 / T+45 / T+90 / T+4h) with situation text, color, IC question, IEC 62443 / NIS-2 refs
   - Network zone table, company facts

3. **Page** `src/pages/BlindSpotSimulator.tsx` — state machine driving all 12 screens:
   - `welcome` → `roleSelect` → `briefing` → per phase (`inject` → `decision`) ×4 → `debrief`
   - Session state: chosen role, decision log `[{phase, choice, reasoning, timestamp}]`, full message history per AI role for context coherence
   - PDF debrief uses existing `pdfCore.ts` pattern (windows-1252 safe)

4. **Components** (in `src/components/blindSpot/`):
   - `PhaseProgress.tsx` — top 1→2→3→4→Debrief dots, amber for current
   - `RoleCard.tsx` — 2×2 grid card
   - `AiRolePanel.tsx` — role label, icon, streaming/loading shimmer (pulsing gold border), markdown body
   - `DecisionBox.tsx` — Yes/No/Conditional + reasoning OR AI-IC display with Accept/Push back

5. **Route** in `src/App.tsx`: lazy `/blind-spot`, no nav link (matches `/iacs-ur26` pattern). No password gate unless you want one.

6. **Design**: `bg-background/40` panels, IBM Plex Mono for timestamps/zone tables/phase badges, DM Sans for prose. Phase color coding via tailwind classes mapped from scenario data. Mobile single-column.

### Out of scope (call out if needed)
- i18n (DE/EN/FR) — content is English-only per scenario; can add later
- No persistence (ephemeral session as you specified)
- No analytics / leaderboard
