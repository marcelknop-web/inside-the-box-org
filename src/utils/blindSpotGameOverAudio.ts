// Descending Web Audio sting for the Blind Spot game-over overlay.
// Self-contained, no external assets, no React.

export function playGameOverSting() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
    master.connect(ctx.destination);

    // Descending minor arpeggio + sub drone.
    const notes = [
      { f: 392.0, t: 0.0 },   // G4
      { f: 329.6, t: 0.25 },  // E4
      { f: 261.6, t: 0.55 },  // C4
      { f: 196.0, t: 0.95 },  // G3
      { f: 146.8, t: 1.45 },  // D3
    ];
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = n.f;
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + n.t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.t + 0.55);
      osc.connect(g).connect(master);
      osc.start(ctx.currentTime + n.t);
      osc.stop(ctx.currentTime + n.t + 0.6);
    }

    // Sub drone underneath.
    const sub = ctx.createOscillator();
    const subG = ctx.createGain();
    sub.type = "sine";
    sub.frequency.value = 73.4; // D2
    subG.gain.value = 0.0001;
    subG.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.1);
    subG.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
    sub.connect(subG).connect(master);
    sub.start(ctx.currentTime);
    sub.stop(ctx.currentTime + 2.3);

    // Close the context after the sting finishes.
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2500);
  } catch {
    /* audio disabled / blocked — silent fallback */
  }
}
