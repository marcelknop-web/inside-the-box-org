import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────
   Elite-style wireframe capital ship flyover
   ───────────────────────────────────────────── */

const LINE_COLOR = '#00ffaa';
const LINE_COLOR_DIM = '#005533';
const BG = '#000000';

/* ── Build a large capital ship geometry from line segments ── */
function buildCapitalShipLines(): Float32Array {
  const pts: number[] = [];
  const line = (a: THREE.Vector3, b: THREE.Vector3) => {
    pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  };
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  // Main hull – elongated wedge shape (Star-Destroyer-like)
  const L = 40; // length
  const W = 16; // half-width at rear
  const H = 3;  // half-height at rear
  const noseW = 1.5;
  const noseH = 0.4;

  // Key vertices
  const nose = v(L, 0, 0);
  const noseTop = v(L * 0.85, noseH, 0);
  const noseBot = v(L * 0.85, -noseH, 0);
  const noseL = v(L * 0.85, 0, -noseW);
  const noseR = v(L * 0.85, 0, noseW);

  // Rear vertices
  const rTL = v(0, H, -W);
  const rTR = v(0, H, W);
  const rBL = v(0, -H * 0.6, -W);
  const rBR = v(0, -H * 0.6, W);
  const rTC = v(0, H, 0);
  const rBC = v(0, -H * 0.6, 0);

  // Mid-section vertices
  const mX = L * 0.45;
  const mW = W * 0.75;
  const mH = H * 0.85;
  const mTL = v(mX, mH, -mW);
  const mTR = v(mX, mH, mW);
  const mBL = v(mX, -mH * 0.5, -mW);
  const mBR = v(mX, -mH * 0.5, mW);

  // Forward section
  const fX = L * 0.7;
  const fW = W * 0.35;
  const fH = H * 0.5;
  const fTL = v(fX, fH, -fW);
  const fTR = v(fX, fH, fW);
  const fBL = v(fX, -fH * 0.4, -fW);
  const fBR = v(fX, -fH * 0.4, fW);

  // ── Top surface edges ──
  line(rTL, rTC); line(rTC, rTR);
  line(rTL, mTL); line(rTR, mTR); line(rTC, v(mX, mH, 0));
  line(mTL, mTR); line(mTL, fTL); line(mTR, fTR);
  line(fTL, fTR); line(fTL, noseTop); line(fTR, noseTop);
  line(noseTop, nose);

  // ── Bottom surface edges ──
  line(rBL, rBC); line(rBC, rBR);
  line(rBL, mBL); line(rBR, mBR);
  line(mBL, mBR); line(mBL, fBL); line(mBR, fBR);
  line(fBL, fBR); line(fBL, noseBot); line(fBR, noseBot);
  line(noseBot, nose);

  // ── Side edges (connecting top to bottom) ──
  line(rTL, rBL); line(rTR, rBR);
  line(mTL, mBL); line(mTR, mBR);
  line(fTL, fBL); line(fTR, fBR);

  // ── Nose lateral lines ──
  line(noseL, nose); line(noseR, nose);
  line(fTL, noseL); line(fBL, noseL);
  line(fTR, noseR); line(fBR, noseR);

  // ── Superstructure / bridge tower ──
  const bW = 2.5, bH = 4, bD = 4;
  const bX = L * 0.25;
  const bBase = H;
  const b = [
    v(bX - bD, bBase, -bW), v(bX - bD, bBase, bW),
    v(bX + bD, bBase, -bW), v(bX + bD, bBase, bW),
    v(bX - bD * 0.6, bBase + bH, -bW * 0.5), v(bX - bD * 0.6, bBase + bH, bW * 0.5),
    v(bX + bD * 0.5, bBase + bH, -bW * 0.5), v(bX + bD * 0.5, bBase + bH, bW * 0.5),
  ];
  // Base
  line(b[0], b[1]); line(b[2], b[3]); line(b[0], b[2]); line(b[1], b[3]);
  // Top
  line(b[4], b[5]); line(b[6], b[7]); line(b[4], b[6]); line(b[5], b[7]);
  // Verticals
  line(b[0], b[4]); line(b[1], b[5]); line(b[2], b[6]); line(b[3], b[7]);

  // ── Engine nozzles at rear ──
  const enginePositions = [-W * 0.6, -W * 0.2, W * 0.2, W * 0.6];
  for (const ez of enginePositions) {
    const eR = 1.2;
    const segments = 8;
    const cx = -0.5;
    const cy = -H * 0.1;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      line(
        v(cx, cy + Math.cos(a1) * eR, ez + Math.sin(a1) * eR),
        v(cx, cy + Math.cos(a2) * eR, ez + Math.sin(a2) * eR)
      );
    }
    // Cross inside nozzle
    line(v(cx, cy - eR, ez), v(cx, cy + eR, ez));
    line(v(cx, cy, ez - eR), v(cx, cy, ez + eR));
  }

  // ── Surface panel lines for detail ──
  const panelLines = [
    [v(L * 0.15, H + 0.01, -W * 0.5), v(L * 0.55, H * 0.82, -W * 0.45)],
    [v(L * 0.15, H + 0.01, W * 0.5), v(L * 0.55, H * 0.82, W * 0.45)],
    [v(L * 0.55, H * 0.82, -W * 0.45), v(L * 0.75, H * 0.45, -W * 0.2)],
    [v(L * 0.55, H * 0.82, W * 0.45), v(L * 0.75, H * 0.45, W * 0.2)],
    // Bottom panel lines
    [v(L * 0.1, -H * 0.55, -W * 0.7), v(L * 0.5, -H * 0.42, -W * 0.5)],
    [v(L * 0.1, -H * 0.55, W * 0.7), v(L * 0.5, -H * 0.42, W * 0.5)],
    // Trench lines
    [v(L * 0.3, H * 0.95, -W * 0.15), v(L * 0.7, H * 0.48, -W * 0.08)],
    [v(L * 0.3, H * 0.95, W * 0.15), v(L * 0.7, H * 0.48, W * 0.08)],
  ];
  for (const [a, b2] of panelLines) line(a, b2);

  return new Float32Array(pts);
}

