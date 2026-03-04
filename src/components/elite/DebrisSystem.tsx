import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RockPhysics } from './PhysicsRocks';
import { buildShard } from './shardGeometry';

const LINE_COLOR = '#00ffaa';
const MAX_DEBRIS = 120;
const DEBRIS_LIFETIME = 8.0;

interface Debris {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rx: number; ry: number; rz: number;
  rsx: number; rsy: number; rsz: number;
  radius: number;
  seed: number;
  age: number;
  alive: boolean;
}

/* ── Single debris shard visual ── */
function DebrisShard({ debris }: { debris: Debris }) {
  const ref = useRef<THREE.Group>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const { geo, edges } = useMemo(() => buildShard(debris.seed, debris.radius), [debris.seed, debris.radius]);

  useFrame(() => {
    if (!ref.current || !debris.alive) return;
    ref.current.position.set(debris.x, debris.y, debris.z);
    ref.current.rotation.set(debris.rx, debris.ry, debris.rz);
    const fadeIn = Math.min(1, debris.age * 2);
    const fadeOut = debris.age > DEBRIS_LIFETIME - 3
      ? Math.max(0, (DEBRIS_LIFETIME - debris.age) / 3)
      : 1;
    const opacity = fadeIn * fadeOut;
    ref.current.visible = opacity > 0.02;
    ref.current.scale.setScalar(1);
    if (lineMatRef.current) lineMatRef.current.opacity = opacity * 0.8;
  });

  return (
    <group ref={ref}>
      <mesh geometry={geo} renderOrder={0}>
        <meshBasicMaterial color="#041f16" side={THREE.FrontSide} depthWrite polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments renderOrder={1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={lineMatRef} color={LINE_COLOR} transparent opacity={0.8} depthTest />
      </lineSegments>
    </group>
  );
}

/* ── Debris System: detects collisions & spawns fragments ── */

function initPool(): Debris[] {
  const pool: Debris[] = [];
  for (let i = 0; i < MAX_DEBRIS; i++) {
    pool.push({
      x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
      rx: 0, ry: 0, rz: 0, rsx: 0, rsy: 0, rsz: 0,
      radius: 1, seed: 0, age: 0, alive: false,
    });
  }
  return pool;
}

export function DebrisSystem({ physics }: { physics: RockPhysics }) {
  // Pre-allocate pool to avoid growing arrays at runtime
  const debrisPool = useRef<Debris[]>(initPool());

  const nextSlot = useRef(0);
  const [, setTick] = React.useState(0);
  const tickTimer = useRef(0);
  // Cooldown: flat arrays instead of Map to avoid iterator GC
  const cooldownKeysI = useRef(new Int32Array(200));
  const cooldownKeysJ = useRef(new Int32Array(200));
  const cooldownTimes = useRef(new Float32Array(200));
  const cooldownCount = useRef(0);

  const getCooldown = (i: number, j: number): number => {
    const ki = cooldownKeysI.current;
    const kj = cooldownKeysJ.current;
    const ct = cooldownTimes.current;
    const n = cooldownCount.current;
    for (let c = 0; c < n; c++) {
      if (ki[c] === i && kj[c] === j) return ct[c];
    }
    return 0;
  };

  const setCooldown = (i: number, j: number, time: number) => {
    const ki = cooldownKeysI.current;
    const kj = cooldownKeysJ.current;
    const ct = cooldownTimes.current;
    const n = cooldownCount.current;
    for (let c = 0; c < n; c++) {
      if (ki[c] === i && kj[c] === j) { ct[c] = time; return; }
    }
    if (n < 200) {
      ki[n] = i; kj[n] = j; ct[n] = time;
      cooldownCount.current = n + 1;
    }
  };

  const decayCooldowns = (dt: number) => {
    const ct = cooldownTimes.current;
    const ki = cooldownKeysI.current;
    const kj = cooldownKeysJ.current;
    let n = cooldownCount.current;
    let write = 0;
    for (let c = 0; c < n; c++) {
      ct[c] -= dt;
      if (ct[c] > 0) {
        if (write !== c) {
          ki[write] = ki[c]; kj[write] = kj[c]; ct[write] = ct[c];
        }
        write++;
      }
    }
    cooldownCount.current = write;
  };

  // Pre-allocated alive-index list to avoid filter() allocations
  const aliveIndices = useRef(new Int32Array(MAX_DEBRIS));
  const aliveCount = useRef(0);

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    const n = physics.count;
    const p = physics.positions;
    const v = physics.velocities;
    const r = physics.radii;

    decayCooldowns(clampDt);

    // Detect collisions
    const maxI = Math.min(n, 40);
    for (let i = 0; i < maxI; i++) {
      const ix = i * 3;
      for (let j = i + 1; j < n; j++) {
        const jx = j * 3;
        const dx = p[jx] - p[ix];
        const dy = p[jx + 1] - p[ix + 1];
        const dz = p[jx + 2] - p[ix + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        const minDist = r[i] + r[j];
        if (distSq > minDist * minDist || distSq > 400) continue;

        const dvx = v[ix] - v[jx];
        const dvy = v[ix + 1] - v[jx + 1];
        const dvz = v[ix + 2] - v[jx + 2];
        const relSpeed = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

        if (relSpeed > 0.5) {
          const ki = i < j ? i : j;
          const kj = i < j ? j : i;
          if (getCooldown(ki, kj) > 0) continue;
          setCooldown(ki, kj, 1.5);

          const cx = (p[ix] + p[jx]) * 0.5;
          const cy = (p[ix + 1] + p[jx + 1]) * 0.5;
          const cz = (p[ix + 2] + p[jx + 2]) * 0.5;
          const avgVx = (v[ix] + v[jx]) * 0.5;
          const avgVy = (v[ix + 1] + v[jx + 1]) * 0.5;
          const avgVz = (v[ix + 2] + v[jx + 2]) * 0.5;

          // Spawn debris
          const count = 1 + Math.floor(relSpeed * 1.5);
          const parentRadius = Math.min(r[i], r[j]);
          for (let k = 0; k < Math.min(count, 3); k++) {
            const slot = nextSlot.current % MAX_DEBRIS;
            nextSlot.current++;
            const d = debrisPool.current[slot];
            const spreadSpeed = 0.8 + relSpeed * 1.5;
            const angle = Math.random() * Math.PI * 2;
            d.x = cx + (Math.random() - 0.5) * parentRadius * 0.3;
            d.y = cy + (Math.random() - 0.5) * parentRadius * 0.3;
            d.z = cz + (Math.random() - 0.5) * parentRadius * 0.3;
            d.vx = avgVx * 0.2 + Math.cos(angle) * spreadSpeed;
            d.vy = avgVy * 0.2 + 2 + Math.random() * 4;
            d.vz = avgVz * 0.2 + Math.sin(angle) * spreadSpeed;
            d.rx = 0; d.ry = 0; d.rz = 0;
            d.rsx = (Math.random() - 0.5) * 2;
            d.rsy = (Math.random() - 0.5) * 2;
            d.rsz = (Math.random() - 0.5) * 2;
            d.radius = parentRadius * (0.25 + Math.random() * 0.35);
            d.seed = Math.floor(Math.random() * 99999);
            d.age = 0;
            d.alive = true;
          }
        }
      }
    }

    // Update debris
    let anyChange = false;
    const pool = debrisPool.current;
    for (let i = 0; i < MAX_DEBRIS; i++) {
      const d = pool[i];
      if (!d.alive) continue;
      d.age += clampDt;
      if (d.age > DEBRIS_LIFETIME) {
        d.alive = false;
        anyChange = true;
        continue;
      }
      d.x += d.vx * clampDt;
      d.y += d.vy * clampDt;
      d.z += d.vz * clampDt;
      d.rx += d.rsx * clampDt;
      d.ry += d.rsy * clampDt;
      d.rz += d.rsz * clampDt;
      d.rsx *= 0.999; d.rsy *= 0.999; d.rsz *= 0.999;
    }

    // Build alive list without allocating
    let ac = 0;
    const ai = aliveIndices.current;
    for (let i = 0; i < MAX_DEBRIS; i++) {
      if (pool[i].alive) { ai[ac] = i; ac++; }
    }
    aliveCount.current = ac;

    tickTimer.current += clampDt;
    if (tickTimer.current > 0.5 || anyChange) {
      tickTimer.current = 0;
      setTick(t => t + 1);
    }
  });

  // Render alive debris (reads from pre-computed indices)
  const pool = debrisPool.current;
  const ac = aliveCount.current;
  const ai = aliveIndices.current;
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < ac; i++) {
    const idx = ai[i];
    const d = pool[idx];
    elements.push(<DebrisShard key={idx} debris={d} />);
  }

  return <>{elements}</>;
}
