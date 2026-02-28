import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const LINE_COLOR = '#00ffaa';
const BG = '#000000';

/* ── Asteroid with hidden-line removal ── */
function Asteroid({ seed, radius, position: pos, rotSpeed }: {
  seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);

  const { edgePositions, geo } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(radius, 1);
    const p = g.attributes.position;
    const rng = (i: number) => {
      let x = Math.sin(seed * 9301 + i * 49297 + 0.1) * 49297;
      return x - Math.floor(x);
    };
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const len = Math.sqrt(x * x + y * y + z * z);
      const n = 0.65 + rng(i) * 0.7;
      p.setXYZ(i, (x / len) * radius * n, (y / len) * radius * n, (z / len) * radius * n);
    }
    g.computeVertexNormals();
    const edges = new THREE.EdgesGeometry(g, 12);
    const arr = new Float32Array(edges.attributes.position.array);
    edges.dispose();
    return { edgePositions: arr, geo: g };
  }, [seed, radius]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += rotSpeed[0] * dt;
    ref.current.rotation.y += rotSpeed[1] * dt;
    ref.current.rotation.z += rotSpeed[2] * dt;
  });

  return (
    <group ref={ref} position={pos}>
      {/* Black fill to occlude back-facing edges */}
      <mesh geometry={geo} renderOrder={0}>
        <meshBasicMaterial color="#000000" side={THREE.FrontSide} depthWrite polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Wireframe edges on top */}
      <lineSegments renderOrder={1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.85} depthTest />
      </lineSegments>
    </group>
  );
}

