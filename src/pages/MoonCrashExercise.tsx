import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket, Users, BarChart3, ChevronRight, ChevronLeft, Trophy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageMeta } from '@/components/PageMeta';

/* ─── NASA Expert Ranking ─── */
const ITEMS: { name: string; nasaRank: number; reason: string }[] = [
  { name: 'Streichhölzer', nasaRank: 15, reason: 'Kein Sauerstoff auf dem Mond – nutzlos' },
  { name: 'Nahrungskonzentrat', nasaRank: 4, reason: 'Effiziente Energiequelle' },
  { name: '15 m Nylonseil', nasaRank: 6, reason: 'Nützlich für Klettern und Transport' },
  { name: 'Fallschirmseide', nasaRank: 8, reason: 'Sonnenschutz und Transportmittel' },
  { name: 'Tragbares Heizgerät (solar)', nasaRank: 13, reason: 'Auf beleuchteter Seite nicht nötig' },
  { name: 'Zwei Pistolen (.45 Kaliber)', nasaRank: 11, reason: 'Rückstoß als Antrieb nutzbar' },
  { name: 'Trockenmilch (1 Kiste)', nasaRank: 12, reason: 'Nahrung, aber sperrig' },
  { name: 'Sauerstofftanks (2 × 45 kg)', nasaRank: 1, reason: 'Wichtigstes Überlebensmittel' },
  { name: 'Mondkarte (Sternenkarte)', nasaRank: 3, reason: 'Essentiell für Navigation' },
  { name: 'Selbstaufblasende Rettungsinsel', nasaRank: 9, reason: 'CO₂-Flaschen als Antrieb' },
  { name: 'Magnetkompass', nasaRank: 14, reason: 'Kein Magnetfeld auf dem Mond' },
  { name: '20 Liter Wasser', nasaRank: 2, reason: 'Überlebenswichtig' },
  { name: 'Signalraketen', nasaRank: 10, reason: 'Notsignal auf kurze Distanz' },
  { name: 'Erste-Hilfe-Set mit Spritzen', nasaRank: 7, reason: 'Medizinische Versorgung' },
  { name: 'UKW-Sender/Empfänger (solar)', nasaRank: 5, reason: 'Kommunikation mit Mutterschiff' },
];

const SCORE_LABELS = [
  { max: 25, label: 'Exzellent', color: 'hsl(var(--chart-2))' },
  { max: 32, label: 'Gut', color: 'hsl(var(--chart-1))' },
  { max: 45, label: 'Durchschnittlich', color: 'hsl(var(--chart-4))' },
  { max: 55, label: 'Unterdurchschnittlich', color: 'hsl(var(--chart-5))' },
  { max: Infinity, label: 'Schlecht', color: 'hsl(var(--destructive))' },
];

function getScoreLabel(score: number) {
  return SCORE_LABELS.find(s => score <= s.max)!;
}

type Phase = 'setup' | 'input' | 'group' | 'results';

