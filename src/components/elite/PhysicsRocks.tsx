import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

const LINE_COLOR = '#33ffbb';

/* ── Build polyhedron geometry ── */
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
      Math.cos(theta) * ry * r, y * r * (0.4 + rng(i + 70) * 0.9), Math.sin(theta) * ry * r
    ));
  }
  const geo = new ConvexGeometry(verts);
  geo.scale(0.6 + rng(100) * 0.8, 0.3 + rng(101) * 0.7, 0.6 + rng(102) * 0.8);
  geo.computeVertexNormals();
  const edgesGeo = new THREE.EdgesGeometry(geo, 1);
  const arr = new Float32Array(edgesGeo.attributes.position.array);
  edgesGeo.dispose();
  return { geo, edges: arr };
}

/* ── Physics state for all rocks ── */
export interface RockPhysics {
  positions: Float64Array;   // x,y,z per rock
  velocities: Float64Array;
  radii: Float32Array;
  masses: Float32Array;
  rotSpeeds: Float32Array;   // rx,ry,rz per rock
  rotations: Float32Array;   // current euler angles
  seeds: Int32Array;
  count: number;
}

export function createRockPhysics(
  rocks: { seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number] }[]
): RockPhysics {
  const n = rocks.length;
  const positions = new Float64Array(n * 3);
  const velocities = new Float64Array(n * 3);
  const radii = new Float32Array(n);
  const masses = new Float32Array(n);
  const rotSpeeds = new Float32Array(n * 3);
  const rotations = new Float32Array(n * 3);
  const seeds = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    const r = rocks[i];
    positions[i * 3] = r.position[0];
    positions[i * 3 + 1] = r.position[1];
    positions[i * 3 + 2] = r.position[2];
    radii[i] = r.radius;
    masses[i] = r.radius * r.radius * r.radius * 0.5; // mass ~ volume
    // Individual slow rotation speeds around all axes
    rotSpeeds[i * 3] = r.rotSpeed[0];
    rotSpeeds[i * 3 + 1] = r.rotSpeed[1];
    rotSpeeds[i * 3 + 2] = r.rotSpeed[2];
    seeds[i] = r.seed;
  }

  return { positions, velocities, radii, masses, rotSpeeds, rotations, seeds, count: n };
}

const G = 0.15;           // very gentle gravitational constant
const DAMPING = 0.999;    // minimal damping – slow drift
const SOFTENING = 3.0;    // prevents singularity at close range
const RESTITUTION = 0.3;  // soft collision elasticity