/* ── Static asteroid field ── */
const ASTEROIDS = (() => {
  const rng = (i: number, off: number) => {
    let x = Math.sin(i * 127.1 + off * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return Array.from({ length: 16 }, (_, i) => ({
    seed: i * 13 + 7,
    radius: 2 + rng(i, 0) * 6,
    position: [
      rng(i, 1) * 90 - 10,
      rng(i, 2) * 30 - 15,
      rng(i, 3) * 60 - 30,
    ] as [number, number, number],
    rotSpeed: [
      (rng(i, 7) - 0.5) * 0.25,
      (rng(i, 8) - 0.5) * 0.35,
      (rng(i, 9) - 0.5) * 0.15,
    ] as [number, number, number],
  }));
})();

/* ── First-person camera flying through field ── */
function CockpitCamera() {
  const { camera } = useThree();
  const t = useRef(0);

  const curve = useMemo(() => {
    const waypoints = [
      new THREE.Vector3(-15, 0, 0),
      ...ASTEROIDS.slice(0, 10).map((a, i) => {
        const off = ((i % 3) - 1) * 5;
        return new THREE.Vector3(a.position[0] + off, a.position[1] + ((i % 2) ? 4 : -3), a.position[2] + off);
      }),
      new THREE.Vector3(85, 5, 0),
      new THREE.Vector3(80, -5, -20),
      new THREE.Vector3(50, 2, -15),
      new THREE.Vector3(20, -3, 5),
      new THREE.Vector3(-15, 0, 0),
    ];
    return new THREE.CatmullRomCurve3(waypoints, true, 'centripetal', 0.5);
  }, []);

  useFrame((_, dt) => {
    t.current += dt * 0.01;
    const progress = t.current % 1;
    const pos = curve.getPointAt(progress);
    const lookAt = curve.getPointAt((progress + 0.02) % 1);
    camera.position.copy(pos);
    camera.lookAt(lookAt);
  });

  return null;
}

/* ── Cockpit wireframe overlay ── */
function CockpitHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ fontFamily: '"Courier New", monospace' }}>
      {/* Scanlines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,170,0.08) 2px, rgba(0,255,170,0.08) 4px)',
      }} />

      {/* Cockpit frame SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        {/* Window frame struts */}
        <line x1="0" y1="750" x2="960" y2="1080" stroke={LINE_COLOR} strokeWidth="1.5" opacity="0.4" />
        <line x1="1920" y1="750" x2="960" y2="1080" stroke={LINE_COLOR} strokeWidth="1.5" opacity="0.4" />
        <line x1="0" y1="700" x2="400" y2="1080" stroke={LINE_COLOR} strokeWidth="1" opacity="0.25" />
        <line x1="1920" y1="700" x2="1520" y2="1080" stroke={LINE_COLOR} strokeWidth="1" opacity="0.25" />
        {/* Top frame */}
        <line x1="0" y1="60" x2="700" y2="0" stroke={LINE_COLOR} strokeWidth="1" opacity="0.2" />
        <line x1="1920" y1="60" x2="1220" y2="0" stroke={LINE_COLOR} strokeWidth="1" opacity="0.2" />
        {/* Side pillars */}
        <line x1="80" y1="200" x2="0" y2="800" stroke={LINE_COLOR} strokeWidth="1.5" opacity="0.3" />
        <line x1="1840" y1="200" x2="1920" y2="800" stroke={LINE_COLOR} strokeWidth="1.5" opacity="0.3" />
        {/* Dashboard bottom */}
        <path d="M 0 880 Q 960 780 1920 880 L 1920 1080 L 0 1080 Z" fill="none" stroke={LINE_COLOR} strokeWidth="1" opacity="0.3" />
        <path d="M 200 920 Q 960 840 1720 920" fill="none" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.2" />
        {/* Center console */}
        <rect x="820" y="900" width="280" height="100" rx="4" fill="none" stroke={LINE_COLOR} strokeWidth="0.8" opacity="0.25" />
        <line x1="860" y1="930" x2="1060" y2="930" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.15" />
        <line x1="860" y1="950" x2="1060" y2="950" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.15" />
        <line x1="860" y1="970" x2="1000" y2="970" stroke={LINE_COLOR} strokeWidth="0.5" opacity="0.15" />
        {/* Targeting reticle */}
        <circle cx="960" cy="480" r="40" fill="none" stroke={LINE_COLOR} strokeWidth="0.6" opacity="0.2" />
        <circle cx="960" cy="480" r="15" fill="none" stroke={LINE_COLOR} strokeWidth="0.4" opacity="0.15" strokeDasharray="4 4" />
        <line x1="960" y1="430" x2="960" y2="450" stroke={LINE_COLOR} strokeWidth="0.6" opacity="0.2" />
        <line x1="960" y1="510" x2="960" y2="530" stroke={LINE_COLOR} strokeWidth="0.6" opacity="0.2" />
        <line x1="910" y1="480" x2="930" y2="480" stroke={LINE_COLOR} strokeWidth="0.6" opacity="0.2" />
        <line x1="990" y1="480" x2="1010" y2="480" stroke={LINE_COLOR} strokeWidth="0.6" opacity="0.2" />
      </svg>

      {/* Text readouts */}
      <div className="absolute top-5 left-5 text-[11px] tracking-[0.2em] uppercase" style={{ color: LINE_COLOR }}>
        <div className="opacity-50">FORWARD VIEW</div>
        <div className="opacity-30 mt-1">ASTEROID BELT DELTA-7</div>
      </div>
      <div className="absolute top-5 right-5 text-[11px] text-right tracking-[0.15em]" style={{ color: LINE_COLOR }}>
        <div className="opacity-50">SPEED: 284 M/S</div>
        <div className="opacity-30 mt-1">FUEL: ██████████ 92%</div>
        <div className="opacity-30">HULL: ██████████ 100%</div>
      </div>
      <div className="absolute bottom-28 left-5 text-[10px] tracking-[0.15em]" style={{ color: LINE_COLOR }}>
        <div className="opacity-30">RADAR CONTACT: 16</div>
        <div className="opacity-30">THREAT: NONE</div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase opacity-20" style={{ color: LINE_COLOR }}>
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
