import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import type { RockPhysics } from './PhysicsRocks';

const LINE_COLOR = '#33ffbb';
const EXPLOSION_INTERVAL = 60; // seconds between explosions
const FRAGMENT_COUNT = 12;     // pieces per explosion
const SPREAD_RADIUS = 40;      // how far fragments spread laterally
const Y_SPREAD = 60;           // how high/low they fly
const SETTLE_SPEED = 0.3;      // how fast they sink back to main plane
const FRAGMENT_LIFETIME = 45;  // seconds before fade-out complete
const MAIN_PLANE_Y = -8;       // main rock plane Y

interface Fragment {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rx: number; ry: number; rz: number;
  rsx: number; rsy: number; rsz: number;
  radius: number;
  seed: number;
  age: number;
  alive: boolean;
  settling: boolean; // true once it starts sinking back
  originY: number;   // target Y on main plane
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

    // Fade in quickly, stay, then fade out in last 10s
    const fadeIn = Math.min(1, fragment.age * 2);
    const fadeOut = fragment.age > FRAGMENT_LIFETIME - 10 
      ? Math.max(0, (FRAGMENT_LIFETIME - fragment.age) / 10) 
      : 1;
    const opacity = fadeIn * fadeOut;
    
    ref.current.visible = opacity > 0.01;
    if (lineMatRef.current) {
      lineMatRef.current.opacity = opacity * 0.7;
    }
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
        <lineBasicMaterial
          ref={lineMatRef}
          color={LINE_COLOR}
          transparent
          opacity={0.7}
          depthTest
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </lineSegments>
    </group>
  );
}

/* ── Cluster Explosion System ── */
export function ClusterExplosion({ physics }: { physics: RockPhysics }) {
  const fragments = useRef<Fragment[]>([]);
  const timer = useRef(EXPLOSION_INTERVAL * 0.7); // first explosion after ~18s
  const [, setTick] = React.useState(0);

  // Find a large rock cluster center (pick one of the bigger rocks)
  const findExplosionCenter = (): number => {
    const n = physics.count;
    if (n === 0) return -1;
    
    // Find rocks in the top 15% by radius
    const sorted: { idx: number; r: number }[] = [];
    for (let i = 0; i < n; i++) {
      sorted.push({ idx: i, r: physics.radii[i] });
    }
    sorted.sort((a, b) => b.r - a.r);
    const topCount = Math.max(3, Math.floor(n * 0.15));
    const pick = sorted[Math.floor(Math.random() * topCount)];
    return pick.idx;
  };

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    timer.current += clampDt;

    // Trigger explosion
    if (timer.current >= EXPLOSION_INTERVAL) {
      timer.current = 0;
      const centerIdx = findExplosionCenter();
      if (centerIdx >= 0) {
        const cx = physics.positions[centerIdx * 3];
        const cy = physics.positions[centerIdx * 3 + 1];
        const cz = physics.positions[centerIdx * 3 + 2];
        const baseRadius = physics.radii[centerIdx];

        for (let k = 0; k < FRAGMENT_COUNT; k++) {
          // Spread perpendicular to main plane (Y axis) – half go up, half go down
          const goUp = k < FRAGMENT_COUNT / 2;
          const angle = Math.random() * Math.PI * 2;
          const lateralSpeed = 1 + Math.random() * 3;
          const verticalSpeed = (goUp ? 1 : -1) * (2 + Math.random() * 4);
          
          const frag: Fragment = {
            x: cx + (Math.random() - 0.5) * baseRadius,
            y: cy + (Math.random() - 0.5) * baseRadius * 0.5,
            z: cz + (Math.random() - 0.5) * baseRadius,
            vx: Math.cos(angle) * lateralSpeed,
            vy: verticalSpeed,
            vz: Math.sin(angle) * lateralSpeed,
            rx: 0, ry: 0, rz: 0,
            rsx: (Math.random() - 0.5) * 0.8,
            rsy: (Math.random() - 0.5) * 0.8,
            rsz: (Math.random() - 0.5) * 0.8,
            radius: baseRadius * (0.3 + Math.random() * 0.5),
            seed: Math.floor(Math.random() * 99999),
            age: 0,
            alive: true,
            settling: false,
            originY: MAIN_PLANE_Y + (Math.random() - 0.5) * 2,
          };
          fragments.current.push(frag);
        }
        setTick(t => t + 1);
      }
    }

    // Update fragments
    let needsRender = false;
    for (const f of fragments.current) {
      if (!f.alive) continue;
      f.age += clampDt;

      if (f.age > FRAGMENT_LIFETIME) {
        f.alive = false;
        needsRender = true;
        continue;
      }

      // Phase 1: Explosive spread (first ~8 seconds)
      if (f.age < 8) {
        f.x += f.vx * clampDt;
        f.y += f.vy * clampDt;
        f.z += f.vz * clampDt;
        // Decelerate
        f.vx *= 0.98;
        f.vy *= 0.97;
        f.vz *= 0.98;
      } else {
        // Phase 2: Slowly settle back toward main plane
        if (!f.settling) {
          f.settling = true;
          // Reduce horizontal velocity
          f.vx *= 0.3;
          f.vz *= 0.3;
        }
        
        // Gentle drift toward main plane Y
        const dy = f.originY - f.y;
        f.vy += dy * SETTLE_SPEED * clampDt;
        f.vy *= 0.99; // damping
        
        f.x += f.vx * clampDt;
        f.y += f.vy * clampDt;
        f.z += f.vz * clampDt;
        
        // Very slow horizontal drift
        f.vx *= 0.999;
        f.vz *= 0.999;
      }

      // Rotation always
      f.rx += f.rsx * clampDt;
      f.ry += f.rsy * clampDt;
      f.rz += f.rsz * clampDt;
      // Slow rotation over time
      f.rsx *= 0.9995;
      f.rsy *= 0.9995;
      f.rsz *= 0.9995;
    }

    // Periodic cleanup & re-render
    if (needsRender || Math.floor(timer.current * 2) % 2 === 0) {
      // Remove very old dead fragments
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
