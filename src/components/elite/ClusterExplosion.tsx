import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import type { RockPhysics } from './PhysicsRocks';

const LINE_COLOR = '#33ffbb';
const EXPLOSION_INTERVAL = 45;
const WARN_DURATION = 5;
const FRAGMENT_COUNT = 36;
const FRAGMENT_LIFETIME = 40;
const MAIN_PLANE_Y = -8;
const CLUSTER_RADIUS = 25;
const MIN_CLUSTER_SIZE = 3;

// Realistic physics
const GRAVITY = -9.81;
const RESTITUTION = 0.3;
const GROUND_FRICTION = 0.85;
const AIR_DRAG = 0.998;
const ANGULAR_DAMPING = 0.997;
const GROUND_ANGULAR_DAMP = 0.92;
const REST_THRESHOLD = 0.15;

interface Fragment {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rx: number; ry: number; rz: number;
  rsx: number; rsy: number; rsz: number;
  radius: number;
  seed: number;
  age: number;
  alive: boolean;
  resting: boolean;
  groundY: number;
}

/* ── Build jagged shard ── */
function buildShard(seed: number, radius: number): { geo: THREE.BufferGeometry; edges: Float32Array } {
  const rng = (i: number) => {
    let x = Math.sin(seed * 7919 + i * 104729 + 0.3) * 104729;
    return x - Math.floor(x);
  };
  const numVerts = 5 + Math.floor(rng(0) * 6);
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < numVerts; i++) {
    const y = 1 - (i / (numVerts - 1)) * 2;
    const ry = Math.sqrt(1 - y * y);
    const theta = (2 * Math.PI * i) / 1.618033988749895 + rng(i + 10) * 1.2;
    const r = radius * (0.4 + rng(i + 30) * 0.6);
    verts.push(new THREE.Vector3(
      Math.cos(theta) * ry * r, y * r * (0.4 + rng(i + 50) * 0.6), Math.sin(theta) * ry * r
    ));
  }
  const geo = new ConvexGeometry(verts);
  geo.computeVertexNormals();
  const edgesGeo = new THREE.EdgesGeometry(geo, 1);
  const arr = new Float32Array(edgesGeo.attributes.position.array);
  edgesGeo.dispose();
  return { geo, edges: arr };
}

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
          const radialBias = 2 + Math.random() * 4;
          const lateralRand = (Math.random() - 0.5) * 3;
          const vx = (dirX / dirLen) * radialBias + Math.cos(angle) * lateralRand;
          const vz = (dirZ / dirLen) * radialBias + Math.sin(angle) * lateralRand;
          // Strong upward launch (realistic explosion throws debris up)
          const vy = 8 + Math.random() * 14;

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
            resting: false,
            groundY: MAIN_PLANE_Y + (Math.random() - 0.5) * 1.0,
          });
        }
        physics.blinkMap[idx] = 0;
      }

      doomedCluster.current = [];
      setTick(t => t + 1);
    }

    // Update fragments with realistic physics
    let needsRender = false;
    for (const f of fragments.current) {
      if (!f.alive) continue;
      f.age += clampDt;
      if (f.age > FRAGMENT_LIFETIME) { f.alive = false; needsRender = true; continue; }

      if (f.resting) {
        // Already at rest on ground — just age out
        f.rsx *= GROUND_ANGULAR_DAMP;
        f.rsy *= GROUND_ANGULAR_DAMP;
        f.rsz *= GROUND_ANGULAR_DAMP;
        f.rx += f.rsx * clampDt;
        f.ry += f.rsy * clampDt;
        f.rz += f.rsz * clampDt;
        continue;
      }

      // Apply gravity
      f.vy += GRAVITY * clampDt;

      // Air drag
      f.vx *= AIR_DRAG;
      f.vy *= AIR_DRAG;
      f.vz *= AIR_DRAG;

      // Integrate position
      f.x += f.vx * clampDt;
      f.y += f.vy * clampDt;
      f.z += f.vz * clampDt;

      // Ground collision (bounce)
      if (f.y <= f.groundY + f.radius * 0.3) {
        f.y = f.groundY + f.radius * 0.3;
        f.vy = -f.vy * RESTITUTION; // bounce with energy loss

        // Friction on lateral velocity
        f.vx *= GROUND_FRICTION;
        f.vz *= GROUND_FRICTION;

        // Transfer energy to angular spin on impact
        f.rsx += f.vz * 0.3;
        f.rsz -= f.vx * 0.3;

        // Check if should come to rest
        const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy + f.vz * f.vz);
        if (speed < REST_THRESHOLD && Math.abs(f.vy) < 0.3) {
          f.resting = true;
          f.vx = 0; f.vy = 0; f.vz = 0;
          f.y = f.groundY + f.radius * 0.3;
        }
      }

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
