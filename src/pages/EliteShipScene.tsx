import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const LINE_COLOR = '#00ffaa';
const LINE_COLOR_DIM = '#005533';
const BG = '#000000';

/* ── Asteroid: low-poly displaced icosahedron ── */
function buildAsteroidLines(seed: number, radius: number): Float32Array {
  const geo = new THREE.IcosahedronGeometry(radius, 1); // detail=1 → clean low-poly
  const pos = geo.attributes.position;
  const rng = (i: number) => {
    let x = Math.sin(seed * 9301 + i * 49297 + 0.1) * 49297;
    return x - Math.floor(x);
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const len = Math.sqrt(x * x + y * y + z * z);
    const n = 0.65 + rng(i) * 0.7;
    pos.setXYZ(i, (x / len) * radius * n, (y / len) * radius * n, (z / len) * radius * n);
  }
  const edges = new THREE.EdgesGeometry(geo, 1);
  const arr = new Float32Array(edges.attributes.position.array);
  geo.dispose();
  edges.dispose();
  return arr;
}

function Asteroid({ seed, radius, position: pos, rotSpeed }: {
  seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const positions = useMemo(() => buildAsteroidLines(seed, radius), [seed, radius]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += rotSpeed[0] * dt;
    ref.current.rotation.y += rotSpeed[1] * dt;
    ref.current.rotation.z += rotSpeed[2] * dt;
  });

  return (
    <group ref={ref} position={pos}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.8} />
      </lineSegments>
    </group>
  );
}

/* ── Ship wireframe ── */
function buildShipLines(): Float32Array {
  const pts: number[] = [];
  const l = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
    pts.push(ax, ay, az, bx, by, bz);
  };
  const s = 0.7;
  // Nose
  l(s * 3, 0, 0, s, 0.3 * s, -0.5 * s);
  l(s * 3, 0, 0, s, 0.3 * s, 0.5 * s);
  l(s * 3, 0, 0, s, -0.2 * s, -0.5 * s);
  l(s * 3, 0, 0, s, -0.2 * s, 0.5 * s);
  // Cockpit box
  l(s, 0.3 * s, -0.5 * s, s, 0.3 * s, 0.5 * s);
  l(s, -0.2 * s, -0.5 * s, s, -0.2 * s, 0.5 * s);
  l(s, 0.3 * s, -0.5 * s, s, -0.2 * s, -0.5 * s);
  l(s, 0.3 * s, 0.5 * s, s, -0.2 * s, 0.5 * s);
  // Wings
  l(s, 0, -0.5 * s, -s, 0, -2 * s);
  l(s, 0, 0.5 * s, -s, 0, 2 * s);
  l(-s, 0, -2 * s, -s * 1.3, 0, -2 * s);
  l(-s, 0, 2 * s, -s * 1.3, 0, 2 * s);
  // Wing tips to rear
  l(-s * 1.3, 0, -2 * s, -s * 1.5, 0.15 * s, -1.8 * s);
  l(-s * 1.3, 0, 2 * s, -s * 1.5, 0.15 * s, 1.8 * s);
  // Body rear
  l(s, 0.3 * s, -0.5 * s, -s, 0.2 * s, -0.6 * s);
  l(s, 0.3 * s, 0.5 * s, -s, 0.2 * s, 0.6 * s);
  l(s, -0.2 * s, -0.5 * s, -s, -0.15 * s, -0.6 * s);
  l(s, -0.2 * s, 0.5 * s, -s, -0.15 * s, 0.6 * s);
  // Rear plate
  l(-s, 0.2 * s, -0.6 * s, -s, 0.2 * s, 0.6 * s);
  l(-s, -0.15 * s, -0.6 * s, -s, -0.15 * s, 0.6 * s);
  l(-s, 0.2 * s, -0.6 * s, -s, -0.15 * s, -0.6 * s);
  l(-s, 0.2 * s, 0.6 * s, -s, -0.15 * s, 0.6 * s);
  // Engine glow lines
  l(-s * 1.1, 0.05 * s, -0.3 * s, -s * 1.6, 0.05 * s, -0.3 * s);
  l(-s * 1.1, 0.05 * s, 0.3 * s, -s * 1.6, 0.05 * s, 0.3 * s);
  return new Float32Array(pts);
}

