import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

const LINE_COLOR = '#00ffaa';
const BG = '#000000';

/* ── Build a random convex polyhedron from scratch ── */
function buildPolyhedronAsteroid(seed: number, radius: number): { geo: THREE.BufferGeometry; edges: Float32Array } {
  const rng = (i: number) => {
    let x = Math.sin(seed * 9301 + i * 49297 + 0.1) * 49297;
    return x - Math.floor(x);
  };

  // Generate random vertices on a deformed sphere
  const numVerts = 6 + Math.floor(rng(0) * 7); // 6–12 vertices
  const verts: THREE.Vector3[] = [];

  for (let i = 0; i < numVerts; i++) {
    // Distribute points using golden spiral for even coverage
    const y = 1 - (i / (numVerts - 1)) * 2; // -1 to 1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = ((2 * Math.PI * i) / 1.618033988749895) + rng(i + 20) * 0.8;
    const r = radius * (0.5 + rng(i + 50) * 0.8); // varied distance
    verts.push(new THREE.Vector3(
      Math.cos(theta) * radiusAtY * r,
      y * r * (0.6 + rng(i + 70) * 0.8),
      Math.sin(theta) * radiusAtY * r
    ));
  }

  // Build convex hull using ConvexGeometry approach:
  // Use Three.js ConvexGeometry via manual triangulation
  const geo = new ConvexGeometry(verts);

  // Non-uniform stretch for variety
  const sx = 0.7 + rng(100) * 0.7;
  const sy = 0.5 + rng(101) * 1.0;
  const sz = 0.7 + rng(102) * 0.7;
  geo.scale(sx, sy, sz);
  geo.computeVertexNormals();

  const edgesGeo = new THREE.EdgesGeometry(geo, 1);
  const arr = new Float32Array(edgesGeo.attributes.position.array);
  edgesGeo.dispose();

  return { geo, edges: arr };
}

/* ── Single Asteroid ── */
function Asteroid({ seed, radius, position: pos, rotSpeed }: {
  seed: number; radius: number; position: [number, number, number];
  rotSpeed: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const { geo, edges } = useMemo(() => buildPolyhedronAsteroid(seed, radius), [seed, radius]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += rotSpeed[0] * dt;
    ref.current.rotation.y += rotSpeed[1] * dt;
    ref.current.rotation.z += rotSpeed[2] * dt;
  });

  return (
    <group ref={ref} position={pos}>
      <mesh geometry={geo} renderOrder={0}>
        <meshBasicMaterial color="#000000" side={THREE.FrontSide} depthWrite polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments renderOrder={1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.85} depthTest />
      </lineSegments>
    </group>
  );
}