/* ── Ship component ── */
function CapitalShip() {
  const ref = useRef<THREE.Group>(null);
  const positions = useMemo(() => buildCapitalShipLines(), []);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Ship flies from far ahead, passes overhead, goes behind camera
    // Cycle every ~30 seconds
    const cycle = 35;
    const progress = (t % cycle) / cycle; // 0 → 1

    // Eased position: starts far away, approaches, passes overhead, recedes
    const rawX = (1 - progress) * 120 - 40;

    ref.current.position.x = rawX;
    ref.current.position.y = 8 + Math.sin(progress * Math.PI) * 6;
    ref.current.position.z = -2 + Math.sin(t * 0.15) * 3;

    // Subtle roll
    ref.current.rotation.x = Math.sin(t * 0.1) * 0.03;
    ref.current.rotation.z = Math.sin(t * 0.08) * 0.02;
  });

  return (
    <group ref={ref} rotation={[0, -Math.PI / 2, 0]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={LINE_COLOR} linewidth={1} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

/* ── Small escort ships ── */
function EscortShip({ offset }: { offset: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const pts: number[] = [];
    const line = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
      pts.push(ax, ay, az, bx, by, bz);
    };
    // Small fighter-like wireframe
    const s = 1.5;
    // Fuselage
    line(s * 2, 0, 0, -s, 0, 0);
    line(s * 2, 0, 0, s * 0.5, 0.2 * s, -0.3 * s);
    line(s * 2, 0, 0, s * 0.5, 0.2 * s, 0.3 * s);
    line(s * 2, 0, 0, s * 0.5, -0.15 * s, -0.3 * s);
    line(s * 2, 0, 0, s * 0.5, -0.15 * s, 0.3 * s);
    // Wings
    line(-s * 0.5, 0, 0, -s, 0, -s * 1.5);
    line(-s * 0.5, 0, 0, -s, 0, s * 1.5);
    line(s * 0.5, 0, -0.3 * s, -s, 0, -s * 1.5);
    line(s * 0.5, 0, 0.3 * s, -s, 0, s * 1.5);
    // Rear connections
    line(-s, 0, -s * 1.5, -s, 0, s * 1.5);
    line(-s, 0, 0, -s * 1.2, 0.1 * s, 0);
    // Cockpit frame
    line(s * 0.5, 0.2 * s, -0.3 * s, s * 0.5, 0.2 * s, 0.3 * s);
    line(s * 0.5, -0.15 * s, -0.3 * s, s * 0.5, -0.15 * s, 0.3 * s);
    line(s * 0.5, 0.2 * s, -0.3 * s, s * 0.5, -0.15 * s, -0.3 * s);
    line(s * 0.5, 0.2 * s, 0.3 * s, s * 0.5, -0.15 * s, 0.3 * s);
    return new Float32Array(pts);
  }, []);

  const timeRef = useRef(Math.random() * 100);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const cycle = 35;
    const progress = (t % cycle) / cycle;
    const rawX = (1 - progress) * 120 - 40;

    ref.current.position.x = rawX + offset[0];
    ref.current.position.y = 8 + Math.sin(progress * Math.PI) * 6 + offset[1];
    ref.current.position.z = -2 + offset[2] + Math.sin(t * 0.2) * 1.5;

    ref.current.rotation.z = Math.sin(t * 0.3) * 0.08;
  });

  return (
    <group ref={ref} rotation={[0, -Math.PI / 2, 0]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={LINE_COLOR_DIM} linewidth={1} transparent opacity={0.7} />
      </lineSegments>
    </group>
  );
}

