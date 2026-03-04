import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RockPhysics } from './PhysicsRocks';
import { buildShard } from './shardGeometry';

const LINE_COLOR = '#33ffbb';
const EXPLOSION_INTERVAL = 90;
const WARN_DURATION = 5;
const FRAGMENT_COUNT = 12;
const FRAGMENT_LIFETIME = 40;
const CLUSTER_RADIUS = 25;
const MIN_CLUSTER_SIZE = 3;

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

/* ── Find a cluster of nearby rocks ── */
function findCluster(physics: RockPhysics): number[] {
  const n = physics.count;
  if (n === 0) return [];
  const sorted: { idx: number; r: number }[] = [];
  for (let i = 0; i < n; i++) sorted.push({ idx: i, r: physics.radii[i] });
  sorted.sort((a, b) => b.r - a.r);
  const topCount = Math.max(5, Math.floor(n * 0.15));
  const seedIdx = sorted[Math.floor(Math.random() * topCount)].idx;
  const sx = physics.positions[seedIdx * 3];
  const sy = physics.positions[seedIdx * 3 + 1];
  const sz = physics.positions[seedIdx * 3 + 2];
  const cluster: number[] = [];
  for (let i = 0; i < n; i++) {
    const ix = i * 3;
    const dx = physics.positions[ix] - sx;
    const dy = physics.positions[ix + 1] - sy;
    const dz = physics.positions[ix + 2] - sz;
    if (dx * dx + dy * dy + dz * dz < CLUSTER_RADIUS * CLUSTER_RADIUS) {
      cluster.push(i);
    }
  }
  return cluster.length >= MIN_CLUSTER_SIZE ? cluster : [];
}

/* ── Cluster Explosion System ── */
export function ClusterExplosion({ physics }: { physics: RockPhysics }) {
  const fragments = useRef<Fragment[]>([]);
  const timer = useRef(EXPLOSION_INTERVAL * 0.7);
  const [, setTick] = React.useState(0);
  const doomedCluster = useRef<number[]>([]);
  const warnTimer = useRef(0);

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    timer.current += clampDt;
    const triggerAt = EXPLOSION_INTERVAL - WARN_DURATION;

    // Select doomed cluster
    if (doomedCluster.current.length === 0 && timer.current >= triggerAt) {
      const cluster = findCluster(physics);
      if (cluster.length > 0) {
        doomedCluster.current = cluster;
        warnTimer.current = 0;
      }
    }

    // Warning phase
    if (doomedCluster.current.length > 0 && timer.current < EXPLOSION_INTERVAL) {
      warnTimer.current += clampDt;
      const progress = Math.min(1, warnTimer.current / WARN_DURATION);
      for (const idx of doomedCluster.current) {
        physics.blinkMap[idx] = progress;
      }
    }

    // Trigger explosion
    if (timer.current >= EXPLOSION_INTERVAL && doomedCluster.current.length > 0) {
      timer.current = 0;
      const cluster = doomedCluster.current;

      let cx = 0, cy = 0, cz = 0;
      for (const idx of cluster) {
        cx += physics.positions[idx * 3];
        cy += physics.positions[idx * 3 + 1];
        cz += physics.positions[idx * 3 + 2];
      }
      cx /= cluster.length; cy /= cluster.length; cz /= cluster.length;

      const fragsPerRock = Math.max(1, Math.floor(FRAGMENT_COUNT / cluster.length));
      for (const idx of cluster) {
        const rx = physics.positions[idx * 3];
        const ry = physics.positions[idx * 3 + 1];
        const rz = physics.positions[idx * 3 + 2];
        const baseRadius = physics.radii[idx];

        // Direction away from cluster center (radial explosion)
        const dirX = rx - cx, dirZ = rz - cz;
        const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;

        for (let k = 0; k < fragsPerRock; k++) {
          const angle = Math.random() * Math.PI * 2;
          // Radial + random lateral speed
          const radialBias = 1.5 + Math.random() * 2.5;
          const lateralRand = (Math.random() - 0.5) * 2;
          const vx = (dirX / dirLen) * radialBias + Math.cos(angle) * lateralRand;
          const vz = (dirZ / dirLen) * radialBias + Math.sin(angle) * lateralRand;
          // Strict 50/50 up/down split
          const upward = k % 2 === 0;
          const vy = (upward ? 1 : -1) * (3 + Math.random() * 5);

          fragments.current.push({
            x: rx + (Math.random() - 0.5) * baseRadius,
            y: ry + (Math.random() - 0.5) * baseRadius * 0.5,
            z: rz + (Math.random() - 0.5) * baseRadius,
            vx, vy, vz,
            rx: 0, ry: 0, rz: 0,
            rsx: (Math.random() - 0.5) * 4,
            rsy: (Math.random() - 0.5) * 4,
            rsz: (Math.random() - 0.5) * 4,
            radius: baseRadius * (0.2 + Math.random() * 0.4),
            seed: Math.floor(Math.random() * 99999),
            age: 0,
            alive: true,
          });
        }
        physics.blinkMap[idx] = 0;
      }

      doomedCluster.current = [];
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
