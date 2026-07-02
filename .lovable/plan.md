# Syndicate — Turn-Based Cyberpunk Strategy Game (KI Lab)

A new AI Lab game: a fully fictional, board-game-style "criminal fortune" race against 5 AI rivals. Entirely in English (game content), integrated into the existing KI Lab like WCST.

## Concept & Rules

- 10 rounds. All players start with **$100,000**. Richest survivor wins.
- **3 Investigation Tokens** per player: landing on "Caught" removes one token; elimination only happens at 0 tokens (keeps comebacks + late-game tension, per the design suggestion).
- Each round the human picks **one** operation → cost is deducted → the **Risk Wheel** spins → outcome applied. Then all 5 AI players resolve automatically → scoreboard → next round.
- Purely luck + strategy. No real-world hacking guidance; all names/flavor are invented and game-like.

## Operations (12, fictional)

Each has name, flavor text, cost, potential payout, detection risk (Low/Medium/High/Very High). Examples: Phantom Phish, Identity Fraud, Ghost Skimmer (Low), Velvet Con, Luxury Scam, Locked Vault (Medium), Rug Pull Royale, Dark Marketplace, Inside Job (High), Vault Heist, Casino Laundromat, Syndicate Takeover (Very High). Costs scale $4k → $110k, payouts $9k → $320k.

## Risk Wheel (visual centerpiece)

- Large animated SVG wheel, smooth spin, tick + win/lose sounds.
- Segments: Safe (x3), Success, Big Success, Bonus, Investigation, Caught.
- **Caught slice size scales with risk**: Low 5% · Medium 15% · High 30% · Very High 45% (further scaled by the active global event).
- Outcomes: Safe = investment recovered · Success = full payout · Big Success = 1.8x · Bonus = 1.3x · Investigation = partial recovery + suspense (no elimination) · Caught = lose a token / eliminate at 0.

## AI Opponents (5 personalities)

Vex (Conservative), Nyx (Risk Taker), Mammon (Greedy), Echo (Adaptive — reacts to ranking), Glitch (Chaotic). Each picks an affordable operation per its strategy, then resolves on the same weighted wheel logic.

## Global Random Events

Every 2–3 rounds a global event hits everyone: International Cooperation (+risk), Budget Cuts (−risk), Economic Boom (+profit), Crypto Crash (−big profit), Media Distraction (−risk/+profit).

## Game Flow / UI

Welcome → enter name → round intro (shows any event) → choose operation → spin wheel → outcome animation → AI turns → animated scoreboard (money, rank, tokens, rounds survived; eliminated players stay visible with red "CAUGHT") → next round → Winner screen (Champion, Final Fortune, Rounds Survived, Biggest Single Win, Operations Completed, Play Again).

- Modern cyberpunk dark UI, neon accents, animated background, round progress bar, animated money counter, player avatars, small win celebrations, mute button.
- Responsive, mobile-friendly.

## Sound

Self-contained Web Audio (no assets): subtle ambient bed, wheel tick, win/big-win, lose/caught, round transition, plus a mute toggle. Same pattern as the existing WCST sound engine.

## Files

- `src/data/syndicateData.ts` — operations, AI profiles, events, wheel builder, payout math, constants.
- `src/lib/syndicateSounds.ts` — Web Audio sound engine.
- `src/pages/Syndicate.tsx` — full game (state machine, wheel, scoreboard, screens), accepts `embedded` prop like WCST.

## Integration (mirrors WCST wiring)

- Lazy-import `Syndicate` in `src/pages/ChatView.tsx`; add render branch for `activeService === 'syndicate-game'`.
- Add a KI Lab arcade button (Gamepad/skull icon) with a "Neu" badge via `AI_TOOL_ADDED_AT`.
- Add i18n keys `syndicateTitle` / `syndicateDesc` to `de.ts` / `en.ts` / `fr.ts` (button chrome trilingual; the game itself stays fully English).
- Optional direct route `/syndicate` in `App.tsx`.

## Future Expansion Hooks

Clean, typed data structures + a phase-based state machine so online multiplayer, tournament mode, operation packs, achievements, daily challenges, themes, stats dashboard, and difficulty levels can be layered on later.

## Notes / Constraints

- No backend needed (client-side, no persistence) — matches the Zero-Retention style of the other lab games.
- Game text 100% English per request; only the launcher tile label is translated to fit the trilingual nav.
