import { useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Hidden /overview — 3D Orbital Mandala.
 *
 * Four concentric, slightly tilted rings rotate around a shared axis.
 * Each ring is one service cluster; each node on a ring is one service.
 * Depth (ring radius + Z tilt) encodes maturity / commitment level:
 *   - Innermost ring: Resilience (foundational, always-on)
 *   - Outer rings:   Regulation → Governance → Insights (exploratory)
 *
 * The mandala auto-rotates slowly. The cursor gently steers it: the
 * scene leans toward the cursor, like a compass needle. Hover lifts a
 * node toward the camera, click navigates.
 *
 * Mobile keeps the readable PART list — a small 3D scene on a 390px
 * viewport hurts more than it helps.
 */

type ServiceNode = {
  id: string;
  titleKey: string;
  code: string;
};

type Cluster = {
  id: string;
  groupKey: string;
  code: string;
  services: ServiceNode[];
};

const CLUSTERS: Cluster[] = [
  {
    id: 'resilience',
    groupKey: 'nav.groupCyberResilience',
    code: 'A',
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle',   code: 'A-01' },
      { id: 'incident-management',     titleKey: 'consulting.incidentTitle', code: 'A-02' },
      { id: 'arena-training',          titleKey: 'consulting.arenaTitle',    code: 'A-03' },
    ],
  },
  {
    id: 'regulation',
    groupKey: 'nav.groupRegulation',
    code: 'B',
    services: [
      { id: 'nis2-dora',     titleKey: 'consulting.nis2Title',  code: 'B-01' },
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining',       code: 'B-02' },
      { id: 'isms',          titleKey: 'consulting.ismsTitle',  code: 'B-03' },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle', code: 'B-04' },
    ],
  },
  {
    id: 'governance',
    groupKey: 'nav.groupGovernance',
    code: 'C',
    services: [
      { id: 'virtual-ciso',         titleKey: 'consulting.vcisoTitle',  code: 'C-01' },
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', code: 'C-02' },
    ],
  },
  {
    id: 'insights',
    groupKey: 'nav.groupInsights',
    code: 'D',
    services: [
      { id: 'publications',     titleKey: 'consulting.pubTitle',         code: 'D-01' },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle',      code: 'D-02' },
      { id: 'ai-workflows',     titleKey: 'consulting.aiWorkflowsTitle', code: 'D-03' },
    ],
  },
];

// Ring radii — innermost = foundational, outermost = exploratory
const RING_RADII = [1.4, 2.3, 3.2, 4.1];
// Each ring tilts slightly — gives the mandala its 3D depth
const RING_TILT = [0.18, -0.12, 0.22, -0.16];

// Gold / cyan in linear-ish RGB matching the design tokens
const COLOR_PRIMARY = '#f5b800';
const COLOR_HIGHLIGHT = '#00bcd4';
const COLOR_DIM = '#3a4a66';

// ── Page ───────────────────────────────────────────────────────────────────

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const hovered = useMemo(() => {
    if (!hoveredId) return null;
    for (const c of CLUSTERS) {
      const s = c.services.find((x) => x.id === hoveredId);
      if (s) return { cluster: c, service: s };
    }
    return null;
  }, [hoveredId]);

  if (isMobile) {
    return <MobileBlueprint t={t} language={language} setLanguage={setLanguage} navigate={navigate} />;
  }

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden relative bg-background flex flex-col">
      <PageMeta
        title="Mandala"
        description="3D mandala of cybersecurity services from inside-the-box.org."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Soft radial halo behind the mandala */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, hsl(var(--primary) / 0.08) 0%, hsl(var(--background)) 65%)',
        }}
      />

      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
        >
          ← INSIDE-THE-BOX
        </button>
        <button
          onClick={() => setLanguage(nextLanguage(language))}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          aria-label="Language"
        >
          <Languages className="w-3 h-3" />
          {language.toUpperCase()}
        </button>
      </header>

      {/* Axis labels — depth legend */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col gap-2">
        <div className="font-mono text-[9px] tracking-[0.4em] text-primary/70">DEPTH</div>
        <div className="w-px h-32 bg-gradient-to-b from-primary/70 via-primary/30 to-primary/10" />
        <div className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground leading-tight">
          FOUNDATIONAL<br />→ EXPLORATORY
        </div>
      </div>

      {/* Selected indicator (top-right) */}
      <div className="absolute right-6 top-20 z-20 pointer-events-none text-right">
        <div className="font-mono text-[9px] tracking-[0.4em] text-primary/70 mb-1">SELECTED</div>
        <div key={hovered?.service.code ?? 'none'} className="font-mono text-base tracking-[0.25em] text-primary animate-fade-in">
          {hovered?.service.code ?? '—'}
        </div>
        <div key={hovered?.service.titleKey ?? 'none-t'} className="font-mono text-[11px] tracking-[0.15em] text-foreground/85 mt-1 max-w-[220px] animate-fade-in">
          {hovered ? t(hovered.service.titleKey) : 'HOVER · INSPECT'}
        </div>
        {hovered && (
          <div className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground mt-2">
            {t(hovered.cluster.groupKey).toUpperCase()}
          </div>
        )}
      </div>

      {/* The 3D scene */}
      <div className="relative w-full flex-1">
        <Canvas
          camera={{ position: [0, 1.2, 7.5], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene
              t={t}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              onSelect={handleClick}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Footer legend */}
      <footer className="relative z-20 border-t border-primary/15 bg-background/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          <span>4 RINGS · {CLUSTERS.reduce((n, c) => n + c.services.length, 0)} NODES</span>
          <span className="hidden md:block">CURSOR · STEERS &nbsp; · &nbsp; HOVER · INSPECT &nbsp; · &nbsp; CLICK · OPEN</span>
          <span>ITB-MANDALA-2026</span>
        </div>
      </footer>
    </div>
  );
};

