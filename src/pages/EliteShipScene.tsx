import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

const LINE_COLOR = '#00ffaa';
const BG = '#000000';

/* ── Random convex polyhedron ── */
function buildPolyhedron(seed: number, radius: number): { geo: THREE.BufferGeometry; edges: Float32Array } {
  const rng = (i: number) => {
    let x = Math.sin(seed * 9301 + i * 49297 + 0.1) * 49297;
    return x - Math.floor(x);
  };

  const numVerts = 5 + Math.floor(rng(0) * 8);
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < numVerts; i++) {
    const y = 1 - (i / (numVerts - 1)) * 2;
    const ry = Math.sqrt(1 - y * y);
    const theta = (2 * Math.PI * i) / 1.618033988749895 + rng(i + 20) * 0.8;
    const r = radius * (0.5 + rng(i + 50) * 0.8);
    verts.push(new THREE.Vector3(
      Math.cos(theta) * ry * r,
      y * r * (0.4 + rng(i + 70) * 0.9),
      Math.sin(theta) * ry * r
    ));
  }

  const geo = new ConvexGeometry(verts);
  const sx = 0.6 + rng(100) * 0.8;
  const sy = 0.3 + rng(101) * 0.7;
  const sz = 0.6 + rng(102) * 0.8;
  geo.scale(sx, sy, sz);
  geo.computeVertexNormals();

  const edgesGeo = new THREE.EdgesGeometry(geo, 1);
  const arr = new Float32Array(edgesGeo.attributes.position.array);
  edgesGeo.dispose();
  return { geo, edges: arr };
}

/* ── Single polyhedron rock ── */
function Rock({ seed, radius, position: pos, rotSpeed }: {
  seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const { geo, edges } = useMemo(() => buildPolyhedron(seed, radius), [seed, radius]);

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
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.8} depthTest />
      </lineSegments>
    </group>
  );
}

/* ── Surface: grid of polyhedra forming terrain ── */
function useSurfaceRocks() {
  return useMemo(() => {
    const rng = (i: number, off: number) => {
      let x = Math.sin(i * 127.1 + off * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const rocks: { seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number] }[] = [];
    const gridX = 20;
    const gridZ = 12;
    const spacing = 6;
    let idx = 0;
    for (let gx = 0; gx < gridX; gx++) {
      for (let gz = 0; gz < gridZ; gz++) {
        const r = 1.5 + rng(idx, 0) * 3;
        const jitterX = (rng(idx, 1) - 0.5) * spacing * 0.7;
        const jitterZ = (rng(idx, 2) - 0.5) * spacing * 0.7;
        const jitterY = (rng(idx, 3) - 0.5) * 1.5;
        rocks.push({
          seed: idx * 13 + 7,
          radius: r,
          position: [
            gx * spacing + jitterX - (gridX * spacing) / 2 + 40,
            -8 + jitterY - r * 0.15,
            gz * spacing + jitterZ - (gridZ * spacing) / 2,
          ],
          rotSpeed: [
            (rng(idx, 7) - 0.5) * 0.02,
            (rng(idx, 8) - 0.5) * 0.03,
            (rng(idx, 9) - 0.5) * 0.01,
          ],
        });
        idx++;
      }
    }
    return rocks;
  }, []);
}

/* ── Floating rocks above surface for depth ── */
function useFloatingRocks() {
  return useMemo(() => {
    const rng = (i: number, off: number) => {
      let x = Math.sin(i * 73.1 + off * 419.3) * 31758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 12 }, (_, i) => ({
      seed: i * 31 + 100,
      radius: 0.8 + rng(i, 0) * 2.5,
      position: [
        rng(i, 1) * 100 - 20,
        -3 + rng(i, 2) * 8,
        rng(i, 3) * 50 - 25,
      ] as [number, number, number],
      rotSpeed: [
        (rng(i, 7) - 0.5) * 0.15,
        (rng(i, 8) - 0.5) * 0.2,
        (rng(i, 9) - 0.5) * 0.1,
      ] as [number, number, number],
    }));
  }, []);
}