export function stepPhysics(phys: RockPhysics, dt: number) {
  const n = phys.count;
  const p = phys.positions;
  const v = phys.velocities;
  const r = phys.radii;
  const m = phys.masses;
  const clampDt = Math.min(dt, 0.033);

  // N-body gravity (O(n²) – fine for ~250 rocks if we skip distant pairs)
  for (let i = 0; i < n; i++) {
    const ix = i * 3, iy = ix + 1, iz = ix + 2;
    let ax = 0, ay = 0, az = 0;

    for (let j = i + 1; j < n; j++) {
      const jx = j * 3, jy = jx + 1, jz = jx + 2;
      const dx = p[jx] - p[ix];
      const dy = p[jy] - p[iy];
      const dz = p[jz] - p[iz];
      const distSq = dx * dx + dy * dy + dz * dz + SOFTENING * SOFTENING;
      const dist = Math.sqrt(distSq);
      const surfDist = dist - r[i] - r[j];

      // Skip very distant pairs for performance
      if (dist > 60) continue;

      const force = G * m[i] * m[j] / distSq;
      const fx = force * dx / dist;
      const fy = force * dy / dist;
      const fz = force * dz / dist;

      // Apply force (F/m = acceleration)
      ax += fx / m[i];
      ay += fy / m[i];
      az += fz / m[i];
      v[jx] -= fx / m[j] * clampDt;
      v[jy] -= fy / m[j] * clampDt;
      v[jz] -= fz / m[j] * clampDt;

      // Elastic collision
      if (surfDist < 0) {
        const nx = dx / dist, ny = dy / dist, nz = dz / dist;
        // Relative velocity along collision normal
        const dvx = v[ix] - v[jx];
        const dvy = v[iy] - v[jy];
        const dvz = v[iz] - v[jz];
        const relVn = dvx * nx + dvy * ny + dvz * nz;

        if (relVn > 0) {
          // Approaching – apply impulse
          const totalMass = m[i] + m[j];
          const impulse = (1 + RESTITUTION) * relVn / totalMass;

          v[ix] -= impulse * m[j] * nx;
          v[iy] -= impulse * m[j] * ny;
          v[iz] -= impulse * m[j] * nz;
          v[jx] += impulse * m[i] * nx;
          v[jy] += impulse * m[i] * ny;
          v[jz] += impulse * m[i] * nz;

          // Transfer rotational energy on collision
          const energyTransfer = Math.abs(relVn) * 0.02;
          phys.rotSpeeds[i * 3] += (Math.random() - 0.5) * energyTransfer;
          phys.rotSpeeds[i * 3 + 1] += (Math.random() - 0.5) * energyTransfer;
          phys.rotSpeeds[i * 3 + 2] += (Math.random() - 0.5) * energyTransfer;
          phys.rotSpeeds[j * 3] += (Math.random() - 0.5) * energyTransfer;
          phys.rotSpeeds[j * 3 + 1] += (Math.random() - 0.5) * energyTransfer;
          phys.rotSpeeds[j * 3 + 2] += (Math.random() - 0.5) * energyTransfer;
        }

        // Separate overlapping rocks
        const overlap = -surfDist * 0.5;
        p[ix] -= nx * overlap;
        p[iy] -= ny * overlap;
        p[iz] -= nz * overlap;
        p[jx] += nx * overlap;
        p[jy] += ny * overlap;
        p[jz] += nz * overlap;
      }
    }

    v[ix] += ax * clampDt;
    v[iy] += ay * clampDt;
    v[iz] += az * clampDt;
  }

  // Integrate positions + damping + rotation
  for (let i = 0; i < n; i++) {
    const ix = i * 3;
    v[ix] *= DAMPING;
    v[ix + 1] *= DAMPING;
    v[ix + 2] *= DAMPING;

    // Clamp max velocity
    const spd = Math.sqrt(v[ix] * v[ix] + v[ix + 1] * v[ix + 1] + v[ix + 2] * v[ix + 2]);
    if (spd > 8) {
      const s = 8 / spd;
      v[ix] *= s; v[ix + 1] *= s; v[ix + 2] *= s;
    }

    p[ix] += v[ix] * clampDt;
    p[ix + 1] += v[ix + 1] * clampDt;
    p[ix + 2] += v[ix + 2] * clampDt;

    // Update rotations
    phys.rotations[ix] += phys.rotSpeeds[ix] * clampDt;
    phys.rotations[ix + 1] += phys.rotSpeeds[ix + 1] * clampDt;
    phys.rotations[ix + 2] += phys.rotSpeeds[ix + 2] * clampDt;

    // Slowly decay rotation speeds back toward base rate
    phys.rotSpeeds[ix] *= 0.9995;
    phys.rotSpeeds[ix + 1] *= 0.9995;
    phys.rotSpeeds[ix + 2] *= 0.9995;
  }
}

/* ── Visual Rock (reads position from physics state) ── */
export function DynamicRock({ index, physics }: { index: number; physics: RockPhysics }) {
  const ref = useRef<THREE.Group>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const { geo, edges } = useMemo(
    () => buildPolyhedron(physics.seeds[index], physics.radii[index]),
    [physics.seeds[index], physics.radii[index]]
  );

  useFrame(({ camera }) => {
    if (!ref.current) return;
    const ix = index * 3;
    ref.current.position.set(
      physics.positions[ix],
      physics.positions[ix + 1],
      physics.positions[ix + 2]
    );
    ref.current.rotation.set(
      physics.rotations[ix],
      physics.rotations[ix + 1],
      physics.rotations[ix + 2]
    );

    // Distance-based wireframe brightness
    const dx = physics.positions[ix] - camera.position.x;
    const dy = physics.positions[ix + 1] - camera.position.y;
    const dz = physics.positions[ix + 2] - camera.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const nearFactor = Math.max(0, 1 - dist / 120);

    if (lineMatRef.current) {
      lineMatRef.current.opacity = 0.45 + nearFactor * 0.55;
    }
  });

  return (
    <group ref={ref}>
      {/* Invisible solid mesh for depth occlusion (hidden-line removal) */}
      <mesh geometry={geo}>
        <meshBasicMaterial colorWrite={false} side={THREE.FrontSide} />
      </mesh>
      {/* Visible wireframe edges with proper depth testing */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={lineMatRef} color={LINE_COLOR} transparent opacity={1.0} depthTest={true} linewidth={4} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </lineSegments>
    </group>
  );
}
