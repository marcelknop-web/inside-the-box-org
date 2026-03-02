import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import type { RockPhysics } from './PhysicsRocks';

const LINE_COLOR = '#33ffbb';
const EXPLOSION_INTERVAL = 45;   // max 45 seconds between explosions
const WARN_DURATION = 5;         // seconds of wireframe blinking before explosion
const FRAGMENT_COUNT = 36;       // more fragments per cluster explosion
const SETTLE_SPEED = 0.4;
const FRAGMENT_LIFETIME = 55;
const MAIN_PLANE_Y = -8;
const CLUSTER_RADIUS = 25;       // larger cluster search radius
const MIN_CLUSTER_SIZE = 3;      // minimum rocks in a cluster to explode

interface Fragment {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rx: number; ry: number; rz: number;
  rsx: number; rsy: number; rsz: number;
  radius: number;
  seed: number;
  age: number;
  alive: boolean;
  settling: boolean;
  originY: number;
  originX: number;
  originZ: number;
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
    const fadeIn = Math.min(1, fragment.age * 2);
    const fadeOut = fragment.age > FRAGMENT_LIFETIME - 10
      ? Math.max(0, (FRAGMENT_LIFETIME - fragment.age) / 10)
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

/* ── Find a cluster of nearby rocks around a seed rock ── */
function findCluster(physics: RockPhysics): number[] {
  const n = physics.count;
  if (n === 0) return [];

  // Pick a random large rock as seed
  const sorted: { idx: number; r: number }[] = [];
  for (let i = 0; i < n; i++) sorted.push({ idx: i, r: physics.radii[i] });
  sorted.sort((a, b) => b.r - a.r);
  const topCount = Math.max(5, Math.floor(n * 0.15));
  const seedIdx = sorted[Math.floor(Math.random() * topCount)].idx;

  const sx = physics.positions[seedIdx * 3];
  const sy = physics.positions[seedIdx * 3 + 1];
  const sz = physics.positions[seedIdx * 3 + 2];

  // Gather all rocks within CLUSTER_RADIUS
  const cluster: number[] = [];
  for (let i = 0; i < n; i++) {
    const ix = i * 3;
    const dx = physics.positions[ix] - sx;
    const dy = physics.positions[ix + 1] - sy;
    const dz = physics.positions[ix + 2] - sz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < CLUSTER_RADIUS) {
      cluster.push(i);
    }
  }

  return cluster.length >= MIN_CLUSTER_SIZE ? cluster : [];
}

/* ── Cluster Explosion System ── */
export function ClusterExplosion({ physics }: { physics: RockPhysics }) {
  const fragments = useRef<Fragment[]>([]);
  const timer = useRef(EXPLOSION_INTERVAL * 0.7); // first explosion after ~13s
  const [, setTick] = React.useState(0);

  // Doomed cluster state
  const doomedCluster = useRef<number[]>([]);
  const warnTimer = useRef(0);

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    timer.current += clampDt;

    const triggerAt = EXPLOSION_INTERVAL - WARN_DURATION;

    // Select doomed cluster when warning phase starts
    if (doomedCluster.current.length === 0 && timer.current >= triggerAt) {
      const cluster = findCluster(physics);
      if (cluster.length > 0) {
        doomedCluster.current = cluster;
        warnTimer.current = 0;
      }
    }

    // Warning phase: set blinkMap for cluster rocks
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

      // Compute cluster center
      let cx = 0, cy = 0, cz = 0;
      for (const idx of cluster) {
        cx += physics.positions[idx * 3];
        cy += physics.positions[idx * 3 + 1];
        cz += physics.positions[idx * 3 + 2];
      }
      cx /= cluster.length;
      cy /= cluster.length;
      cz /= cluster.length;

      // Spawn fragments from each rock in the cluster
      const fragsPerRock = Math.max(1, Math.floor(FRAGMENT_COUNT / cluster.length));
      for (const idx of cluster) {
        const rx = physics.positions[idx * 3];
        const ry = physics.positions[idx * 3 + 1];
        const rz = physics.positions[idx * 3 + 2];
        const baseRadius = physics.radii[idx];

        for (let k = 0; k < fragsPerRock; k++) {
          // Primarily vertical explosion (perpendicular to the plane)
          const lateralAngle = Math.random() * Math.PI * 2;
          const lateralSpeed = 1.0 + Math.random() * 3.0;
          const goUp = k % 2 === 0;
          const verticalSpeed = (goUp ? 1 : -1) * (6 + Math.random() * 10);

          // Spread origin for landscape settling
          const spreadX = (Math.random() - 0.5) * 14;
          const spreadZ = (Math.random() - 0.5) * 14;

          fragments.current.push({
            x: rx + (Math.random() - 0.5) * baseRadius,
            y: ry + (Math.random() - 0.5) * baseRadius * 0.5,
            z: rz + (Math.random() - 0.5) * baseRadius,
            vx: Math.cos(lateralAngle) * lateralSpeed,
            vy: verticalSpeed,
            vz: Math.sin(lateralAngle) * lateralSpeed,
            rx: 0, ry: 0, rz: 0,
            rsx: (Math.random() - 0.5) * 0.6,
            rsy: (Math.random() - 0.5) * 0.6,
            rsz: (Math.random() - 0.5) * 0.6,
            radius: baseRadius * (0.25 + Math.random() * 0.4),
            seed: Math.floor(Math.random() * 99999),
            age: 0,
            alive: true,
            settling: false,
            // Settle to spread-out positions on the plane (landscape look)
            originY: MAIN_PLANE_Y + (Math.random() - 0.5) * 1.5,
            originX: rx + spreadX,
            originZ: rz + spreadZ,
          });
        }

        // Clear blink state
        physics.blinkMap[idx] = 0;
      }

      doomedCluster.current = [];
      setTick(t => t + 1);
    }

    // Update fragments
    let needsRender = false;
    for (const f of fragments.current) {
      if (!f.alive) continue;
      f.age += clampDt;
      if (f.age > FRAGMENT_LIFETIME) { f.alive = false; needsRender = true; continue; }

      if (f.age < 6) {
        // Explosion phase: primarily vertical movement
        f.x += f.vx * clampDt;
        f.y += f.vy * clampDt;
        f.z += f.vz * clampDt;
        f.vx *= 0.98; f.vy *= 0.97; f.vz *= 0.98;
      } else {
        // Settling phase: drift toward spread-out landscape positions
        if (!f.settling) {
          f.settling = true;
          f.vx *= 0.2; f.vz *= 0.2; f.vy *= 0.1;
        }
        // Attract toward landscape target position
        const dxTarget = f.originX - f.x;
        const dyTarget = f.originY - f.y;
        const dzTarget = f.originZ - f.z;
        f.vx += dxTarget * SETTLE_SPEED * 0.3 * clampDt;
        f.vy += dyTarget * SETTLE_SPEED * clampDt;
        f.vz += dzTarget * SETTLE_SPEED * 0.3 * clampDt;
        f.vx *= 0.99; f.vy *= 0.99; f.vz *= 0.99;
        f.x += f.vx * clampDt;
        f.y += f.vy * clampDt;
        f.z += f.vz * clampDt;
      }

      f.rx += f.rsx * clampDt;
      f.ry += f.rsy * clampDt;
      f.rz += f.rsz * clampDt;
      // Slow rotation as they settle
      const rotDamp = f.settling ? 0.995 : 0.9995;
      f.rsx *= rotDamp; f.rsy *= rotDamp; f.rsz *= rotDamp;
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