// ── 3D Scene ───────────────────────────────────────────────────────────────

interface SceneProps {
  t: (k: string) => string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const Scene = ({ t, hoveredId, setHoveredId, onSelect }: SceneProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  // Auto-rotate + gentle steering toward cursor
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    // Continuous slow yaw
    g.rotation.y += delta * 0.12;
    // Cursor steers pitch + a bit of yaw bias (eased)
    const targetPitch = mouse.y * 0.35;
    const targetYawBias = mouse.x * 0.25;
    g.rotation.x += (targetPitch - g.rotation.x) * Math.min(1, delta * 2.2);
    g.position.x += (targetYawBias * 0.4 - g.position.x) * Math.min(1, delta * 2);
  });

  return (
    <>
      {/* Subtle key + rim lights — keep the gold material readable */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 6]} intensity={0.9} color={COLOR_PRIMARY} />
      <directionalLight position={[-5, -2, -3]} intensity={0.35} color={COLOR_HIGHLIGHT} />

      <group ref={groupRef}>
        {/* Central anchor — the "inside the box" core */}
        <CoreAnchor />

        {CLUSTERS.map((cluster, ringIdx) => (
          <Ring
            key={cluster.id}
            cluster={cluster}
            ringIdx={ringIdx}
            radius={RING_RADII[ringIdx]}
            tilt={RING_TILT[ringIdx]}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            onSelect={onSelect}
            t={t}
          />
        ))}
      </group>
    </>
  );
};

// Central core sphere + faint axis line
const CoreAnchor = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4;
      ref.current.rotation.x += delta * 0.15;
    }
  });
  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color={COLOR_PRIMARY}
          metalness={0.4}
          roughness={0.35}
          emissive={COLOR_PRIMARY}
          emissiveIntensity={0.25}
          wireframe
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial
          color={COLOR_PRIMARY}
          emissive={COLOR_PRIMARY}
          emissiveIntensity={0.6}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
};

interface RingProps {
  cluster: Cluster;
  ringIdx: number;
  radius: number;
  tilt: number;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onSelect: (id: string) => void;
  t: (k: string) => string;
}

const Ring = ({ cluster, ringIdx, radius, tilt, hoveredId, setHoveredId, onSelect, t }: RingProps) => {
  const ref = useRef<THREE.Group>(null);
  // Counter-rotate adjacent rings → mandala feel
  const dir = ringIdx % 2 === 0 ? 1 : -1;
  // Outer rings rotate slower (more "still")
  const speed = 0.18 / (ringIdx * 0.5 + 1);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed * dir;
  });

  const points = useMemo(() => {
    const segments = 128;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    return pts;
  }, [radius]);

  const lineGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  // Tilt the whole ring around the X axis
  return (
    <group rotation={[tilt, 0, 0]}>
      <group ref={ref}>
        {/* Ring guide line */}
        <line>
          <primitive object={lineGeom} attach="geometry" />
          <lineBasicMaterial
            color={COLOR_PRIMARY}
            transparent
            opacity={0.18 + (3 - ringIdx) * 0.04}
          />
        </line>

        {/* Subtle inner glow ring for depth */}
        <mesh>
          <torusGeometry args={[radius, 0.012, 8, 128]} />
          <meshBasicMaterial color={COLOR_PRIMARY} transparent opacity={0.18} />
        </mesh>

        {/* Tick marks every 30° */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const x = Math.cos(a) * radius;
          const y = Math.sin(a) * radius;
          return (
            <mesh key={i} position={[x, y, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.06, 0.005, 0.005]} />
              <meshBasicMaterial color={COLOR_PRIMARY} transparent opacity={0.35} />
            </mesh>
          );
        })}

        {/* Service nodes */}
        {cluster.services.map((service, i) => {
          const a = (i / cluster.services.length) * Math.PI * 2 + ringIdx * 0.4;
          const x = Math.cos(a) * radius;
          const y = Math.sin(a) * radius;
          const isHovered = hoveredId === service.id;
          const dimmed = hoveredId !== null && !isHovered;
          return (
            <ServiceNodeMesh
              key={service.id}
              position={[x, y, 0]}
              service={service}
              cluster={cluster}
              isHovered={isHovered}
              dimmed={dimmed}
              onEnter={() => setHoveredId(service.id)}
              onLeave={() => setHoveredId(null)}
              onClick={() => onSelect(service.id)}
              t={t}
            />
          );
        })}
      </group>
    </group>
  );
};

