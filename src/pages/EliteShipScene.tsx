import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const LINE_COLOR = '#00ffaa';
const LINE_COLOR_DIM = '#005533';
const BG = '#000000';

/* ── Generate irregular asteroid geometry as edge lines ── */
function buildAsteroidLines(seed: number, radius: number, detail: number = 2): Float32Array {
  // Create icosahedron and displace vertices for rocky shape
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;

  // Seeded pseudo-random
  const rng = (i: number) => {
    let x = Math.sin(seed * 9301 + i * 49297 + 0.1) * 49297;
    return x - Math.floor(x);
  };

  // Displace each vertex for irregular rocky surface
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.sqrt(x * x + y * y + z * z);
    const noise = 0.6 + rng(i) * 0.8; // 0.6 – 1.4 scale
    const nx = (x / len) * radius * noise;
    const ny = (y / len) * radius * noise;
    const nz = (z / len) * radius * noise;
    pos.setXYZ(i, nx, ny, nz);
  }
  geo.computeVertexNormals();

  // Extract edges
  const edges = new THREE.EdgesGeometry(geo, 15);
  const arr = edges.attributes.position.array as Float32Array;
  geo.dispose();
  edges.dispose();
  return arr;
}

/* ── Single Asteroid ── */
function Asteroid({ seed, radius, startPos, speed, rotSpeed }: {
  seed: number;
  radius: number;
  startPos: [number, number, number];
  speed: [number, number, number];
  rotSpeed: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const positions = useMemo(() => buildAsteroidLines(seed, radius, radius > 4 ? 3 : 2), [seed, radius]);
  const opacity = radius > 6 ? 0.9 : radius > 3 ? 0.7 : 0.5;

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += rotSpeed[0] * delta;
    ref.current.rotation.y += rotSpeed[1] * delta;
    ref.current.rotation.z += rotSpeed[2] * delta;

    ref.current.position.x += speed[0] * delta;
    ref.current.position.y += speed[1] * delta;
    ref.current.position.z += speed[2] * delta;

    // Wrap around when out of view
    if (ref.current.position.x < -80) ref.current.position.x = 100;
    if (ref.current.position.x > 120) ref.current.position.x = -80;
    if (ref.current.position.z < -80) ref.current.position.z = 80;
    if (ref.current.position.z > 80) ref.current.position.z = -80;
  });

  return (
    <group ref={ref} position={startPos}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={opacity} />
      </lineSegments>
    </group>
  );
}

/* ── Generate asteroid field config ── */
function useAsteroidField(count: number) {
  return useMemo(() => {
    const rng = (i: number, off: number) => {
      let x = Math.sin(i * 127.1 + off * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      seed: i * 17 + 3,
      radius: 1.5 + rng(i, 0) * 7,
      startPos: [
        rng(i, 1) * 160 - 60,
        rng(i, 2) * 40 - 20,
        rng(i, 3) * 120 - 60,
      ] as [number, number, number],
      speed: [
        (rng(i, 4) - 0.5) * 3,
        (rng(i, 5) - 0.5) * 0.8,
        (rng(i, 6) - 0.5) * 2,
      ] as [number, number, number],
      rotSpeed: [
        (rng(i, 7) - 0.5) * 0.6,
        (rng(i, 8) - 0.5) * 0.8,
        (rng(i, 9) - 0.5) * 0.4,
      ] as [number, number, number],
    }));
  }, [count]);
}

/* ── Camera ── */
function CameraRig() {
  const { camera } = useThree();
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    const tt = t.current;
    camera.position.set(
      Math.sin(tt * 0.05) * 5,
      Math.sin(tt * 0.08) * 2,
      Math.cos(tt * 0.04) * 5,
    );
    camera.lookAt(20, 0, 0);
  });

  return null;
}

/* ── HUD ── */
function HUD() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ fontFamily: '"Courier New", monospace' }}>
      {/* Scanlines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,170,0.08) 2px, rgba(0,255,170,0.08) 4px)',
      }} />

      <div className="absolute top-4 left-4 text-[11px] tracking-[0.2em] uppercase" style={{ color: LINE_COLOR }}>
        <div className="opacity-60">ASTEROID FIELD SCANNER</div>
        <div className="opacity-35 mt-1">SECTOR 9 · BELT DELTA-7</div>
      </div>

      <div className="absolute top-4 right-4 text-[11px] text-right tracking-[0.15em]" style={{ color: LINE_COLOR }}>
        <div className="opacity-60">OBJECTS TRACKED</div>
        <div className="opacity-35 mt-1">DENSITY: HIGH</div>
        <div className="opacity-35">COLLISION: ████████░░</div>
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="80" height="80" viewBox="0 0 80 80" className="opacity-15">
          <circle cx="40" cy="40" r="25" fill="none" stroke={LINE_COLOR} strokeWidth="0.5" />
          <circle cx="40" cy="40" r="12" fill="none" stroke={LINE_COLOR} strokeWidth="0.3" strokeDasharray="3 3" />
          <line x1="40" y1="8" x2="40" y2="20" stroke={LINE_COLOR} strokeWidth="0.5" />
          <line x1="40" y1="60" x2="40" y2="72" stroke={LINE_COLOR} strokeWidth="0.5" />
          <line x1="8" y1="40" x2="20" y2="40" stroke={LINE_COLOR} strokeWidth="0.5" />
          <line x1="60" y1="40" x2="72" y2="40" stroke={LINE_COLOR} strokeWidth="0.5" />
        </svg>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase opacity-25" style={{ color: LINE_COLOR }}>
        ── ASTEROIDS DEFENCE GRID v2.4 ──
      </div>
    </div>
  );
}

/* ── Main ── */
export default function EliteShipScene() {
  const asteroids = useAsteroidField(22);

  return (
    <div className="relative w-full h-screen" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 500, position: [0, 0, 0] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <CameraRig />
        <Stars radius={250} depth={120} count={4000} factor={2.5} saturation={0} fade speed={0.3} />
        {asteroids.map((a, i) => (
          <Asteroid key={i} {...a} />
        ))}
      </Canvas>
      <HUD />
    </div>
  );
}