/* ── Asteroid positions (static) ── */
const ASTEROIDS = (() => {
  const rng = (i: number, off: number) => {
    let x = Math.sin(i * 127.1 + off * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return Array.from({ length: 14 }, (_, i) => ({
    seed: i * 13 + 7,
    radius: 2 + rng(i, 0) * 5,
    position: [
      rng(i, 1) * 80 - 10,
      rng(i, 2) * 30 - 15,
      rng(i, 3) * 60 - 30,
    ] as [number, number, number],
    rotSpeed: [
      (rng(i, 7) - 0.5) * 0.3,
      (rng(i, 8) - 0.5) * 0.4,
      (rng(i, 9) - 0.5) * 0.2,
    ] as [number, number, number],
  }));
})();

/* ── Ship + camera follow path between asteroids ── */
function ShipAndCamera() {
  const shipRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const shipGeo = useMemo(() => buildShipLines(), []);
  const t = useRef(0);

  // Build a smooth flight path that weaves between asteroid positions
  const curve = useMemo(() => {
    const waypoints = [
      new THREE.Vector3(-15, 0, 0),
      ...ASTEROIDS.slice(0, 10).map((a, i) => {
        // Offset from asteroid so ship flies NEAR but not through
        const off = ((i % 3) - 1) * 5;
        return new THREE.Vector3(a.position[0] + off, a.position[1] + ((i % 2) ? 3 : -3), a.position[2] + off);
      }),
      new THREE.Vector3(85, 5, 0),
      new THREE.Vector3(90, 0, -10),
      new THREE.Vector3(80, -5, -20),
      new THREE.Vector3(50, 2, -15),
      new THREE.Vector3(20, -3, 5),
      new THREE.Vector3(-15, 0, 0),
    ];
    return new THREE.CatmullRomCurve3(waypoints, true, 'centripetal', 0.5);
  }, []);

  useFrame((_, dt) => {
    if (!shipRef.current) return;
    t.current += dt * 0.012; // speed
    const progress = t.current % 1;

    const pos = curve.getPointAt(progress);
    const lookAhead = curve.getPointAt((progress + 0.015) % 1);
    const lookFar = curve.getPointAt((progress + 0.04) % 1);

    // Ship position & orientation
    shipRef.current.position.copy(pos);
    shipRef.current.lookAt(lookAhead);

    // Camera follows behind and slightly above
    const behind = curve.getPointAt((progress - 0.025 + 1) % 1);
    const up = new THREE.Vector3(0, 1, 0);
    const shipDir = lookAhead.clone().sub(pos).normalize();
    const camOffset = shipDir.clone().multiplyScalar(-4).add(up.clone().multiplyScalar(1.8));

    camera.position.lerp(pos.clone().add(camOffset), 0.05);
    camera.lookAt(lookFar);
  });

  return (
    <group ref={shipRef}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[shipGeo, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={'#ffffff'} transparent opacity={0.95} />
      </lineSegments>
    </group>
  );
}

/* ── HUD ── */
function HUD() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ fontFamily: '"Courier New", monospace' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,170,0.08) 2px, rgba(0,255,170,0.08) 4px)',
      }} />
      <div className="absolute top-4 left-4 text-[11px] tracking-[0.2em] uppercase" style={{ color: LINE_COLOR }}>
        <div className="opacity-60">NAVIGATION ACTIVE</div>
        <div className="opacity-35 mt-1">ASTEROID BELT DELTA-7</div>
      </div>
      <div className="absolute top-4 right-4 text-[11px] text-right tracking-[0.15em]" style={{ color: LINE_COLOR }}>
        <div className="opacity-60">AUTOPILOT ENGAGED</div>
        <div className="opacity-35 mt-1">SHIELDS: ██████████ 100%</div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase opacity-25" style={{ color: LINE_COLOR }}>
        ── ELITE NAVIGATION v3.1 ──
      </div>
    </div>
  );
}

export default function EliteShipScene() {
  return (
    <div className="relative w-full h-screen" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 65, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <Stars radius={250} depth={120} count={4000} factor={2.5} saturation={0} fade speed={0.3} />
        {ASTEROIDS.map((a, i) => <Asteroid key={i} {...a} />)}
        <ShipAndCamera />
      </Canvas>
      <HUD />
    </div>
  );
}
