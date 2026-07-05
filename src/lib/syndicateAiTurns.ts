/* ------------------------------------------------------------------ */
/*  Syndicate — AI turn orchestration (pure, testable).                 */
/*                                                                      */
/*  Timing contract: rival results are PLANNED up front (so every       */
/*  rival decides against the same pre-round standings) but the cash    */
/*  changes are NOT applied to the shared standings during planning.    */
/*  Each rival's result is only committed once their wheel has          */
/*  resolved on screen — see commitAiTurn. This keeps the financial     */
/*  chart from revealing outcomes before the attack plays out.          */
/* ------------------------------------------------------------------ */

/** Minimum shape planAiTurns needs to rank + iterate players. */
export interface RankablePlayer {
  id: string;
  isHuman: boolean;
  alive: boolean;
  cash: number;
}

/** A planned rival turn always carries a post-turn snapshot of its player. */
export interface PlannedTurn<P> {
  player: P;
}

/**
 * Plan every alive rival's turn against the current (pre-round) standings.
 *
 * The returned `standings` is the SAME array reference that was passed in —
 * planning deliberately does not mutate or re-create player state. Only the
 * `turns` carry the post-turn snapshots, which are committed later, one at a
 * time, via commitAiTurn once each wheel resolves.
 */
export function planAiTurns<P extends RankablePlayer, T extends PlannedTurn<P>>(
  players: P[],
  makeTurn: (player: P, rankFrac: number) => T | null
): { turns: T[]; standings: P[] } {
  const alive = players.filter((p) => p.alive);
  const sorted = [...alive].sort((a, b) => b.cash - a.cash);
  const rankFrac = (p: P) => {
    const idx = sorted.findIndex((x) => x.id === p.id);
    return sorted.length > 1 ? idx / (sorted.length - 1) : 0;
  };
  const turns: T[] = [];
  for (const p of players) {
    if (p.isHuman || !p.alive) continue;
    const t = makeTurn(p, rankFrac(p));
    if (t) turns.push(t);
  }
  // standings intentionally unchanged — results are not applied yet.
  return { turns, standings: players };
}

/**
 * Commit a single planned turn into the standings. Called only after that
 * rival's wheel has landed, so the standings update in sync with the reveal.
 */
export function commitAiTurn<P extends { id: string }>(
  players: P[],
  turn: PlannedTurn<P>
): P[] {
  return players.map((p) => (p.id === turn.player.id ? turn.player : p));
}