export default function MoonCrashExercise() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('setup');
  const [playerCount, setPlayerCount] = useState(5);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [rankings, setRankings] = useState<number[][]>([]); // [playerIndex][itemIndex] = rank
  const [groupRanking, setGroupRanking] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);

  /* ── Setup ── */
  const startGame = () => {
    const names = Array.from({ length: playerCount }, (_, i) => `Spieler ${i + 1}`);
    setPlayerNames(names);
    setRankings(Array.from({ length: playerCount }, () => Array(15).fill(0)));
    setGroupRanking(Array(15).fill(0));
    setCurrentPlayer(0);
    setPhase('input');
  };

  /* ── Ranking helpers ── */
  const setPlayerRank = (playerIdx: number, itemIdx: number, rank: number) => {
    setRankings(prev => {
      const next = prev.map(r => [...r]);
      next[playerIdx][itemIdx] = rank;
      return next;
    });
  };

  const setGroupRank = (itemIdx: number, rank: number) => {
    setGroupRanking(prev => {
      const next = [...prev];
      next[itemIdx] = rank;
      return next;
    });
  };

  /* ── Scoring ── */
  const calcScore = (ranks: number[]) =>
    ranks.reduce((sum, r, i) => sum + Math.abs(r - ITEMS[i].nasaRank), 0);

  const allPlayersComplete = rankings.every(r => r.every(v => v >= 1 && v <= 15));
  const groupComplete = groupRanking.every(v => v >= 1 && v <= 15);

  /* ── Analysis data ── */
  const analysis = useMemo(() => {
    if (!allPlayersComplete) return null;
    const playerScores = rankings.map(calcScore);
    const groupScore = groupComplete ? calcScore(groupRanking) : null;

    // Per-item stats
    const itemStats = ITEMS.map((item, i) => {
      const vals = rankings.map(r => r[i]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
      const stdDev = Math.sqrt(variance);
      return {
        name: item.name,
        nasaRank: item.nasaRank,
        reason: item.reason,
        mean: Math.round(mean * 10) / 10,
        stdDev: Math.round(stdDev * 10) / 10,
        groupRank: groupRanking[i] || null,
        playerRanks: vals,
      };
    });

    const avgScore = Math.round(playerScores.reduce((a, b) => a + b, 0) / playerScores.length);
    const bestPlayer = playerScores.indexOf(Math.min(...playerScores));
    const worstPlayer = playerScores.indexOf(Math.max(...playerScores));

    return { playerScores, groupScore, itemStats, avgScore, bestPlayer, worstPlayer };
  }, [rankings, groupRanking, allPlayersComplete, groupComplete]);

  /* ── Render helpers ── */
  const RankSelector = ({ value, onChange, usedRanks }: { value: number; onChange: (v: number) => void; usedRanks: number[] }) => (
    <Select value={value ? String(value) : ''} onValueChange={v => onChange(Number(v))}>
      <SelectTrigger className="w-20 h-8 text-sm bg-background border-border">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 15 }, (_, i) => i + 1).map(r => (
          <SelectItem key={r} value={String(r)} disabled={usedRanks.includes(r) && value !== r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const usedRanksForPlayer = (pidx: number) => rankings[pidx]?.filter(v => v > 0) || [];
  const usedGroupRanks = groupRanking.filter(v => v > 0);

  /* ── Bar chart via SVG ── */
  const BarChart = ({ data, maxVal, labelKey, valueKey, colorFn }: {
    data: { label: string; value: number; color?: string }[];
    maxVal: number;
    labelKey?: string;
    valueKey?: string;
    colorFn?: (v: number) => string;
  }) => {
    const barH = 28;
    const gap = 4;
    const h = data.length * (barH + gap);
    const labelW = 180;
    const chartW = 400;
    return (
      <svg viewBox={`0 0 ${labelW + chartW + 60} ${h + 10}`} className="w-full max-w-2xl" style={{ minHeight: data.length * 20 }}>
        {data.map((d, i) => {
          const y = i * (barH + gap) + 5;
          const w = maxVal > 0 ? (d.value / maxVal) * chartW : 0;
          const col = d.color || colorFn?.(d.value) || 'hsl(var(--primary))';
          return (
            <g key={i}>
              <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" className="text-[11px] fill-foreground font-mono">{d.label}</text>
              <rect x={labelW} y={y} width={Math.max(w, 2)} height={barH} rx={4} fill={col} opacity={0.85} />
              <text x={labelW + w + 6} y={y + barH / 2 + 4} className="text-[11px] fill-foreground font-semibold">{d.value}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  /* ── Deviation chart ── */
  const DeviationChart = ({ stats }: { stats: typeof analysis extends null ? never : NonNullable<typeof analysis>['itemStats'] }) => {
    const barH = 26;
    const gap = 4;
    const h = stats.length * (barH + gap);
    const labelW = 200;
    const chartW = 300;
    const maxDev = Math.max(...stats.map(s => s.stdDev), 1);
    return (
      <svg viewBox={`0 0 ${labelW + chartW + 60} ${h + 10}`} className="w-full max-w-2xl" style={{ minHeight: stats.length * 18 }}>
        {stats.map((s, i) => {
          const y = i * (barH + gap) + 5;
          const w = (s.stdDev / maxDev) * chartW;
          const col = s.stdDev > 3 ? 'hsl(var(--destructive))' : s.stdDev > 2 ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-2))';
          return (
            <g key={i}>
              <text x={labelW - 8} y={y + barH / 2 + 4} textAnchor="end" className="text-[11px] fill-foreground font-mono">{s.name}</text>
              <rect x={labelW} y={y} width={Math.max(w, 2)} height={barH} rx={4} fill={col} opacity={0.8} />
              <text x={labelW + w + 6} y={y + barH / 2 + 4} className="text-[11px] fill-foreground font-semibold">σ {s.stdDev}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  /* ── Comparison dot chart ── */
  const ComparisonChart = ({ stats }: { stats: NonNullable<typeof analysis>['itemStats'] }) => {
    const rowH = 28;
    const gap = 4;
    const h = stats.length * (rowH + gap);
    const labelW = 200;
    const chartW = 320;
    const scale = (rank: number) => labelW + ((rank - 1) / 14) * chartW;
    return (
      <svg viewBox={`0 0 ${labelW + chartW + 40} ${h + 30}`} className="w-full max-w-2xl" style={{ minHeight: stats.length * 18 }}>
        {/* Header */}
        {[1, 5, 10, 15].map(v => (
          <text key={v} x={scale(v)} y={12} textAnchor="middle" className="text-[10px] fill-muted-foreground">{v}</text>
        ))}
        {stats.map((s, i) => {
          const y = i * (rowH + gap) + 22;
          return (
            <g key={i}>
              <text x={labelW - 8} y={y + rowH / 2 + 3} textAnchor="end" className="text-[10px] fill-foreground font-mono">{s.name}</text>
              <line x1={labelW} x2={labelW + chartW} y1={y + rowH / 2} y2={y + rowH / 2} stroke="hsl(var(--border))" strokeWidth={1} />
              {/* NASA rank */}
              <circle cx={scale(s.nasaRank)} cy={y + rowH / 2} r={6} fill="hsl(var(--chart-2))" />
              <text x={scale(s.nasaRank)} y={y + rowH / 2 + 3.5} textAnchor="middle" className="text-[8px] fill-white font-bold">{s.nasaRank}</text>
              {/* Mean */}
              <circle cx={scale(s.mean)} cy={y + rowH / 2} r={5} fill="hsl(var(--chart-4))" opacity={0.8} />
              {/* Group */}
              {s.groupRank && (
                <>
                  <rect x={scale(s.groupRank) - 5} y={y + rowH / 2 - 5} width={10} height={10} rx={2} fill="hsl(var(--primary))" opacity={0.9} />
                  <text x={scale(s.groupRank)} y={y + rowH / 2 + 3.5} textAnchor="middle" className="text-[7px] fill-white font-bold">{s.groupRank}</text>
                </>
              )}
            </g>
          );
        })}
        {/* Legend */}
        <g transform={`translate(${labelW}, ${h + 18})`}>
          <circle cx={0} cy={0} r={5} fill="hsl(var(--chart-2))" />
          <text x={10} y={4} className="text-[10px] fill-foreground">NASA</text>
          <circle cx={60} cy={0} r={4} fill="hsl(var(--chart-4))" />
          <text x={70} y={4} className="text-[10px] fill-foreground">Ø Spieler</text>
          <rect x={130} y={-5} width={10} height={10} rx={2} fill="hsl(var(--primary))" />
          <text x={145} y={4} className="text-[10px] fill-foreground">Gruppe</text>
        </g>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta title="Moon Crash Exercise – NASA Survival" description="NASA Moon Crash Gruppenübung mit Auswertung" />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Rocket className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">Moon Crash Exercise</h1>
          <div className="ml-auto flex gap-2">
            {(['setup', 'input', 'group', 'results'] as Phase[]).map((p, i) => (
              <span key={p} className={`text-xs px-2 py-1 rounded-full font-mono ${phase === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i + 1}. {p === 'setup' ? 'Setup' : p === 'input' ? 'Eingabe' : p === 'group' ? 'Gruppe' : 'Ergebnis'}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── PHASE: SETUP ── */}
        {phase === 'setup' && (
          <Card className="max-w-lg mx-auto border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Spieler-Setup</CardTitle>
              <CardDescription>
                Wähle die Anzahl der Teilnehmer für die Moon Crash Übung. Jeder Spieler bewertet 15 Gegenstände nach Überlebenswichtigkeit auf dem Mond.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Anzahl Spieler</label>
                <Select value={String(playerCount)} onValueChange={v => setPlayerCount(Number(v))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={String(n)}>{n} Spieler</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={startGame} className="w-full">
                <Rocket className="h-4 w-4 mr-2" /> Übung starten
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── PHASE: INPUT ── */}
        {phase === 'input' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{playerNames[currentPlayer]} – Ranking eingeben</h2>
              <span className="text-sm text-muted-foreground">Spieler {currentPlayer + 1} / {playerCount}</span>
            </div>

            {/* Name edit */}
            <input
              className="bg-muted/50 border border-border rounded px-3 py-1.5 text-sm font-mono w-60"
              value={playerNames[currentPlayer]}
              onChange={e => {
                const next = [...playerNames];
                next[currentPlayer] = e.target.value;
                setPlayerNames(next);
              }}
              placeholder="Name"
            />

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-3">Weise jedem Gegenstand einen Rang von 1 (wichtigst) bis 15 (unwichtigst) zu. Jeder Rang darf nur einmal vergeben werden.</p>
                <div className="space-y-2">
                  {ITEMS.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-1 border-b border-border/50 last:border-0">
                      <RankSelector
                        value={rankings[currentPlayer]?.[idx] || 0}
                        onChange={v => setPlayerRank(currentPlayer, idx, v)}
                        usedRanks={usedRanksForPlayer(currentPlayer)}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" disabled={currentPlayer === 0} onClick={() => setCurrentPlayer(c => c - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Vorheriger
              </Button>
              {currentPlayer < playerCount - 1 ? (
                <Button onClick={() => setCurrentPlayer(c => c + 1)}>
                  Nächster <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => setPhase('group')} disabled={!allPlayersComplete}>
                  Zur Gruppenentscheidung <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            {!allPlayersComplete && currentPlayer === playerCount - 1 && (
              <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Nicht alle Spieler haben vollständig gerankt.</p>
            )}
          </div>
        )}

        {/* ── PHASE: GROUP ── */}
        {phase === 'group' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Gruppen-Ranking eingeben</h2>
            <p className="text-sm text-muted-foreground">Einigt euch als Gruppe auf ein gemeinsames Ranking aller 15 Gegenstände.</p>

            <Card>
              <CardContent className="p-4 space-y-2">
                {ITEMS.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-1 border-b border-border/50 last:border-0">
                    <RankSelector
                      value={groupRanking[idx]}
                      onChange={v => setGroupRank(idx, v)}
                      usedRanks={usedGroupRanks}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-between">
              <Button variant="outline" onClick={() => { setPhase('input'); setCurrentPlayer(playerCount - 1); }}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
              </Button>
              <Button onClick={() => setPhase('results')}>
                <BarChart3 className="h-4 w-4 mr-2" /> Auswertung {!groupComplete && '(ohne Gruppe)'}
              </Button>
            </div>
          </div>
        )}

        {/* ── PHASE: RESULTS ── */}
        {phase === 'results' && analysis && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Auswertung</h2>

            <Tabs defaultValue="scores">
              <TabsList className="mb-4">
                <TabsTrigger value="scores">Punkte</TabsTrigger>
                <TabsTrigger value="comparison">Vergleich</TabsTrigger>
                <TabsTrigger value="deviation">Std.-Abweichung</TabsTrigger>
                <TabsTrigger value="detail">Detailtabelle</TabsTrigger>
              </TabsList>

              {/* Scores */}
              <TabsContent value="scores">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Fehlerpunkte (je niedriger, desto besser)</CardTitle>
                    <CardDescription>Summe der Abweichungen vom NASA-Ranking. Unter 25 = Exzellent, 25–32 = Gut, 33–45 = Durchschnitt.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      maxVal={Math.max(...analysis.playerScores, analysis.groupScore || 0, 60)}
                      data={[
                        ...analysis.playerScores.map((s, i) => ({
                          label: playerNames[i],
                          value: s,
                          color: getScoreLabel(s).color,
                        })),
                        ...(analysis.groupScore !== null ? [{
                          label: '★ GRUPPE',
                          value: analysis.groupScore,
                          color: 'hsl(var(--primary))',
                        }] : []),
                        {
                          label: 'Ø Durchschnitt',
                          value: analysis.avgScore,
                          color: 'hsl(var(--muted-foreground))',
                        },
                      ]}
                    />

                    {/* Synergy effect */}
                    {analysis.groupScore !== null && (
                      <div className={`mt-4 p-3 rounded-lg border text-sm font-mono ${
                        analysis.groupScore < analysis.avgScore
                          ? 'bg-chart-2/10 border-chart-2/30 text-chart-2'
                          : 'bg-destructive/10 border-destructive/30 text-destructive'
                      }`}>
                        {analysis.groupScore < analysis.avgScore
                          ? `✓ Synergieeffekt: Gruppenergebnis (${analysis.groupScore}) ist besser als der Spieler-Durchschnitt (${analysis.avgScore}). Die Gruppe ist stärker als das Individuum!`
                          : `✗ Kein Synergieeffekt: Gruppenergebnis (${analysis.groupScore}) ist schlechter als der Spieler-Durchschnitt (${analysis.avgScore}).`}
                      </div>
                    )}

                    {/* Best / Worst */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/30">
                        <p className="text-xs text-muted-foreground">Bester Spieler</p>
                        <p className="font-bold">{playerNames[analysis.bestPlayer]} ({analysis.playerScores[analysis.bestPlayer]} Pkt.)</p>
                      </div>
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <p className="text-xs text-muted-foreground">Schlechtester Spieler</p>
                        <p className="font-bold">{playerNames[analysis.worstPlayer]} ({analysis.playerScores[analysis.worstPlayer]} Pkt.)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Comparison chart */}
              <TabsContent value="comparison">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">NASA vs. Spieler vs. Gruppe</CardTitle>
                    <CardDescription>Grüner Punkt = NASA-Rang, gelber Punkt = Spieler-Durchschnitt, blaues Quadrat = Gruppenrang.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <ComparisonChart stats={analysis.itemStats} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Std deviation */}
              <TabsContent value="deviation">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Standardabweichung pro Gegenstand</CardTitle>
                    <CardDescription>Hohe Abweichung = große Uneinigkeit in der Gruppe. Rot markierte Items zeigen den größten Diskussionsbedarf.</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <DeviationChart stats={analysis.itemStats} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Detail table */}
              <TabsContent value="detail">
                <Card>
                  <CardHeader><CardTitle className="text-base">Detailtabelle</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2">Gegenstand</th>
                          <th className="p-2 text-center">NASA</th>
                          {playerNames.map((n, i) => <th key={i} className="p-2 text-center">{n}</th>)}
                          <th className="p-2 text-center">Gruppe</th>
                          <th className="p-2 text-center">Ø</th>
                          <th className="p-2 text-center">σ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.itemStats.map((s, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-2 text-left">{s.name}</td>
                            <td className="p-2 text-center font-bold text-chart-2">{s.nasaRank}</td>
                            {s.playerRanks.map((r, j) => {
                              const diff = Math.abs(r - s.nasaRank);
                              return (
                                <td key={j} className={`p-2 text-center ${diff === 0 ? 'text-chart-2 font-bold' : diff > 5 ? 'text-destructive' : ''}`}>
                                  {r}
                                </td>
                              );
                            })}
                            <td className="p-2 text-center font-bold text-primary">{s.groupRank || '—'}</td>
                            <td className="p-2 text-center">{s.mean}</td>
                            <td className={`p-2 text-center ${s.stdDev > 3 ? 'text-destructive font-bold' : ''}`}>{s.stdDev}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-border font-bold">
                          <td className="p-2">SUMME Fehler</td>
                          <td className="p-2 text-center">0</td>
                          {analysis.playerScores.map((s, i) => (
                            <td key={i} className="p-2 text-center" style={{ color: getScoreLabel(s).color }}>{s}</td>
                          ))}
                          <td className="p-2 text-center text-primary">{analysis.groupScore ?? '—'}</td>
                          <td className="p-2 text-center">{analysis.avgScore}</td>
                          <td className="p-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* NASA explanations */}
                <Card className="mt-4">
                  <CardHeader><CardTitle className="text-base">NASA-Begründungen</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {ITEMS.sort((a, b) => a.nasaRank - b.nasaRank).map((item, i) => (
                        <div key={i} className="flex gap-3 text-sm py-1 border-b border-border/30 last:border-0">
                          <span className="font-bold text-chart-2 w-6 text-right">{item.nasaRank}.</span>
                          <span className="font-medium w-48">{item.name}</span>
                          <span className="text-muted-foreground">{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Button variant="outline" onClick={() => { setPhase('setup'); setRankings([]); setGroupRanking([]); }}>
              Neue Übung starten
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
