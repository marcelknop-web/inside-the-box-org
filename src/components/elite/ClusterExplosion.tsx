import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RockPhysics } from './PhysicsRocks';
import { buildShard } from './shardGeometry';

const LINE_COLOR = '#33ffbb';
const EXPLOSION_INTERVAL_MIN = 25;   // seconds between single-rock destructions
const EXPLOSION_INTERVAL_MAX = 55;   // varied timing keeps it fresh
const WARN_DURATION = 4;
const FRAGMENT_COUNT = 8;            // fewer, cleaner fragments per rock
const FRAGMENT_LIFETIME = 35;

// Earth gravity ~9.81 m/s²
const GRAVITY = -9.81;
const ANGULAR_DAMPING = 0.999;

interface Fragment {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rx: number; ry: number; rz: number;
  rsx: number; rsy: number; rsz: number;
  radius: number;
  seed: number;
  age: number;
  alive: boolean;
}

/* buildShard imported from shardGeometry.ts */

/* ── Single explosion fragment visual ── */
function ExplosionFragment({ fragment }: { fragment: Fragment }) {
  const ref = useRef<THREE.Group>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const { geo, edges } = useMemo(() => buildShard(fragment.seed, fragment.radius), [fragment.seed, fragment.radius]);

  useFrame(() => {
    if (!ref.current || !fragment.alive) return;
    ref.current.position.set(fragment.x, fragment.y, fragment.z);
    ref.current.rotation.set(fragment.rx, fragment.ry, fragment.rz);
    const fadeIn = Math.min(1, fragment.age * 3);
    const fadeOut = fragment.age > FRAGMENT_LIFETIME - 8
      ? Math.max(0, (FRAGMENT_LIFETIME - fragment.age) / 8)
      : 1;
    const opacity = fadeIn * fadeOut;
    ref.current.visible = opacity > 0.01;
    if (lineMatRef.current) lineMatRef.current.opacity = opacity * 0.7;
  });

  return (
    <group ref={ref}>
      <mesh geometry={geo}>
        <meshBasicMaterial colorWrite={false} side={THREE.FrontSide} />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={lineMatRef} color={LINE_COLOR} transparent opacity={0.7} depthTest polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </lineSegments>
    </group>
  );
}

/* ── Pick a single rock to destroy (varied selection) ── */
function pickDoomedRock(physics: RockPhysics): number {
  const n = physics.count;
  if (n === 0) return -1;
  // Weighted toward medium-large rocks for visual impact, but occasionally small ones too
  const roll = Math.random();
  if (roll < 0.6) {
    // Pick from top 25% by size
    let bestIdx = 0;
    let bestR = 0;
    const tries = Math.min(n, 20);
    for (let a = 0; a < tries; a++) {
      const idx = Math.floor(Math.random() * n);
      if (physics.radii[idx] > bestR) { bestR = physics.radii[idx]; bestIdx = idx; }
    }
    return bestIdx;
  }
  // Otherwise fully random
  return Math.floor(Math.random() * n);
}

function randomInterval(): number {
  return EXPLOSION_INTERVAL_MIN + Math.random() * (EXPLOSION_INTERVAL_MAX - EXPLOSION_INTERVAL_MIN);
}

/* ── Single Rock Explosion System ── */
export function ClusterExplosion({ physics }: { physics: RockPhysics }) {
  const fragments = useRef<Fragment[]>([]);
  const nextInterval = useRef(randomInterval() * 0.6);
  const timer = useRef(0);
  const [, setTick] = React.useState(0);
  const doomedRock = useRef(-1);
  const warnTimer = useRef(0);

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    timer.current += clampDt;
    const triggerAt = nextInterval.current - WARN_DURATION;

    // Select doomed rock
    if (doomedRock.current < 0 && timer.current >= triggerAt) {
      const idx = pickDoomedRock(physics);
      if (idx >= 0) {
        doomedRock.current = idx;
        warnTimer.current = 0;
      }
    }

    // Warning phase — single rock blinks
    if (doomedRock.current >= 0 && timer.current < nextInterval.current) {
      warnTimer.current += clampDt;
      const progress = Math.min(1, warnTimer.current / WARN_DURATION);
      physics.blinkMap[doomedRock.current] = progress;
    }

    // Trigger explosion — single rock
    if (timer.current >= nextInterval.current && doomedRock.current >= 0) {
      timer.current = 0;
      nextInterval.current = randomInterval(); // next interval is different
      const idx = doomedRock.current;

      const rx = physics.positions[idx * 3];
      const ry = physics.positions[idx * 3 + 1];
      const rz = physics.positions[idx * 3 + 2];
      const baseRadius = physics.radii[idx];

      // Varied fragment count per explosion (5-10)
      const fragCount = 5 + Math.floor(Math.random() * (FRAGMENT_COUNT - 4));

      for (let k = 0; k < fragCount; k++) {
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI;
        // Varied ejection speed — some lazy, some fast
        const speed = 1.5 + Math.random() * 4;
        const vx = Math.cos(angle) * Math.cos(elevation) * speed;
        const vz = Math.sin(angle) * Math.cos(elevation) * speed;
        const vy = Math.sin(elevation) * speed + (Math.random() - 0.5) * 2;

        fragments.current.push({
          x: rx + (Math.random() - 0.5) * baseRadius * 0.6,
          y: ry + (Math.random() - 0.5) * baseRadius * 0.4,
          z: rz + (Math.random() - 0.5) * baseRadius * 0.6,
          vx, vy, vz,
          rx: 0, ry: 0, rz: 0,
          rsx: (Math.random() - 0.5) * 3,
          rsy: (Math.random() - 0.5) * 3,
          rsz: (Math.random() - 0.5) * 3,
          radius: baseRadius * (0.15 + Math.random() * 0.35),
          seed: Math.floor(Math.random() * 99999),
          age: 0,
          alive: true,
        });
      }
      physics.blinkMap[idx] = 0;

      doomedRock.current = -1;
      setTick(t => t + 1);
    }

    // Update fragments — earth gravity pulls them down
    let needsRender = false;
    for (const f of fragments.current) {
      if (!f.alive) continue;
      f.age += clampDt;
      if (f.age > FRAGMENT_LIFETIME) { f.alive = false; needsRender = true; continue; }

      // Apply gravity to vertical velocity
      f.vy += GRAVITY * clampDt;

      f.x += f.vx * clampDt;
      f.y += f.vy * clampDt;
      f.z += f.vz * clampDt;

      // Angular motion
      f.rx += f.rsx * clampDt;
      f.ry += f.rsy * clampDt;
      f.rz += f.rsz * clampDt;
      f.rsx *= ANGULAR_DAMPING;
      f.rsy *= ANGULAR_DAMPING;
      f.rsz *= ANGULAR_DAMPING;
    }

    if (needsRender || Math.floor(timer.current * 2) % 2 === 0) {
      fragments.current = fragments.current.filter(f => f.alive || f.age < FRAGMENT_LIFETIME + 5);
      setTick(t => t + 1);
    }
  });

  const alive = fragments.current.filter(f => f.alive);

  return (
    <>
      {alive.map((f, i) => (
        <ExplosionFragment key={`${f.seed}-${i}`} fragment={f} />
      ))}
    </>
  );
}
