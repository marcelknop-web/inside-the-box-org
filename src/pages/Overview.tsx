import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

/**
 * Hidden architectural blueprint of the entire service offering.
 * Route: /overview — not linked from the main navigation.
 *
 * Visual metaphor: an engineering blueprint. Four service modules
 * (Cyber Resilience, Regulation, Governance, Insights) are drawn as
 * framed cards on a grid, connected by thin dimension lines to a
 * central anchor. Each module exposes its sub-services ("Vertiefungen").
 * Hover highlights, click opens a detail panel with a CTA into the
 * actual service page (which lives in ChatView under /<serviceId>).
 */

type Node = {
  id: string;
  titleKey: string;
  descKey: string;
};

type Cluster = {
  id: string;
  groupKey: string;
  /** Short blueprint label, e.g. "M-01" */
  code: string;
  /** Position on the 12-col / 8-row blueprint grid */
  col: number;
  row: number;
  nodes: Node[];
};

const CLUSTERS: Cluster[] = [
  {
    id: 'resilience',
    groupKey: 'nav.groupCyberResilience',
    code: 'M-01',
    col: 1,
    row: 1,
    nodes: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc' },
      { id: 'incident-management', titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
      { id: 'arena-training', titleKey: 'consulting.arenaTitle', descKey: 'consulting.arenaDesc' },
    ],
  },
  {
    id: 'regulation',
    groupKey: 'nav.groupRegulation',
    code: 'M-02',
    col: 7,
    row: 1,
    nodes: [
      { id: 'nis2-dora', titleKey: 'consulting.nis2Title', descKey: 'consulting.nis2Desc' },
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining', descKey: 'consulting.crisisDesc' },
      { id: 'isms', titleKey: 'consulting.ismsTitle', descKey: 'consulting.ismsDesc' },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle', descKey: 'consulting.tisaxDesc' },
    ],
  },
  {
    id: 'governance',
    groupKey: 'nav.groupGovernance',
    code: 'M-03',
    col: 1,
    row: 5,
    nodes: [
      { id: 'virtual-ciso', titleKey: 'consulting.vcisoTitle', descKey: 'consulting.vcisoDesc' },
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', descKey: 'consulting.assessDesc' },
    ],
  },
  {
    id: 'insights',
    groupKey: 'nav.groupInsights',
    code: 'M-04',
    col: 7,
    row: 5,
    nodes: [
      { id: 'publications', titleKey: 'consulting.pubTitle', descKey: 'consulting.pubDesc' },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle', descKey: 'consulting.eventsDesc' },
      { id: 'ai-workflows', titleKey: 'consulting.aiWorkflowsTitle', descKey: 'consulting.aiWorkflowsDesc' },
    ],
  },
];

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const goToService = useCallback(() => {
    if (!selectedNode) return;
    navigate(`/${selectedNode.id}`);
  }, [selectedNode, navigate]);

  // Map language → labels in current language for top-right toggle
  const langLabel = useMemo(() => language.toUpperCase(), [language]);

  return (
    <div className="min-h-screen w-full text-foreground">
      <PageMeta
        title="Service Blueprint"
        description="Architektonische Übersicht aller Cybersecurity-Services von inside-the-box.org."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border/40">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
          aria-label={t('common.backToHome' as never) || 'Zurück'}
        >
          ← inside-the-box.org
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] sm:text-xs text-muted-foreground tracking-widest">
            BLUEPRINT / REV.01 / {new Date().getFullYear()}
          </span>
          <button
            onClick={() => setLanguage(nextLanguage(language))}
            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            aria-label="Language"
          >
            <Languages className="w-3.5 h-3.5" />
            {langLabel}
          </button>
        </div>
      </header>

      {/* Title block */}
      <section className="px-4 sm:px-8 pt-8 pb-4 max-w-7xl mx-auto">
        <p className="font-mono text-[10px] sm:text-xs text-primary tracking-[0.3em] mb-2">
          DRAWING № 001 — SERVICE ARCHITECTURE
        </p>
        <h1 className="font-mono text-2xl sm:text-4xl font-medium leading-tight mb-3">
          {t('overview.title' as never) || 'Was wir liefern.'}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          {t('overview.subtitle' as never) ||
            'Vier Module, dreizehn Vertiefungen. Hover, um Verbindungen zu sehen. Klick, um in das jeweilige Angebot einzusteigen.'}
        </p>
      </section>

      {/* Blueprint canvas */}
      <main className="px-4 sm:px-8 pb-24 max-w-7xl mx-auto">
        <BlueprintCanvas
          clusters={CLUSTERS}
          hoveredCluster={hoveredCluster}
          setHoveredCluster={setHoveredCluster}
          onNodeClick={handleNodeClick}
          t={t}
        />

        {/* Legend */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[10px] sm:text-xs text-muted-foreground">
          <LegendItem code="M-01" label={t('nav.groupCyberResilience')} />
          <LegendItem code="M-02" label={t('nav.groupRegulation')} />
          <LegendItem code="M-03" label={t('nav.groupGovernance')} />
          <LegendItem code="M-04" label={t('nav.groupInsights')} />
        </div>
      </main>

      {/* Detail panel */}
      <Sheet open={!!selectedNode} onOpenChange={(o) => !o && setSelectedNode(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card border-l border-border">
          {selectedNode && (
            <>
              <SheetHeader>
                <p className="font-mono text-[10px] text-primary tracking-[0.25em] mb-1">
                  DETAIL / {selectedNode.id.toUpperCase()}
                </p>
                <SheetTitle className="font-mono text-xl text-foreground">
                  {t(selectedNode.titleKey as never) || selectedNode.titleKey}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground pt-2 leading-relaxed">
                  {t(selectedNode.descKey as never) || selectedNode.descKey}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-8 space-y-3">
                <Button
                  onClick={goToService}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
                >
                  {t('overview.openService' as never) || 'Zum Service'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-full font-mono text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {t('overview.close' as never) || 'Schließen'}
                </button>
              </div>

              {/* Decorative blueprint corner */}
              <div className="absolute bottom-4 right-4 font-mono text-[9px] text-muted-foreground/50 tracking-widest">
                SHEET 1/1
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const LegendItem = ({ code, label }: { code: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-primary">{code}</span>
    <span className="opacity-60">·</span>
    <span className="truncate">{label}</span>
  </div>
);

// ── Blueprint canvas ────────────────────────────────────────────────────────

interface BlueprintCanvasProps {
  clusters: Cluster[];
  hoveredCluster: string | null;
  setHoveredCluster: (id: string | null) => void;
  onNodeClick: (node: Node) => void;
  t: (k: string) => string;
}

const BlueprintCanvas = ({
  clusters,
  hoveredCluster,
  setHoveredCluster,
  onNodeClick,
  t,
}: BlueprintCanvasProps) => {
  return (
    <div className="relative rounded-lg border border-border/60 bg-background/40 overflow-hidden">
      {/* Grid background (millimeter-paper feel, but lighter) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.4) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
        }}
      />

      {/* Corner ticks */}
      <CornerTicks />

      {/* Title strip (top-left of canvas) */}
      <div className="absolute top-3 left-3 font-mono text-[9px] text-muted-foreground tracking-[0.25em] z-10">
        SCALE 1:1 · ALL UNITS IN SERVICES
      </div>
      <div className="absolute top-3 right-3 font-mono text-[9px] text-muted-foreground tracking-[0.25em] z-10">
        SHEET A · 13 MODULES
      </div>

      {/* Modules grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 p-6 sm:p-10 pt-12">
        {clusters.map((cluster) => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            isHovered={hoveredCluster === cluster.id}
            isDimmed={hoveredCluster !== null && hoveredCluster !== cluster.id}
            onMouseEnter={() => setHoveredCluster(cluster.id)}
            onMouseLeave={() => setHoveredCluster(null)}
            onNodeClick={onNodeClick}
            t={t}
          />
        ))}
      </div>

      {/* Footer strip */}
      <div className="relative border-t border-border/40 px-6 py-3 flex items-center justify-between font-mono text-[9px] text-muted-foreground tracking-[0.2em]">
        <span>DRAWN BY · INSIDE-THE-BOX</span>
        <span className="hidden sm:inline">CHECKED · M.K. / A.F.</span>
        <span>REV 01 · {new Date().toISOString().slice(0, 10)}</span>
      </div>
    </div>
  );
};

const CornerTicks = () => (
  <>
    {[
      'top-2 left-2 border-t border-l',
      'top-2 right-2 border-t border-r',
      'bottom-2 left-2 border-b border-l',
      'bottom-2 right-2 border-b border-r',
    ].map((cls, i) => (
      <div
        key={i}
        aria-hidden
        className={`absolute ${cls} border-primary/60 w-4 h-4 pointer-events-none z-10`}
      />
    ))}
  </>
);

interface ClusterCardProps {
  cluster: Cluster;
  isHovered: boolean;
  isDimmed: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNodeClick: (node: Node) => void;
  t: (k: string) => string;
}

const ClusterCard = ({
  cluster,
  isHovered,
  isDimmed,
  onMouseEnter,
  onMouseLeave,
  onNodeClick,
  t,
}: ClusterCardProps) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative rounded-md border bg-card/40 backdrop-blur-sm transition-all duration-300 ${
        isHovered
          ? 'border-primary shadow-[0_0_30px_hsl(var(--primary)/0.15)]'
          : isDimmed
          ? 'border-border/40 opacity-50'
          : 'border-border/70'
      }`}
    >
      {/* Module code */}
      <div className="absolute -top-2 left-4 px-2 bg-background font-mono text-[10px] text-primary tracking-[0.25em]">
        {cluster.code}
      </div>
      {/* Dim corner ticks on each card */}
      <span aria-hidden className="absolute top-1 right-1 w-2 h-2 border-t border-r border-primary/50" />
      <span aria-hidden className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-primary/50" />

      <div className="p-5 sm:p-6">
        <h2 className="font-mono text-base sm:text-lg text-foreground mb-1">
          {t(cluster.groupKey)}
        </h2>
        <div className="h-px bg-border/60 my-3" />

        <ul className="space-y-2">
          {cluster.nodes.map((node, idx) => (
            <li key={node.id}>
              <button
                onClick={() => onNodeClick(node)}
                className="group w-full text-left flex items-start gap-3 py-2 px-2 -mx-2 rounded transition-colors hover:bg-primary/5"
              >
                <span className="font-mono text-[10px] text-muted-foreground mt-1 w-8 shrink-0">
                  {cluster.code.split('-')[1]}.{String(idx + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm sm:text-[15px] text-foreground group-hover:text-primary transition-colors leading-snug">
                    {t(node.titleKey)}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {t(node.descKey)}
                  </span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 mt-1.5 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Overview;