interface ServiceNodeProps {
  position: [number, number, number];
  service: ServiceNode;
  cluster: Cluster;
  isHovered: boolean;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
  t: (k: string) => string;
}

const ServiceNodeMesh = ({
  position,
  service,
  isHovered,
  dimmed,
  onEnter,
  onLeave,
  onClick,
  t,
}: ServiceNodeProps) => {
  const ref = useRef<THREE.Group>(null);
  const targetScale = isHovered ? 1.55 : 1;
  // Lift hovered node toward camera (positive Z relative to ring plane)
  const targetZ = isHovered ? 0.45 : 0;

  useFrame((_, delta) => {
    if (!ref.current) return;
    const g = ref.current;
    const k = Math.min(1, delta * 6);
    g.scale.x += (targetScale - g.scale.x) * k;
    g.scale.y += (targetScale - g.scale.y) * k;
    g.scale.z += (targetScale - g.scale.z) * k;
    g.position.z += (targetZ - g.position.z) * k;
  });

  const baseColor = isHovered ? COLOR_HIGHLIGHT : COLOR_PRIMARY;
  const opacity = dimmed ? 0.35 : 1;

  return (
    <group position={position}>
      <group
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onEnter();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'default';
          onLeave();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {/* Outer halo ring */}
        <mesh>
          <ringGeometry args={[0.11, 0.14, 32]} />
          <meshBasicMaterial color={baseColor} transparent opacity={opacity * 0.55} side={THREE.DoubleSide} />
        </mesh>
        {/* Solid node */}
        <mesh>
          <sphereGeometry args={[0.075, 24, 24]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={isHovered ? 1.1 : 0.55}
            metalness={0.3}
            roughness={0.3}
            transparent
            opacity={opacity}
          />
        </mesh>
        {/* Hover-only tooltip */}
        {isHovered && (
          <Html
            position={[0, 0.28, 0]}
            center
            style={{ pointerEvents: 'none' }}
            distanceFactor={6}
          >
            <div className="font-mono whitespace-nowrap px-2.5 py-1.5 border border-primary/60 bg-background/90 backdrop-blur-sm text-[10px] tracking-[0.25em] text-primary">
              <div className="text-primary/70 text-[8px] tracking-[0.35em] mb-0.5">{service.code}</div>
              <div className="text-foreground text-[11px] tracking-[0.15em]">
                {t(service.titleKey).toUpperCase()}
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// ── Mobile fallback ────────────────────────────────────────────────────────

interface MobileBlueprintProps {
  t: (k: string) => string;
  language: string;
  setLanguage: (l: ReturnType<typeof nextLanguage>) => void;
  navigate: (path: string) => void;
}

const MobileBlueprint = ({ t, language, setLanguage, navigate }: MobileBlueprintProps) => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground relative">
      <PageMeta
        title="Mandala"
        description="Cybersecurity services from inside-the-box.org."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--primary) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <header className="relative z-30 flex items-center justify-between px-4 py-4 border-b border-primary/15">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
        >
          ← INSIDE-THE-BOX
        </button>
        <button
          onClick={() => setLanguage(nextLanguage(language as Parameters<typeof nextLanguage>[0]))}
          className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          aria-label="Language"
        >
          <Languages className="w-3.5 h-3.5" />
          {language.toUpperCase()}
        </button>
      </header>

      <div className="relative z-10 px-4 py-5 space-y-7 pb-12">
        {CLUSTERS.map((cluster, zi) => {
          const zoneLabel = ['A1', 'B1', 'A2', 'B2'][zi] ?? '—';
          return (
            <section key={cluster.id}>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60">
                  RING {zoneLabel} · {cluster.code}
                </span>
                <span className="flex-1 h-px bg-primary/20" />
              </div>
              <h2 className="font-mono text-base tracking-[0.18em] text-foreground/95 mb-3">
                {t(cluster.groupKey).toUpperCase()}
              </h2>
              <ul className="space-y-2.5">
                {cluster.services.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => navigate(`/${s.id}`)}
                      className="group w-full text-left relative border border-primary/40 bg-background/60 px-4 py-3.5 active:bg-primary/10 active:border-primary transition-colors"
                    >
                      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/70" />
                      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/70" />
                      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/70" />
                      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/70" />
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] tracking-[0.3em] text-primary/75">
                            PART {s.code}
                          </div>
                          <div className="font-mono text-[15px] leading-snug text-foreground mt-1.5">
                            {t(s.titleKey)}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] tracking-[0.3em] text-primary shrink-0">
                          OPEN →
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Overview;
