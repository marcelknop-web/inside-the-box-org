import { describe, it, expect } from "vitest";
import { planAiTurns, commitAiTurn } from "@/lib/syndicateAiTurns";

interface TestPlayer {
  id: string;
  isHuman: boolean;
  alive: boolean;
  cash: number;
}

interface TestTurn {
  player: TestPlayer;
  delta: number;
}

const makePlayers = (): TestPlayer[] => [
  { id: "human", isHuman: true, alive: true, cash: 100 },
  { id: "ai-1", isHuman: false, alive: true, cash: 100 },
  { id: "ai-2", isHuman: false, alive: true, cash: 100 },
];

// Each rival's turn adds cash to a post-turn snapshot of the player.
const makeTurn = (p: TestPlayer): TestTurn => ({
  player: { ...p, cash: p.cash + 500 },
  delta: 500,
});

describe("syndicate AI turn timing", () => {
  it("does NOT apply rival results when the AI phase starts (planning)", () => {
    const players = makePlayers();
    const { turns, standings } = planAiTurns<TestPlayer, TestTurn>(
      players,
      makeTurn
    );

    // Standings are handed back unchanged — no cash lands during planning.
    expect(standings).toBe(players);
    for (const p of standings) {
      expect(p.cash).toBe(100);
    }

    // The plan exists and holds the (not-yet-applied) results.
    expect(turns).toHaveLength(2);
    expect(turns.every((t) => t.player.cash === 600)).toBe(true);

    // The human is never planned as a rival turn.
    expect(turns.some((t) => t.player.isHuman)).toBe(false);
  });

  it("applies each rival result only when its wheel resolves (commit)", () => {
    let standings = makePlayers();
    const { turns } = planAiTurns<TestPlayer, TestTurn>(standings, makeTurn);

    // Before any wheel resolves, both rivals are still at their start cash.
    expect(standings.find((p) => p.id === "ai-1")!.cash).toBe(100);
    expect(standings.find((p) => p.id === "ai-2")!.cash).toBe(100);

    // First wheel resolves -> only ai-1's result lands.
    standings = commitAiTurn(standings, turns[0]);
    expect(standings.find((p) => p.id === "ai-1")!.cash).toBe(600);
    expect(standings.find((p) => p.id === "ai-2")!.cash).toBe(100);

    // Second wheel resolves -> ai-2's result lands.
    standings = commitAiTurn(standings, turns[1]);
    expect(standings.find((p) => p.id === "ai-2")!.cash).toBe(600);

    // The human is never touched.
    expect(standings.find((p) => p.id === "human")!.cash).toBe(100);
  });

  it("skips eliminated rivals when planning", () => {
    const players: TestPlayer[] = [
      { id: "human", isHuman: true, alive: true, cash: 100 },
      { id: "ai-dead", isHuman: false, alive: false, cash: 0 },
      { id: "ai-live", isHuman: false, alive: true, cash: 100 },
    ];
    const { turns } = planAiTurns<TestPlayer, TestTurn>(players, makeTurn);
    expect(turns).toHaveLength(1);
    expect(turns[0].player.id).toBe("ai-live");
  });
});