/* ── First-person camera flying over surface ── */
function CockpitCamera() {
  const { camera } = useThree();
  const t = useRef(0);

  const curve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-20, 2, 0),
      new THREE.Vector3(0, 3, -8),
      new THREE.Vector3(20, 1.5, -12),
      new THREE.Vector3(40, 4, -5),
      new THREE.Vector3(55, 2, 5),
      new THREE.Vector3(70, 3, 15),
      new THREE.Vector3(80, 1, 8),
      new THREE.Vector3(90, 4, -3),
      new THREE.Vector3(75, 2.5, -15),
      new THREE.Vector3(50, 1.5, -10),
      new THREE.Vector3(30, 3.5, 0),
      new THREE.Vector3(10, 2, 10),
      new THREE.Vector3(-10, 3, 5),
      new THREE.Vector3(-20, 2, 0),
    ];
    return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
  }, []);

  useFrame((_, dt) => {
    t.current += dt * 0.008;
    const p = t.current % 1;
    const pos = curve.getPointAt(p);
    const look = curve.getPointAt((p + 0.015) % 1);
    // Keep camera above surface
    pos.y = Math.max(pos.y, -4);
    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}

/* ── Cockpit frame – clean, no inner graphics ── */
function CockpitHUD() {
  const c = LINE_COLOR;
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        {/* ── Dashboard / lower panel ── */}
        <path d="M 0 850 Q 960 760 1920 850 L 1920 1080 L 0 1080 Z" fill={BG} stroke={c} strokeWidth="1.5" opacity="0.6" />
        <path d="M 80 890 Q 960 820 1840 890" fill="none" stroke={c} strokeWidth="0.6" opacity="0.2" />
        <path d="M 150 930 Q 960 870 1770 930" fill="none" stroke={c} strokeWidth="0.4" opacity="0.12" />

        {/* ── Left pillar ── */}
        <polygon points="0,0 90,0 50,850 0,850" fill={BG} stroke={c} strokeWidth="1" opacity="0.4" />
        <line x1="45" y1="100" x2="50" y2="750" stroke={c} strokeWidth="0.4" opacity="0.12" />

        {/* ── Right pillar ── */}
        <polygon points="1920,0 1830,0 1870,850 1920,850" fill={BG} stroke={c} strokeWidth="1" opacity="0.4" />
        <line x1="1875" y1="100" x2="1870" y2="750" stroke={c} strokeWidth="0.4" opacity="0.12" />

        {/* ── Top frame ── */}
        <polygon points="0,0 1920,0 1920,40 1080,25 840,25 0,40" fill={BG} stroke={c} strokeWidth="0.8" opacity="0.35" />

        {/* ── Lower V-struts ── */}
        <line x1="50" y1="850" x2="420" y2="760" stroke={c} strokeWidth="0.8" opacity="0.2" />
        <line x1="1870" y1="850" x2="1500" y2="760" stroke={c} strokeWidth="0.8" opacity="0.2" />

        {/* ── Instrument bezels (no content inside) ── */}
        <rect x="140" y="900" width="200" height="80" rx="4" fill="none" stroke={c} strokeWidth="0.6" opacity="0.2" />
        <rect x="860" y="895" width="200" height="85" rx="4" fill="none" stroke={c} strokeWidth="0.6" opacity="0.2" />
        <rect x="1580" y="900" width="200" height="80" rx="4" fill="none" stroke={c} strokeWidth="0.6" opacity="0.2" />
      </svg>
    </div>
  );
}

export default function EliteShipScene() {
  const surfaceRocks = useSurfaceRocks();
  const floatingRocks = useFloatingRocks();

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <CockpitCamera />
        <Stars radius={300} depth={150} count={5000} factor={2} saturation={0} fade speed={0.2} />
        {surfaceRocks.map((r, i) => <Rock key={`s${i}`} {...r} />)}
        {floatingRocks.map((r, i) => <Rock key={`f${i}`} {...r} />)}
      </Canvas>
      <CockpitHUD />
    </div>
  );
}
