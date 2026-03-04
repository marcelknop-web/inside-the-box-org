import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildPolyhedron } from './shardGeometry';

const LINE_COLOR = '#33ffbb';

/* buildPolyhedron imported from shardGeometry.ts */

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
  blinkMap: Float32Array;    // 0 = normal, >0 = blink progress (0..1) for pre-explosion warning
  infoBlink: Float32Array;   // 0 = normal, >0 = yellow info-arrival flash (decays over time)
  infoHitEdge: Int32Array;   // which edge index to highlight yellow on info hit
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

  const blinkMap = new Float32Array(n);
  const infoBlink = new Float32Array(n);
  const infoHitEdge = new Int32Array(n);

  return { positions, velocities, radii, masses, rotSpeeds, rotations, seeds, count: n, blinkMap, infoBlink, infoHitEdge };
}

const G = 0.25;           // stronger gravity to keep cluster together
const DAMPING = 0.995;    // more damping – rocks stay clumped
const SOFTENING = 3.0;    // prevents singularity at close range
const RESTITUTION = 0.2;  // softer collision – less bounce-away

export function stepPhysics(phys: RockPhysics, dt: number, mobile = false) {
  const n = phys.count;
  const p = phys.positions;
  const v = phys.velocities;
  const r = phys.radii;
  const m = phys.masses;
  const clampDt = Math.min(dt, 0.033);
  const skipDist = mobile ? 30 : 60; // tighter cutoff on mobile
  const stepSize = mobile ? 2 : 1;   // skip every other rock on mobile

  // N-body gravity (O(n²) – reduced on mobile by stepping and tighter cutoff)
  for (let i = 0; i < n; i += stepSize) {
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

      // Skip distant pairs
      if (dist > skipDist) continue;

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
/* Uses per-vertex colors so only the hit edge flashes yellow on info arrival */

// Base green color components
const BASE_R = 0.2, BASE_G = 1.0, BASE_B = 0.73;
const BASE_MOB_R = 0.33, BASE_MOB_G = 1.0, BASE_MOB_B = 0.8;
const HIT_R = 1.0, HIT_G = 0.87, HIT_B = 0.27; // #ffdd44

export function DynamicRock({ index, physics, mobile = false }: { index: number; physics: RockPhysics; mobile?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const colorAttrRef = useRef<THREE.BufferAttribute>(null);
  const { geo, edges } = useMemo(
    () => buildPolyhedron(physics.seeds[index], physics.radii[index]),
    [physics.seeds[index], physics.radii[index]]
  );

  const edgeCount = edges.length / 6; // 2 vertices × 3 coords per edge
  const colorArray = useMemo(() => {
    const arr = new Float32Array(edgeCount * 6); // 2 verts × 3 RGB per edge
    const r = mobile ? BASE_MOB_R : BASE_R;
    const g = mobile ? BASE_MOB_G : BASE_G;
    const b = mobile ? BASE_MOB_B : BASE_B;
    for (let i = 0; i < edgeCount; i++) {
      const ci = i * 6;
      arr[ci] = r; arr[ci + 1] = g; arr[ci + 2] = b;
      arr[ci + 3] = r; arr[ci + 4] = g; arr[ci + 5] = b;
    }
    return arr;
  }, [edgeCount, mobile]);

  useFrame(({ camera, clock }) => {
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

    const blink = physics.blinkMap[index];
    const ib = physics.infoBlink[index];
    const hitEdge = physics.infoHitEdge[index] % edgeCount;

    const br = mobile ? BASE_MOB_R : BASE_R;
    const bg = mobile ? BASE_MOB_G : BASE_G;
    const bb = mobile ? BASE_MOB_B : BASE_B;

    if (lineMatRef.current) {
      if (blink > 0) {
        const flickerFreq = 4 + blink * 30;
        const on = Math.sin(clock.elapsedTime * flickerFreq) > 0;
        lineMatRef.current.opacity = on ? (mobile ? 0.6 : 0.9) : 0;
        const shrink = 1 - blink * 0.7;
        ref.current.scale.setScalar(shrink);
        // All edges base color during blink
        for (let e = 0; e < edgeCount; e++) {
          const ci = e * 6;
          colorArray[ci] = br; colorArray[ci + 1] = bg; colorArray[ci + 2] = bb;
          colorArray[ci + 3] = br; colorArray[ci + 4] = bg; colorArray[ci + 5] = bb;
        }
      } else {
        ref.current.scale.setScalar(1);
        lineMatRef.current.opacity = mobile
          ? 0.25 + nearFactor * 0.45
          : 0.45 + nearFactor * 0.55;

        // Per-edge coloring: hit edge yellow, rest green
        const hasHit = ib > 0.01;
        for (let e = 0; e < edgeCount; e++) {
          const ci = e * 6;
          if (hasHit && e === hitEdge) {
            // Blend yellow based on infoBlink intensity
            const mr = br + (HIT_R - br) * ib;
            const mg = bg + (HIT_G - bg) * ib;
            const mb = bb + (HIT_B - bb) * ib;
            colorArray[ci] = mr; colorArray[ci + 1] = mg; colorArray[ci + 2] = mb;
            colorArray[ci + 3] = mr; colorArray[ci + 4] = mg; colorArray[ci + 5] = mb;
          } else {
            colorArray[ci] = br; colorArray[ci + 1] = bg; colorArray[ci + 2] = bb;
            colorArray[ci + 3] = br; colorArray[ci + 4] = bg; colorArray[ci + 5] = bb;
          }
        }
      }
      if (colorAttrRef.current) colorAttrRef.current.needsUpdate = true;
    }
  });

  return (
    <group ref={ref}>
      <mesh geometry={geo}>
        <meshBasicMaterial color="#0a1f18" side={THREE.FrontSide} depthWrite />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
          <bufferAttribute ref={colorAttrRef} attach="attributes-color" args={[colorArray, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={lineMatRef} vertexColors transparent opacity={mobile ? 0.15 : 0.2} depthTest polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </lineSegments>
    </group>
  );
}
