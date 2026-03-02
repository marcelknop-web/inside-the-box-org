import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import type { RockPhysics } from './PhysicsRocks';

const LINE_COLOR = '#00ffaa';
const MAX_DEBRIS = 300;
const DEBRIS_LIFETIME = 6.0;

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

/* ── Build a small shard geometry ── */
function buildShard(seed: number, radius: number): { geo: THREE.BufferGeometry; edges: Float32Array } {
  const rng = (i: number) => {
    let x = Math.sin(seed * 7919 + i * 104729 + 0.3) * 104729;
    return x - Math.floor(x);
  };
  const numVerts = 4 + Math.floor(rng(0) * 4); // 4-7 verts = sharp shards
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < numVerts; i++) {
    const y = 1 - (i / (numVerts - 1)) * 2;
    const ry = Math.sqrt(1 - y * y);
    const theta = (2 * Math.PI * i) / 1.618033988749895 + rng(i + 10) * 1.2;
    const r = radius * (0.3 + rng(i + 30) * 0.7);
    verts.push(new THREE.Vector3(
      Math.cos(theta) * ry * r, y * r * (0.3 + rng(i + 50) * 0.7), Math.sin(theta) * ry * r
    ));
  }
  const geo = new ConvexGeometry(verts);
  geo.computeVertexNormals();
  const edgesGeo = new THREE.EdgesGeometry(geo, 1);
  const arr = new Float32Array(edgesGeo.attributes.position.array);
  edgesGeo.dispose();
  return { geo, edges: arr };
}

/* ── Single debris shard visual ── */
function DebrisShard({ debris }: { debris: Debris }) {
  const ref = useRef<THREE.Group>(null);
  const { geo, edges } = useMemo(() => buildShard(debris.seed, debris.radius), [debris.seed, debris.radius]);

  useFrame(() => {
    if (!ref.current || !debris.alive) return;
    ref.current.position.set(debris.x, debris.y, debris.z);
    ref.current.rotation.set(debris.rx, debris.ry, debris.rz);
    const fade = Math.max(0, 1 - debris.age / DEBRIS_LIFETIME);
    const scale = fade * (0.5 + fade * 0.5); // shrink as it fades
    ref.current.scale.setScalar(scale);
    ref.current.visible = debris.alive && fade > 0.01;
  });

  return (
    <group ref={ref}>
      <mesh geometry={geo} renderOrder={0}>
        <meshBasicMaterial color="#062a1e" side={THREE.FrontSide} depthWrite polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments renderOrder={1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.7} depthTest />
      </lineSegments>
    </group>
  );
}

/* ── Debris System: detects collisions & spawns fragments ── */
export function DebrisSystem({ physics }: { physics: RockPhysics }) {
  const debrisPool = useRef<Debris[]>([]);
  const nextSlot = useRef(0);
  const prevVelSnap = useRef<Float64Array | null>(null);

  // Force re-render when new debris spawns
  const [, setTick] = React.useState(0);
  const tickTimer = useRef(0);

  const spawnDebris = (
    px: number, py: number, pz: number,
    parentVx: number, parentVy: number, parentVz: number,
    parentRadius: number, impactForce: number
  ) => {
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 shards
    for (let k = 0; k < count; k++) {
      const slot = nextSlot.current % MAX_DEBRIS;
      nextSlot.current++;

      const spreadSpeed = 0.5 + impactForce * 2.0;
      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.3) * Math.PI;

      const d: Debris = {
        x: px + (Math.random() - 0.5) * parentRadius * 0.5,
        y: py + (Math.random() - 0.5) * parentRadius * 0.5,
        z: pz + (Math.random() - 0.5) * parentRadius * 0.5,
        vx: parentVx * 0.3 + Math.cos(angle) * Math.cos(elev) * spreadSpeed,
        vy: parentVy * 0.3 + Math.sin(elev) * spreadSpeed * 0.7,
        vz: parentVz * 0.3 + Math.sin(angle) * Math.cos(elev) * spreadSpeed,
        rx: 0, ry: 0, rz: 0,
        rsx: (Math.random() - 0.5) * 3,
        rsy: (Math.random() - 0.5) * 3,
        rsz: (Math.random() - 0.5) * 3,
        radius: parentRadius * (0.15 + Math.random() * 0.25),
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

    // Detect collisions by checking overlapping pairs
    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      for (let j = i + 1; j < n; j++) {
        const jx = j * 3;
        const dx = p[jx] - p[ix];
        const dy = p[jx + 1] - p[ix + 1];
        const dz = p[jx + 2] - p[ix + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        const minDist = r[i] + r[j];
        if (distSq > minDist * minDist) continue;
        if (distSq > 400) continue; // skip distant

        const dist = Math.sqrt(distSq);
        if (dist >= minDist) continue;

        // Relative velocity
        const dvx = v[ix] - v[jx];
        const dvy = v[ix + 1] - v[jx + 1];
        const dvz = v[ix + 2] - v[jx + 2];
        const relSpeed = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

        // Only spawn debris on meaningful impacts
        if (relSpeed > 0.3) {
          const cx = (p[ix] + p[jx]) * 0.5;
          const cy = (p[ix + 1] + p[jx + 1]) * 0.5;
          const cz = (p[ix + 2] + p[jx + 2]) * 0.5;
          const avgVx = (v[ix] + v[jx]) * 0.5;
          const avgVy = (v[ix + 1] + v[jx + 1]) * 0.5;
          const avgVz = (v[ix + 2] + v[jx + 2]) * 0.5;
          spawnDebris(cx, cy, cz, avgVx, avgVy, avgVz, Math.min(r[i], r[j]), relSpeed);
        }
      }
      // Limit collision checks for performance
      if (i > 50) break;
    }

    // Update debris particles
    let anyChange = false;
    for (const d of debrisPool.current) {
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
      // Slow down
      d.vx *= 0.995;
      d.vy *= 0.995;
      d.vz *= 0.995;
      // Slight gravity
      d.vy -= 0.1 * clampDt;
    }

    // Trigger re-render periodically to pick up new debris
    tickTimer.current += clampDt;
    if (tickTimer.current > 0.5) {
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