/* ── Asteroid field ── */
const ASTEROIDS = (() => {
  const rng = (i: number, off: number) => {
    let x = Math.sin(i * 127.1 + off * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return Array.from({ length: 18 }, (_, i) => ({
    seed: i * 17 + 3,
    radius: 1.5 + rng(i, 0) * 6,
    position: [
      15 + rng(i, 1) * 80,
      rng(i, 2) * 30 - 15,
      rng(i, 3) * 60 - 30,
    ] as [number, number, number],
    rotSpeed: [
      (rng(i, 7) - 0.5) * 0.2,
      (rng(i, 8) - 0.5) * 0.3,
      (rng(i, 9) - 0.5) * 0.15,
    ] as [number, number, number],
  }));
})();

/* ── First-person camera ── */
function CockpitCamera() {
  const { camera } = useThree();
  const t = useRef(0);

  const curve = useMemo(() => {
    const waypoints = [
      new THREE.Vector3(-10, 0, 0),
      ...ASTEROIDS.slice(0, 10).map((a, i) => {
        const off = ((i % 3) - 1) * 6;
        return new THREE.Vector3(
          a.position[0] + off,
          a.position[1] + ((i % 2) ? 5 : -4),
          a.position[2] + off
        );
      }),
      new THREE.Vector3(100, 4, -5),
      new THREE.Vector3(80, -4, -20),
      new THREE.Vector3(40, 3, -10),
      new THREE.Vector3(10, -2, 8),
      new THREE.Vector3(-10, 0, 0),
    ];
    return new THREE.CatmullRomCurve3(waypoints, true, 'centripetal', 0.5);
  }, []);

  useFrame((_, dt) => {
    t.current += dt * 0.01;
    const p = t.current % 1;
    camera.position.copy(curve.getPointAt(p));
    camera.lookAt(curve.getPointAt((p + 0.02) % 1));
  });

  return null;
}

/* ── Cockpit overlay ── */
function CockpitHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ fontFamily: '"Courier New", monospace' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,170,0.08) 2px, rgba(0,255,170,0.08) 4px)',
      }} />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <path d="M 0 880 Q 960 780 1920 880 L 1920 1080 L 0 1080 Z" fill={BG} stroke={LINE_COLOR} strokeWidth="1.5" opacity="0.5" />
        <path d="M 100 920 Q 960 850 1820 920" fill="none" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.2" />
        <polygon points="0,0 110,0 60,1080 0,1080" fill={BG} stroke={LINE_COLOR} strokeWidth="1" opacity="0.35" />
        <polygon points="1920,0 1810,0 1860,1080 1920,1080" fill={BG} stroke={LINE_COLOR} strokeWidth="1" opacity="0.35" />
        <polygon points="0,0 1920,0 1920,50 1100,30 820,30 0,50" fill={BG} stroke={LINE_COLOR} strokeWidth="0.8" opacity="0.3" />
        <line x1="60" y1="1080" x2="500" y2="780" stroke={LINE_COLOR} strokeWidth="1" opacity="0.25" />
        <line x1="1860" y1="1080" x2="1420" y2="780" stroke={LINE_COLOR} strokeWidth="1" opacity="0.25" />
        <rect x="820" y="910" width="280" height="90" rx="3" fill="none" stroke={LINE_COLOR} strokeWidth="0.8" opacity="0.3" />
        <line x1="860" y1="935" x2="1060" y2="935" stroke={LINE_COLOR} strokeWidth="0.4" opacity="0.15" />
        <line x1="860" y1="955" x2="1060" y2="955" stroke={LINE_COLOR} strokeWidth="0.4" opacity="0.15" />
        <line x1="860" y1="975" x2="1000" y2="975" stroke={LINE_COLOR} strokeWidth="0.4" opacity="0.15" />
        <circle cx="960" cy="440" r="35" fill="none" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.18" />
        <circle cx="960" cy="440" r="12" fill="none" stroke={LINE_COLOR} strokeWidth="0.3" opacity="0.12" strokeDasharray="3 3" />
        <line x1="960" y1="395" x2="960" y2="415" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.18" />
        <line x1="960" y1="465" x2="960" y2="485" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.18" />
        <line x1="915" y1="440" x2="935" y2="440" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.18" />
        <line x1="985" y1="440" x2="1005" y2="440" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.18" />
      </svg>

      <div className="absolute top-14 left-20 text-[11px] tracking-[0.2em] uppercase" style={{ color: LINE_COLOR }}>
        <div className="opacity-45">FORWARD VIEW</div>
        <div className="opacity-25 mt-1">SECTOR 9 · BELT DELTA-7</div>
      </div>
      <div className="absolute top-14 right-20 text-[11px] text-right tracking-[0.15em]" style={{ color: LINE_COLOR }}>
        <div className="opacity-45">SPEED: 284 M/S</div>
        <div className="opacity-25 mt-1">FUEL: ██████████ 92%</div>
        <div className="opacity-25">HULL: ██████████ 100%</div>
      </div>
      <div className="absolute bottom-32 left-20 text-[10px] tracking-[0.15em]" style={{ color: LINE_COLOR }}>
        <div className="opacity-25">CONTACTS: 18</div>
        <div className="opacity-25">THREAT: NONE</div>
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase opacity-20" style={{ color: LINE_COLOR }}>
        ── COBRA MK III ──
      </div>
    </div>
  );
}

export default function EliteShipScene() {
  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <CockpitCamera />
        <Stars radius={250} depth={120} count={4000} factor={2.5} saturation={0} fade speed={0.3} />
        {ASTEROIDS.map((a, i) => <Asteroid key={i} {...a} />)}
      </Canvas>
      <CockpitHUD />
    </div>
  );
}
