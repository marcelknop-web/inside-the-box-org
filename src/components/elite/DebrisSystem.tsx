import React, { useRef, useMemo } from 'react';
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

/* buildShard imported from shardGeometry.ts */

/* ── Single debris shard visual ── */
function DebrisShard({ debris }: { debris: Debris }) {
  const ref = useRef<THREE.Group>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const { geo, edges } = useMemo(() => buildShard(debris.seed, debris.radius), [debris.seed, debris.radius]);

  useFrame(() => {
    if (!ref.current || !debris.alive) return;
    ref.current.position.set(debris.x, debris.y, debris.z);
    ref.current.rotation.set(debris.rx, debris.ry, debris.rz);
    // Smooth fade — no flickering
    const fadeIn = Math.min(1, debris.age * 2);
    const fadeOut = debris.age > DEBRIS_LIFETIME - 3
      ? Math.max(0, (DEBRIS_LIFETIME - debris.age) / 3)
      : 1;
    const opacity = fadeIn * fadeOut;
    ref.current.visible = opacity > 0.02;
    ref.current.scale.setScalar(1); // stable size, no shrinking
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
export function DebrisSystem({ physics }: { physics: RockPhysics }) {
  const debrisPool = useRef<Debris[]>([]);
  const nextSlot = useRef(0);
  const [, setTick] = React.useState(0);
  const tickTimer = useRef(0);
  // Cooldown per rock pair to avoid spam
  const collisionCooldown = useRef<Map<string, number>>(new Map());

  const spawnDebris = (
    px: number, py: number, pz: number,
    parentVx: number, parentVy: number, parentVz: number,
    parentRadius: number, impactForce: number
  ) => {
    // Fewer, larger shards — looks more substantial
    const count = 1 + Math.floor(impactForce * 1.5);
    for (let k = 0; k < Math.min(count, 3); k++) {
      const slot = nextSlot.current % MAX_DEBRIS;
      nextSlot.current++;

      const spreadSpeed = 0.8 + impactForce * 1.5;
      const angle = Math.random() * Math.PI * 2;

      const d: Debris = {
        x: px + (Math.random() - 0.5) * parentRadius * 0.3,
        y: py + (Math.random() - 0.5) * parentRadius * 0.3,
        z: pz + (Math.random() - 0.5) * parentRadius * 0.3,
        vx: parentVx * 0.2 + Math.cos(angle) * spreadSpeed,
        vy: parentVy * 0.2 + 2 + Math.random() * 4, // upward bias
        vz: parentVz * 0.2 + Math.sin(angle) * spreadSpeed,
        rx: 0, ry: 0, rz: 0,
        rsx: (Math.random() - 0.5) * 2,
        rsy: (Math.random() - 0.5) * 2,
        rsz: (Math.random() - 0.5) * 2,
        radius: parentRadius * (0.25 + Math.random() * 0.35),
        seed: Math.floor(Math.random() * 99999),
        age: 0,
        alive: true,
      };

      if (slot < debrisPool.current.length) {
        Object.assign(debrisPool.current[slot], d);
      } else {
        debrisPool.current.push(d);
      }
    }
  };

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    const n = physics.count;
    const p = physics.positions;
    const v = physics.velocities;
    const r = physics.radii;

    // Decay cooldowns
    for (const [key, val] of collisionCooldown.current) {
      if (val <= 0) collisionCooldown.current.delete(key);
      else collisionCooldown.current.set(key, val - clampDt);
    }

    // Detect collisions — limited pairs, with cooldown
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
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (collisionCooldown.current.has(key)) continue;
          collisionCooldown.current.set(key, 1.5); // 1.5s cooldown

          const cx = (p[ix] + p[jx]) * 0.5;
          const cy = (p[ix + 1] + p[jx + 1]) * 0.5;
          const cz = (p[ix + 2] + p[jx + 2]) * 0.5;
          const avgVx = (v[ix] + v[jx]) * 0.5;
          const avgVy = (v[ix + 1] + v[jx + 1]) * 0.5;
          const avgVz = (v[ix + 2] + v[jx + 2]) * 0.5;
          spawnDebris(cx, cy, cz, avgVx, avgVy, avgVz, Math.min(r[i], r[j]), relSpeed);
        }
      }
    }

    // Update debris — linear flight into space
    let anyChange = false;
    for (const d of debrisPool.current) {
      if (!d.alive) continue;
      d.age += clampDt;
      if (d.age > DEBRIS_LIFETIME) {
        d.alive = false;
        anyChange = true;
        continue;
      }

      // Linear motion — no gravity, no drag, no ground
      d.x += d.vx * clampDt;
      d.y += d.vy * clampDt;
      d.z += d.vz * clampDt;

      d.rx += d.rsx * clampDt;
      d.ry += d.rsy * clampDt;
      d.rz += d.rsz * clampDt;
      d.rsx *= 0.999; d.rsy *= 0.999; d.rsz *= 0.999;
    }

    tickTimer.current += clampDt;
    if (tickTimer.current > 0.5 || anyChange) {
      tickTimer.current = 0;
      setTick(t => t + 1);
    }
  });

  const aliveDebris = debrisPool.current.filter(d => d.alive);

  return (
    <>
      {aliveDebris.map((d, i) => (
        <DebrisShard key={`${d.seed}-${i}`} debris={d} />
      ))}
    </>
  );
}