/* ── Ground grid (planet surface) ── */
function GroundGrid() {
  const positions = useMemo(() => {
    const pts: number[] = [];
    const size = 200;
    const divisions = 40;
    const step = size / divisions;
    const half = size / 2;
    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step;
      pts.push(-half, 0, pos, half, 0, pos);
      pts.push(pos, 0, -half, pos, 0, half);
    }
    return new Float32Array(pts);
  }, []);

  return (
    <lineSegments position={[0, -12, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={LINE_COLOR_DIM} transparent opacity={0.15} />
    </lineSegments>
  );
}

/* ── HUD overlay ── */
function HUD() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ fontFamily: '"Courier New", monospace' }}>
      {/* Scanlines */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,170,0.1) 2px, rgba(0,255,170,0.1) 4px)',
      }} />

      {/* Top left */}
      <div className="absolute top-4 left-4 text-[11px] tracking-[0.2em] uppercase" style={{ color: LINE_COLOR }}>
        <div className="opacity-60">COMMANDER DISPLAY</div>
        <div className="opacity-40 mt-1">SECTOR 7 · GRID 42.18</div>
      </div>

      {/* Top right */}
      <div className="absolute top-4 right-4 text-[11px] text-right tracking-[0.15em]" style={{ color: LINE_COLOR }}>
        <div className="opacity-60">CAPITAL SHIP DETECTED</div>
        <div className="opacity-40 mt-1">CLASS: ANACONDA MK-IV</div>
        <div className="opacity-40">THREAT: ████████░░ 80%</div>
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-20">
          <circle cx="30" cy="30" r="20" fill="none" stroke={LINE_COLOR} strokeWidth="0.5" />
          <line x1="30" y1="5" x2="30" y2="15" stroke={LINE_COLOR} strokeWidth="0.5" />
          <line x1="30" y1="45" x2="30" y2="55" stroke={LINE_COLOR} strokeWidth="0.5" />
          <line x1="5" y1="30" x2="15" y2="30" stroke={LINE_COLOR} strokeWidth="0.5" />
          <line x1="45" y1="30" x2="55" y2="30" stroke={LINE_COLOR} strokeWidth="0.5" />
        </svg>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase opacity-30" style={{ color: LINE_COLOR }}>
        ── ELITE DEFENCE SYSTEM v3.1 ──
      </div>
    </div>
  );
}

/* ── Camera controller ── */
function CameraRig() {
  const { camera } = useThree();
  const timeRef = useRef(0);

  useEffect(() => {
    camera.position.set(0, 0, 0);
    camera.lookAt(30, 8, 0);
  }, [camera]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    // Gentle camera sway
    camera.position.y = Math.sin(t * 0.15) * 0.5;
    camera.position.z = Math.sin(t * 0.1) * 0.8;
    camera.lookAt(30, 8 + Math.sin(t * 0.12) * 1, 0);
  });

  return null;
}

/* ── Main scene ── */
export default function EliteShipScene() {
  return (
    <div className="relative w-full h-screen" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 65, near: 0.1, far: 500, position: [0, 0, 0] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <CameraRig />
        <Stars radius={200} depth={100} count={3000} factor={2} saturation={0} fade speed={0.5} />
        <CapitalShip />
        <EscortShip offset={[-12, -3, -10]} />
        <EscortShip offset={[-8, -2, 12]} />
        <EscortShip offset={[-18, 1, -15]} />
        <EscortShip offset={[-15, 2, 16]} />
        <GroundGrid />
      </Canvas>
      <HUD />
    </div>
  );
}
