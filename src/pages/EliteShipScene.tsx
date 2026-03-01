import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createRockPhysics, stepPhysics, DynamicRock, type RockPhysics } from '@/components/elite/PhysicsRocks';
import { DebrisSystem } from '@/components/elite/DebrisSystem';
import { useAudioAnalyser, type AudioAnalysis } from '@/hooks/useAudioAnalyser';
import { useFlightInput, type FlightInput } from '@/hooks/useFlightInput';

const LINE_COLOR = '#00ffaa';
const BG = '#000000';

/* ── Generate initial rock data ── */
function useInitialRocks() {
  return useMemo(() => {
    const rng = (i: number, off: number) => {
      let x = Math.sin(i * 127.1 + off * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const rocks: { seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number] }[] = [];
    // Wider spaced, jagged field – clusters with gaps between them
    const gridX = 50, gridZ = 35, spacing = 6.0;
    let idx = 0;
    for (let gx = 0; gx < gridX; gx++) {
      for (let gz = 0; gz < gridZ; gz++) {
        // Skip ~40% of positions for gaps and negative space
        const skip = rng(idx, 99);
        if (skip < 0.4) { idx++; continue; }
        
        // Cluster factor: rocks tend to group in patches
        const clusterNoise = Math.sin(gx * 0.4) * Math.cos(gz * 0.3) * 0.5 + 0.5;
        if (clusterNoise < 0.25 && rng(idx, 88) < 0.6) { idx++; continue; }
        
        const r = 0.5 + rng(idx, 0) * 2.5; // more size variation = more jagged
        rocks.push({
          seed: idx * 13 + 7, radius: r,
          position: [
            gx * spacing + (rng(idx, 1) - 0.5) * spacing * 0.9 - (gridX * spacing) / 2,
            -8 + (rng(idx, 3) - 0.5) * 1.2, // more Y variation = more jagged terrain
            gz * spacing + (rng(idx, 2) - 0.5) * spacing * 0.9 - (gridZ * spacing) / 2,
          ],
          rotSpeed: [(rng(idx, 7) - 0.5) * 0.03, (rng(idx, 8) - 0.5) * 0.04, (rng(idx, 9) - 0.5) * 0.02],
        });
        idx++;
      }
    }
    // Scattered outliers at varying heights for dramatic silhouettes
    const rng2 = (i: number, off: number) => {
      let x = Math.sin(i * 73.1 + off * 419.3) * 31758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 60; i++) {
      rocks.push({
        seed: i * 31 + 100, radius: 0.3 + rng2(i, 0) * 2.0,
        position: [rng2(i, 1) * 260 - 130, -8 + rng2(i, 2) * 5 - 1, rng2(i, 3) * 180 - 90],
        rotSpeed: [(rng2(i, 7) - 0.5) * 0.02, (rng2(i, 8) - 0.5) * 0.03, (rng2(i, 9) - 0.5) * 0.015],
      });
    }
    return rocks;
  }, []);
}

/* ── Physics simulation driver ── */
function PhysicsDriver({ physics }: { physics: RockPhysics }) {
  useFrame((_, dt) => stepPhysics(physics, dt));
  return null;
}

/* ── Information exchange: data packets flow between rocks, larger blocks = more traffic ── */
const INFO_COUNT_DESKTOP = 900;
const INFO_COUNT_MOBILE = 400;

function InfoExchange({ physics, mobile = false }: { physics: RockPhysics; mobile?: boolean }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const { camera } = useThree();
  // Sunlight direction (top-right, slightly behind) – normalised
  const sunDir = useMemo(() => new THREE.Vector3(0.6, 0.8, -0.3).normalize(), []);
  const _tmpVec = useMemo(() => new THREE.Vector3(), []);
  // Per-particle glint timing: random phase + period
  const glintData = useMemo(() => {
    const c = mobile ? INFO_COUNT_MOBILE : INFO_COUNT_DESKTOP;
    const phase = new Float32Array(c);
    const period = new Float32Array(c);
    for (let i = 0; i < c; i++) {
      phase[i] = Math.random() * 100;
      period[i] = 3 + Math.random() * 8; // glint every 3-11s
    }
    return { phase, period };
  }, [mobile]);
  const count = mobile ? INFO_COUNT_MOBILE : INFO_COUNT_DESKTOP;

  // Pre-compute cumulative weight table for size-biased rock selection
  const weightTable = useMemo(() => {
    const w = new Float32Array(physics.count);
    let sum = 0;
    for (let i = 0; i < physics.count; i++) {
      const r = physics.radii[i];
      sum += r * r; // weight ~ surface area
      w[i] = sum;
    }
    // normalise
    if (sum > 0) for (let i = 0; i < physics.count; i++) w[i] /= sum;
    return w;
  }, [physics.count, physics.radii]);

  // Pick a random rock (uniform) – used as source (any size)
  const pickRockUniform = () => Math.floor(Math.random() * physics.count);

  // Find the nearest rock that is strictly larger than rock s, within maxDist
  const findLargerNeighbour = (s: number, maxDist: number): number => {
    const sx3 = s * 3;
    const sR = physics.radii[s];
    const pp = physics.positions;
    let bestIdx = -1;
    let bestDist = maxDist;
    // Sample up to 30 candidates for performance
    const tries = Math.min(physics.count, 30);
    for (let a = 0; a < tries; a++) {
      const cand = Math.floor(Math.random() * physics.count);
      if (cand === s) continue;
      if (physics.radii[cand] <= sR * 1.15) continue; // must be meaningfully larger
      const cx3 = cand * 3;
      const ddx = pp[cx3] - pp[sx3];
      const ddy = pp[cx3 + 1] - pp[sx3 + 1];
      const ddz = pp[cx3 + 2] - pp[sx3 + 2];
      const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
      if (d > 5 && d < bestDist) {
        bestDist = d;
        bestIdx = cand;
      }
    }
    return bestIdx;
  };

  const data = useMemo(() => {
    const lp = new Float32Array(count * 6);
    const lc = new Float32Array(count * 8);
    const alive = new Uint8Array(count);
    const progress = new Float32Array(count);
    const sourceRock = new Int32Array(count).fill(-1);
    const targetRock = new Int32Array(count).fill(-1);
    const travelTime = new Float32Array(count);
    const age = new Float32Array(count);
    const curveOffset = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      lp[i * 6 + 1] = -9999;
      lp[i * 6 + 4] = -9999;
    }

    return {
      linePos: lp, lineCol: lc,
      alive, progress, sourceRock, targetRock, travelTime, age, curveOffset,
    };
  }, [count]);


  useFrame(({ clock }, dt) => {
    if (!linesRef.current) return;

    const {
      linePos: lp, lineCol: lc,
      alive, progress: prog, sourceRock: src, targetRock: tgt,
      travelTime: tt, age, curveOffset: curve,
    } = data;

    const lAttr = linesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const lcAttr = linesRef.current.geometry.attributes.color as THREE.BufferAttribute;

    const cam = camera.position;
    const pp = physics.positions;
    const n = physics.count;
    if (n === 0) return;

    const clampDt = Math.min(dt, 0.033);
    const elapsed = clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i6 = i * 6;
      const i8 = i * 8;

      // Spawn new packet
      if (!alive[i]) {
        // Continuous spawn: ~15% chance per dead particle per frame
        if (Math.random() > 0.15) {
          lp[i6 + 1] = -9999; lp[i6 + 4] = -9999;
          lc[i8 + 3] = 0; lc[i8 + 7] = 0;
          continue;
        }

        // Routing: 80% uplink (small→large), 20% downlink (large→small)
        const isDownlink = Math.random() < 0.2;
        let s: number, t: number;
        if (isDownlink) {
          // Pick a large rock as source, find a smaller neighbour
          const big = pickRockUniform();
          const small = findLargerNeighbour(big, 80); // finds rock larger than big
          // Invert: use big as source, find smaller instead
          // Re-use logic: pick uniform, accept if smaller
          let found = -1;
          const bR = physics.radii[big];
          for (let a = 0; a < 30; a++) {
            const cand = Math.floor(Math.random() * physics.count);
            if (cand === big || physics.radii[cand] >= bR * 0.85) continue;
            const cx3 = cand * 3, bx3 = big * 3;
            const ddx = pp[cx3] - pp[bx3], ddy = pp[cx3+1] - pp[bx3+1], ddz = pp[cx3+2] - pp[bx3+2];
            const d = Math.sqrt(ddx*ddx + ddy*ddy + ddz*ddz);
            if (d > 5 && d < 80) { found = cand; break; }
          }
          if (found < 0) continue;
          s = big; t = found;
        } else {
          s = pickRockUniform();
          const larger = findLargerNeighbour(s, 80);
          if (larger < 0) continue;
          t = larger;
        }
        const sx3 = s * 3;

        // Only spawn near camera
        const rdx = pp[sx3] - cam.x;
        const rdz = pp[sx3 + 2] - cam.z;
        if (rdx * rdx + rdz * rdz > 100 * 100) continue;

        src[i] = s;
        tgt[i] = t;
        age[i] = 0;
        alive[i] = 1;
        prog[i] = 0;

        // Compute travel time from distance
        const tx3 = t * 3;
        const dx = pp[tx3] - pp[sx3];
        const dy = pp[tx3 + 1] - pp[sx3 + 1];
        const dz = pp[tx3 + 2] - pp[sx3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const speed = 18 + Math.random() * 14; // variable travel speed
        tt[i] = dist / speed;

        // Random curve offset for arc trajectory
        curve[i * 2] = (Math.random() - 0.5) * 6;
        curve[i * 2 + 1] = 2 + Math.random() * 5; // upward arc

        // Start at source
        lp[i6] = pp[sx3];
        lp[i6 + 1] = pp[sx3 + 1];
        lp[i6 + 2] = pp[sx3 + 2];
        lp[i6 + 3] = pp[sx3];
        lp[i6 + 4] = pp[sx3 + 1];
        lp[i6 + 5] = pp[sx3 + 2];
      }

      age[i] += clampDt;
      prog[i] = Math.min(1, age[i] / Math.max(0.1, tt[i]));

      const s3 = src[i] * 3;
      const t3 = tgt[i] * 3;

      // Bezier arc: source → control point → target
      const t01 = prog[i];
      const inv = 1 - t01;
      // Control point: midpoint + curve offset
      const mx = (pp[s3] + pp[t3]) * 0.5 + curve[i * 2];
      const my = (pp[s3 + 1] + pp[t3 + 1]) * 0.5 + curve[i * 2 + 1];
      const mz = (pp[s3 + 2] + pp[t3 + 2]) * 0.5 + curve[i * 2] * 0.7;

      // Quadratic bezier
      const px = inv * inv * pp[s3] + 2 * inv * t01 * mx + t01 * t01 * pp[t3];
      const py = inv * inv * pp[s3 + 1] + 2 * inv * t01 * my + t01 * t01 * pp[t3 + 1];
      const pz = inv * inv * pp[s3 + 2] + 2 * inv * t01 * mz + t01 * t01 * pp[t3 + 2];

      lp[i6] = px;
      lp[i6 + 1] = py;
      lp[i6 + 2] = pz;

      // Velocity = bezier derivative for streak direction
      const dvx = 2 * (inv * (mx - pp[s3]) + t01 * (pp[t3] - mx));
      const dvy = 2 * (inv * (my - pp[s3 + 1]) + t01 * (pp[t3 + 1] - my));
      const dvz = 2 * (inv * (mz - pp[s3 + 2]) + t01 * (pp[t3 + 2] - mz));
      const spd = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz) + 0.01;

      // Rain-like long streaks
      const streakLen = Math.min(13, spd * 0.16);
      lp[i6 + 3] = px - (dvx / spd) * streakLen;
      lp[i6 + 4] = py - (dvy / spd) * streakLen;
      lp[i6 + 5] = pz - (dvz / spd) * streakLen;

      // Fade in/out at endpoints
      const edgeFade = Math.min(t01 * 5, (1 - t01) * 5, 1);

      // Distance-based brightness
      const cdx = px - cam.x;
      const cdy = py - cam.y;
      const cdz = pz - cam.z;
      const dist = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz);

      // ── Sunlight reflection: specular highlight on wire/filament ──
      const nx = dvx / spd, ny = dvy / spd, nz = dvz / spd;
      const vdx = cam.x - px, vdy = cam.y - py, vdz = cam.z - pz;
      const vdLen = Math.sqrt(vdx * vdx + vdy * vdy + vdz * vdz) + 0.001;
      const hx = sunDir.x + vdx / vdLen;
      const hy = sunDir.y + vdy / vdLen;
      const hz = sunDir.z + vdz / vdLen;
      const hLen = Math.sqrt(hx * hx + hy * hy + hz * hz) + 0.001;
      const dotTH = Math.abs(nx * hx / hLen + ny * hy / hLen + nz * hz / hLen);
      const specular = Math.pow(1 - dotTH, 4);

      // ── Occasional glint (brief intense flash) ──
      const glintPhase = (elapsed + glintData.phase[i]) % glintData.period[i];
      const glintStrength = glintPhase < 0.12
        ? Math.pow(Math.sin(glintPhase / 0.12 * Math.PI), 2) * 2.5
        : 0;

      const sunBoost = 1 + specular * 1.8 + glintStrength;
      const reflectMix = Math.min(specular * 2 + glintStrength * 0.5, 1);

      // Cyan base (#00bcd4) → Gold (#f5b800) on reflection/glint
      // Cyan RGB: 0, 0.737, 0.831  |  Gold RGB: 0.961, 0.722, 0
      if (dist < 12) {
        const td = dist / 12;
        lc[i8]     = reflectMix * 0.96;
        lc[i8 + 1] = 0.74 + reflectMix * (0.72 - 0.74);
        lc[i8 + 2] = 0.83 * (1 - reflectMix);
        lc[i8 + 4] = reflectMix * 0.85;
        lc[i8 + 5] = 0.6 + reflectMix * 0.1;
        lc[i8 + 6] = 0.7 * (1 - reflectMix);
        lc[i8 + 3] = Math.min((0.35 + td * 0.25) * edgeFade * sunBoost, 1);
        lc[i8 + 7] = 0.06 * edgeFade * sunBoost;
      } else if (dist < 70) {
        const a = Math.min((0.3 + Math.random() * 0.15) * edgeFade * sunBoost, 1);
        lc[i8]     = reflectMix * 0.96;
        lc[i8 + 1] = 0.74 + reflectMix * (0.72 - 0.74);
        lc[i8 + 2] = 0.83 * (1 - reflectMix);
        lc[i8 + 4] = reflectMix * 0.8;
        lc[i8 + 5] = 0.55 + reflectMix * 0.15;
        lc[i8 + 6] = 0.65 * (1 - reflectMix);
        lc[i8 + 3] = a;
        lc[i8 + 7] = a * 0.2;
      } else {
        const td = Math.min((dist - 70) / 80, 1);
        lc[i8]     = reflectMix * 0.7;
        lc[i8 + 1] = 0.5 + reflectMix * 0.2;
        lc[i8 + 2] = 0.6 * (1 - reflectMix);
        lc[i8 + 4] = reflectMix * 0.5;
        lc[i8 + 5] = 0.4 + reflectMix * 0.15;
        lc[i8 + 6] = 0.5 * (1 - reflectMix);
        lc[i8 + 3] = Math.min(0.2 * (1 - td) * edgeFade * sunBoost, 1);
        lc[i8 + 7] = 0;
      }

      // Kill when arrived
      if (prog[i] >= 1) {
        alive[i] = 0;
      }
    }

    lAttr.needsUpdate = true;
    lcAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.linePos, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.lineCol, 4]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
}

const STAR_COUNT_DESKTOP = 22000;
const STAR_COUNT_MOBILE = 9000;

const starVertexShader = `
  attribute float size;
  attribute float brightness;
  varying vec3 vColor;
  varying float vBrightness;
  void main() {
    vColor = color;
    vBrightness = brightness;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (320.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.8, 48.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vBrightness;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    
    // Airy disk approximation (realistic point spread function)
    float core = exp(-r * r * 80.0); // tight bright core
    float inner = exp(-r * r * 12.0) * 0.5; // inner glow
    float outer = exp(-r * r * 3.0) * 0.15; // outer halo
    
    // Subtle diffraction spikes (4-point cross)
    float spikes = 0.0;
    if (vBrightness > 0.6) {
      float sx = exp(-abs(uv.y) * 25.0) * exp(-abs(uv.x) * 6.0);
      float sy = exp(-abs(uv.x) * 25.0) * exp(-abs(uv.y) * 6.0);
      spikes = (sx + sy) * 0.12 * (vBrightness - 0.6) * 2.5;
    }
    
    float intensity = core + inner + outer + spikes;
    intensity *= vBrightness;
    intensity = max(intensity, 0.09 * vBrightness);
    
    // Chromatic fringing on bright stars
    vec3 col = vColor;
    if (vBrightness > 0.7) {
      float fringe = outer * (vBrightness - 0.7) * 3.0;
      col += vec3(-0.05, 0.0, 0.08) * fringe;
    }
    
    gl_FragColor = vec4(col * intensity, intensity);
  }
`;

function RealisticStarfield({ mobile = false }: { mobile?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const starCount = mobile ? STAR_COUNT_MOBILE : STAR_COUNT_DESKTOP;

  const { positions, colors, sizes, brightnesses } = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    const sz = new Float32Array(starCount);
    const br = new Float32Array(starCount);

    const milkyAxis = new THREE.Vector3(0.3, 1, 0.2).normalize();
    const perp1Base = new THREE.Vector3().crossVectors(milkyAxis, new THREE.Vector3(1, 0, 0)).normalize();
    const perp2Base = new THREE.Vector3().crossVectors(milkyAxis, perp1Base).normalize();

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      let theta = Math.random() * Math.PI * 2;
      let phi = Math.acos(2 * Math.random() - 1);

      if (i < starCount * 0.45) {
        const along = (Math.random() - 0.5) * 2;
        const u1 = Math.random() || 0.001;
        const u2 = Math.random();
        const gaussSpread = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 0.15;
        const u3 = Math.random() || 0.001;
        const u4 = Math.random();
        const gaussSpread2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4) * 0.15;
        const dir = new THREE.Vector3()
          .addScaledVector(milkyAxis, along)
          .addScaledVector(perp1Base, gaussSpread)
          .addScaledVector(perp2Base, gaussSpread2)
          .normalize();
        theta = Math.atan2(dir.z, dir.x);
        phi = Math.acos(Math.max(-1, Math.min(1, dir.y)));
      }

      const r = 180 + Math.random() * 350;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      const mag = Math.pow(Math.random(), 3.2);
      const brightness = 0.2 + mag * 0.8;
      br[i] = brightness;

      const temp = Math.random();
      let cr: number;
      let cg: number;
      let cb: number;
      if (temp < 0.03) {
        cr = 0.62; cg = 0.72; cb = 1.0;
      } else if (temp < 0.13) {
        cr = 0.68; cg = 0.8; cb = 1.0;
      } else if (temp < 0.35) {
        cr = 0.88; cg = 0.92; cb = 1.0;
      } else if (temp < 0.55) {
        cr = 1.0; cg = 0.98; cb = 0.92;
      } else if (temp < 0.72) {
        cr = 1.0; cg = 0.94; cb = 0.8;
      } else if (temp < 0.88) {
        cr = 1.0; cg = 0.8; cb = 0.55;
      } else {
        cr = 1.0; cg = 0.6; cb = 0.35;
      }

      col[i3] = cr * brightness;
      col[i3 + 1] = cg * brightness;
      col[i3 + 2] = cb * brightness;

      sz[i] = mag < 0.05 ? 0.12 + Math.random() * 0.09
        : mag < 0.3 ? 0.2 + mag * 0.45
        : mag < 0.7 ? 0.45 + mag * 1.05
        : mag < 0.9 ? 1.3 + mag * 2.6
        : 3.6 + mag * 5.2;
    }

    return { positions: pos, colors: col, sizes: sz, brightnesses: br };
  }, [starCount]);

  useFrame(({ camera }) => {
    if (!pointsRef.current) return;
    pointsRef.current.position.copy(camera.position);
  });

  return (
    <points ref={pointsRef} renderOrder={-100} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-brightness" args={[brightnesses, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        vertexColors
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function FallbackStarLayer({ mobile = false }: { mobile?: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = mobile ? 1200 : 2200;

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 230 + Math.random() * 220;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      const warm = Math.random();
      col[i3] = warm > 0.7 ? 1 : 0.85;
      col[i3 + 1] = warm > 0.7 ? 0.82 : 0.9;
      col[i3 + 2] = 1;

      sz[i] = 0.55 + Math.random() * 0.95;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, [count]);

  useFrame(({ camera }) => {
    if (!ref.current) return;
    ref.current.position.copy(camera.position);
  });

  return (
    <points ref={ref} renderOrder={-101} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        opacity={0.5}
        size={0.85}
        sizeAttenuation
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}


/* ── Milky Way Nebula (volumetric glow sprite band) ── */
function MilkyWayNebula() {
  const groupRef = useRef<THREE.Group>(null);
  const nebulaData = useMemo(() => {
    const clouds: { pos: THREE.Vector3; scaleVec: THREE.Vector3; opacity: number; color: THREE.Color; rotation: number }[] = [];
    const milkyAxis = new THREE.Vector3(0.3, 1, 0.2).normalize();
    const perp1 = new THREE.Vector3().crossVectors(milkyAxis, new THREE.Vector3(1, 0, 0)).normalize();
    const perp2 = new THREE.Vector3().crossVectors(milkyAxis, perp1).normalize();

    for (let i = 0; i < 55; i++) {
      const along = (Math.random() - 0.5) * 2;
      const u1 = Math.random() || 0.001;
      const u2 = Math.random();
      const spread1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 0.09;
      const u3 = Math.random() || 0.001;
      const u4 = Math.random();
      const spread2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4) * 0.09;

      const dir = new THREE.Vector3()
        .addScaledVector(milkyAxis, along)
        .addScaledVector(perp1, spread1)
        .addScaledVector(perp2, spread2)
        .normalize();

      const r = 155 + Math.random() * 45;
      const pos = dir.multiplyScalar(r);

      const colorRand = Math.random();
      let color: THREE.Color;
      if (colorRand < 0.4) {
        color = new THREE.Color().setHSL(0.6 + Math.random() * 0.05, 0.15 + Math.random() * 0.1, 0.7 + Math.random() * 0.15);
      } else if (colorRand < 0.7) {
        color = new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.2 + Math.random() * 0.15, 0.65 + Math.random() * 0.2);
      } else if (colorRand < 0.88) {
        color = new THREE.Color().setHSL(0.0 + Math.random() * 0.03, 0.3 + Math.random() * 0.2, 0.5 + Math.random() * 0.15);
      } else {
        color = new THREE.Color().setHSL(0.5 + Math.random() * 0.1, 0.2, 0.55 + Math.random() * 0.15);
      }

      const baseSize = 25 + Math.random() * 50;
      clouds.push({
        pos,
        scaleVec: new THREE.Vector3(baseSize * (0.8 + Math.random() * 0.6), baseSize * (0.3 + Math.random() * 0.4), 1),
        opacity: 0.015 + Math.random() * 0.035,
        color,
        rotation: Math.random() * Math.PI * 2,
      });
    }
    return clouds;
  }, []);

  const nebulaTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.15, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.08)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(camera.position);
  });

  return (
    <group ref={groupRef}>
      {nebulaData.map((cloud, i) => (
        <sprite key={i} position={cloud.pos} scale={cloud.scaleVec} renderOrder={-99} frustumCulled={false}>
          <spriteMaterial
            map={nebulaTexture}
            color={cloud.color}
            transparent
            opacity={cloud.opacity}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            rotation={cloud.rotation}
          />
        </sprite>
      ))}
    </group>
  );
}

/* ── Shooting Stars ── */
const MAX_SHOOTING_STARS = 5;
const METEOR_SEGMENTS = 32;

interface ShootingStar {
  active: boolean;
  startTime: number;
  duration: number;
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  length: number;
  color: THREE.Color;
  brightness: number;
}

function ShootingStars() {
  const starsRef = useRef<ShootingStar[]>([]);
  const nextSpawn = useRef(2 + Math.random() * 4);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useMemo(() => {
    starsRef.current = [];
    for (let i = 0; i < MAX_SHOOTING_STARS; i++) {
      starsRef.current.push({
        active: false, startTime: 0, duration: 0,
        origin: new THREE.Vector3(), direction: new THREE.Vector3(),
        speed: 0, length: 0, color: new THREE.Color(1, 1, 1), brightness: 1,
      });
    }
  }, []);

  // Use a thin tapered tube for each meteor trail
  const trailGeos = useMemo(() => {
    return Array.from({ length: MAX_SHOOTING_STARS }, () => {
      const geo = new THREE.BufferGeometry();
      // 2 triangles per segment forming a ribbon
      const verts = new Float32Array(METEOR_SEGMENTS * 6); // 2 verts * 3 coords per segment
      const alphas = new Float32Array(METEOR_SEGMENTS * 2);
      const indices: number[] = [];
      for (let j = 0; j < METEOR_SEGMENTS - 1; j++) {
        const a = j * 2, b = a + 1, c = a + 2, d = a + 3;
        indices.push(a, c, b, b, c, d);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
      geo.setIndex(indices);
      return geo;
    });
  }, []);

  const meteorMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), []);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    const dt = 0.016;

    nextSpawn.current -= dt;
    if (nextSpawn.current <= 0) {
      const slot = starsRef.current.find(s => !s.active);
      if (slot) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(0.3 + Math.random() * 0.5);
        const r = 110 + Math.random() * 70;
        slot.origin.set(
          r * Math.sin(phi) * Math.cos(theta) + camera.position.x,
          r * Math.sin(phi) * Math.sin(theta) + camera.position.y,
          r * Math.cos(phi) + camera.position.z
        );
        const toCamera = new THREE.Vector3().subVectors(camera.position, slot.origin).normalize();
        slot.direction.set(
          toCamera.x + (Math.random() - 0.5) * 0.7,
          toCamera.y + (Math.random() - 0.5) * 0.4,
          toCamera.z + (Math.random() - 0.5) * 0.7
        ).normalize();
        slot.speed = 50 + Math.random() * 90;
        slot.length = 6 + Math.random() * 18;
        slot.duration = 0.3 + Math.random() * 1.0;
        slot.startTime = t;
        slot.active = true;
        slot.brightness = 0.5 + Math.random() * 0.5;
      }
      nextSpawn.current = 3 + Math.random() * 10;
    }

    const up = camera.up.clone().normalize();
    const camRight = new THREE.Vector3().crossVectors(
      new THREE.Vector3().subVectors(camera.position, new THREE.Vector3()).normalize(),
      up
    ).normalize();

    for (let si = 0; si < MAX_SHOOTING_STARS; si++) {
      const star = starsRef.current[si];
      const mesh = meshRefs.current[si];
      if (!mesh) continue;

      if (!star.active) { mesh.visible = false; continue; }

      const elapsed = t - star.startTime;
      if (elapsed > star.duration) { star.active = false; mesh.visible = false; continue; }

      mesh.visible = true;
      const progress = elapsed / star.duration;
      const masterAlpha = progress < 0.08 ? progress / 0.08
        : progress < 0.5 ? 1.0
        : 1.0 - (progress - 0.5) / 0.5;

      const headPos = star.origin.clone().addScaledVector(star.direction, elapsed * star.speed);
      const perpDir = new THREE.Vector3().crossVectors(star.direction, camRight).normalize();

      const posAttr = trailGeos[si].attributes.position as THREE.BufferAttribute;
      const alphaAttr = trailGeos[si].attributes.alpha as THREE.BufferAttribute;
      const pos = posAttr.array as Float32Array;
      const alp = alphaAttr.array as Float32Array;

      for (let j = 0; j < METEOR_SEGMENTS; j++) {
        const frac = j / (METEOR_SEGMENTS - 1);
        const trailPos = headPos.clone().addScaledVector(star.direction, -frac * star.length);
        const width = (1 - frac) * 0.3 * star.brightness; // tapers to zero
        const a = masterAlpha * star.brightness * Math.pow(1 - frac, 2.0);

        // Two vertices forming ribbon width
        pos[j * 6] = trailPos.x + perpDir.x * width;
        pos[j * 6 + 1] = trailPos.y + perpDir.y * width;
        pos[j * 6 + 2] = trailPos.z + perpDir.z * width;
        pos[j * 6 + 3] = trailPos.x - perpDir.x * width;
        pos[j * 6 + 4] = trailPos.y - perpDir.y * width;
        pos[j * 6 + 5] = trailPos.z - perpDir.z * width;
        alp[j * 2] = a;
        alp[j * 2 + 1] = a;
      }
      posAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {trailGeos.map((geo, i) => (
        <mesh
          key={i}
          ref={(el: THREE.Mesh | null) => { meshRefs.current[i] = el; }}
          geometry={geo}
          material={meteorMaterial}
          visible={false}
        />
      ))}
    </group>
  );
}

/* ── Airplane-style camera: smooth circuits over the field ── */
function CockpitCamera({ physics, audioRef, flightInput }: { physics: RockPhysics; audioRef: React.MutableRefObject<AudioAnalysis>; flightInput: React.MutableRefObject<FlightInput> }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, -2, 0));
  const smoothQuat = useRef(new THREE.Quaternion());
  const smoothedAmplitude = useRef(0);
  const smoothedBass = useRef(0);
  const elapsed = useRef(0);

  const CRUISE_ALT = -5.5;

  const prevTangentRef = useRef(new THREE.Vector3(1, 0, 0));
  const smoothBank = useRef(0);
  const smoothInversion = useRef(0);

  // User-controlled offsets
  const userPitch = useRef(0);
  const userRoll = useRef(0);
  const userYaw = useRef(0);
  const userSpeed = useRef(0);

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    elapsed.current += clampDt;
    const t = elapsed.current;
    const fi = flightInput.current;

    // Smooth user inputs
    userPitch.current += (fi.pitch * 0.35 - userPitch.current) * 0.04;
    userRoll.current += (fi.roll * 1.2 - userRoll.current) * 0.04;
    userYaw.current += (fi.yaw * 0.5 - userYaw.current) * 0.04;
    userSpeed.current += ((fi.throttle - 0.5) * 0.008 - userSpeed.current) * 0.03;

    // Audio smoothing
    const audio = audioRef.current;
    smoothedAmplitude.current += (audio.amplitude - smoothedAmplitude.current) * 0.015;
    smoothedBass.current += (audio.bass - smoothedBass.current) * 0.02;
    const sa = smoothedAmplitude.current;

    const baseSpeed = 0.009 + sa * 0.003 + userSpeed.current;
    const phase = t * baseSpeed;

    const rx = 80;
    const rz = 55;
    const pathX = Math.sin(phase) * rx;
    const pathZ = Math.cos(phase) * rz;

    const rollTarget =
      Math.sin(t * 0.04) * 1.8 +
      Math.sin(t * 0.071 + 1.3) * 1.2 +
      Math.sin(t * 0.023 + 3.7) * 0.7 +
      sa * Math.sin(t * 0.15) * 0.4 +
      userRoll.current; // user roll influence
    smoothInversion.current += (rollTarget - smoothInversion.current) * 0.012;

    const altDrift =
      Math.sin(t * 0.035) * 4.0 +
      Math.sin(t * 0.08 + 2.1) * 2.5 +
      Math.cos(t * 0.019) * 3.0 +
      userPitch.current * 8; // user pitch raises/lowers camera

    const desiredAlt = CRUISE_ALT + altDrift + sa * 0.5;
    const targetPos = new THREE.Vector3(pathX, desiredAlt, pathZ);

    const dxdt = Math.cos(phase) * rx * baseSpeed;
    const dzdt = -Math.sin(phase) * rz * baseSpeed;
    const dydt =
      Math.cos(t * 0.035) * 0.035 * 4.0 +
      Math.cos(t * 0.08 + 2.1) * 0.08 * 2.5 +
      -Math.sin(t * 0.019) * 0.019 * 3.0;
    const tangent = new THREE.Vector3(dxdt, dydt + userPitch.current * 0.3, dzdt).normalize();

    // Apply user yaw to tangent direction
    if (Math.abs(userYaw.current) > 0.001) {
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), userYaw.current * 0.05);
      tangent.applyQuaternion(yawQuat);
    }

    const cross = prevTangentRef.current.clone().cross(tangent);
    const rawBank = Math.atan2(cross.y, 1) * 0.4;
    smoothBank.current += (rawBank - smoothBank.current) * 0.02;
    prevTangentRef.current.copy(tangent);

    const up = new THREE.Vector3(0, 1, 0);
    const lookTarget = targetPos.clone().add(tangent.clone().multiplyScalar(10));
    const lookMatrix = new THREE.Matrix4().lookAt(targetPos, lookTarget, up);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);

    const totalRoll = smoothBank.current + smoothInversion.current;
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1), -totalRoll
    );
    targetQuat.multiply(rollQuat);

    smoothPos.current.lerp(targetPos, 0.02);
    smoothQuat.current.slerp(targetQuat, 0.025);

    camera.position.copy(smoothPos.current);
    camera.quaternion.copy(smoothQuat.current);
  });

  return null;
}


/* ── Cockpit frame with flight instruments ── */
function CockpitHUD({ flightInput }: { flightInput: React.MutableRefObject<FlightInput> }) {
  const c = LINE_COLOR;
  const [, forceUpdate] = useState(0);

  // Re-render HUD at ~20fps for instrument readouts
  useEffect(() => {
    const iv = setInterval(() => forceUpdate(n => n + 1), 50);
    return () => clearInterval(iv);
  }, []);

  const fi = flightInput.current;
  const throttlePct = Math.round(fi.throttle * 100);
  const pitchDeg = Math.round(fi.pitch * 30);
  const rollDeg = Math.round((fi.roll) * 45);

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        {/* Cockpit frame */}
        <path d="M 0 850 Q 960 760 1920 850 L 1920 1080 L 0 1080 Z" fill={BG} stroke={c} strokeWidth="1.5" opacity="0.6" />
        <path d="M 80 890 Q 960 820 1840 890" fill="none" stroke={c} strokeWidth="0.6" opacity="0.2" />
        <path d="M 150 930 Q 960 870 1770 930" fill="none" stroke={c} strokeWidth="0.4" opacity="0.12" />
        <polygon points="0,0 90,0 50,850 0,850" fill={BG} stroke={c} strokeWidth="1" opacity="0.4" />
        <line x1="45" y1="100" x2="50" y2="750" stroke={c} strokeWidth="0.4" opacity="0.12" />
        <polygon points="1920,0 1830,0 1870,850 1920,850" fill={BG} stroke={c} strokeWidth="1" opacity="0.4" />
        <line x1="1875" y1="100" x2="1870" y2="750" stroke={c} strokeWidth="0.4" opacity="0.12" />
        <polygon points="0,0 1920,0 1920,40 1080,25 840,25 0,40" fill={BG} stroke={c} strokeWidth="0.8" opacity="0.35" />
        <line x1="50" y1="850" x2="420" y2="760" stroke={c} strokeWidth="0.8" opacity="0.2" />
        <line x1="1870" y1="850" x2="1500" y2="760" stroke={c} strokeWidth="0.8" opacity="0.2" />

        {/* ── Left: Throttle bar ── */}
        <rect x="140" y="880" width="40" height="140" rx="3" fill="none" stroke={c} strokeWidth="0.8" opacity="0.35" />
        <rect x="143" y={880 + 140 - (fi.throttle * 134)} width="34" height={fi.throttle * 134} rx="2" fill={c} opacity="0.2" />
        <text x="160" y="870" textAnchor="middle" fill={c} opacity="0.5" fontSize="14" fontFamily="monospace">THR</text>
        <text x="160" y={880 + 140 - (fi.throttle * 134) - 4} textAnchor="middle" fill={c} opacity="0.7" fontSize="12" fontFamily="monospace">{throttlePct}%</text>
        {/* Throttle tick marks */}
        {[0, 25, 50, 75, 100].map(pct => (
          <line key={pct} x1="133" y1={880 + 140 - (pct / 100 * 134)} x2="140" y2={880 + 140 - (pct / 100 * 134)} stroke={c} strokeWidth="0.5" opacity="0.3" />
        ))}

        {/* ── Center: Pitch ladder ── */}
        <g transform="translate(960, 940)">
          <text x="0" y="-50" textAnchor="middle" fill={c} opacity="0.4" fontSize="12" fontFamily="monospace">PITCH</text>
          {/* Horizon line */}
          <line x1="-60" y1="0" x2="60" y2="0" stroke={c} strokeWidth="0.6" opacity="0.3" />
          {/* Pitch markers */}
          {[-20, -10, 0, 10, 20].map(deg => {
            const y = -deg * 1.5;
            return (
              <g key={deg}>
                <line x1="-30" y1={y} x2={deg === 0 ? -60 : -20} y2={y} stroke={c} strokeWidth={deg === 0 ? '0.8' : '0.4'} opacity={deg === 0 ? 0.5 : 0.25} />
                <line x1="30" y1={y} x2={deg === 0 ? 60 : 20} y2={y} stroke={c} strokeWidth={deg === 0 ? '0.8' : '0.4'} opacity={deg === 0 ? 0.5 : 0.25} />
                {deg !== 0 && <text x="45" y={y + 4} fill={c} opacity="0.25" fontSize="9" fontFamily="monospace">{Math.abs(deg)}°</text>}
              </g>
            );
          })}
          {/* Current pitch indicator */}
          <polygon points="-8,0 0,-6 8,0 0,6" fill={c} opacity="0.6" transform={`translate(0, ${-pitchDeg * 1.5})`} />
          <text x="0" y="55" textAnchor="middle" fill={c} opacity="0.6" fontSize="13" fontFamily="monospace">{pitchDeg > 0 ? '+' : ''}{pitchDeg}°</text>
        </g>

        {/* ── Right: Roll indicator ── */}
        <g transform="translate(1740, 940)">
          <text x="0" y="-50" textAnchor="middle" fill={c} opacity="0.4" fontSize="12" fontFamily="monospace">ROLL</text>
          {/* Arc */}
          <path d="M -40 0 A 40 40 0 0 1 40 0" fill="none" stroke={c} strokeWidth="0.6" opacity="0.3" />
          {/* Tick marks on arc */}
          {[-45, -30, -15, 0, 15, 30, 45].map(deg => {
            const rad = (deg - 90) * Math.PI / 180;
            const x1 = Math.cos(rad) * 36, y1 = Math.sin(rad) * 36;
            const x2 = Math.cos(rad) * 42, y2 = Math.sin(rad) * 42;
            return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={deg === 0 ? '1' : '0.5'} opacity={deg === 0 ? 0.5 : 0.3} />;
          })}
          {/* Roll pointer */}
          {(() => {
            const rad = (-rollDeg - 90) * Math.PI / 180;
            const px = Math.cos(rad) * 32, py = Math.sin(rad) * 32;
            return <circle cx={px} cy={py} r="3" fill={c} opacity="0.7" />;
          })()}
          <text x="0" y="55" textAnchor="middle" fill={c} opacity="0.6" fontSize="13" fontFamily="monospace">{rollDeg > 0 ? '+' : ''}{rollDeg}°</text>
        </g>

        {/* Panel backgrounds */}
        <rect x="860" y="875" width="200" height="105" rx="4" fill="none" stroke={c} strokeWidth="0.5" opacity="0.15" />
        <rect x="1640" y="875" width="200" height="105" rx="4" fill="none" stroke={c} strokeWidth="0.5" opacity="0.15" />
      </svg>

      {/* Controls hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center font-mono text-[9px] tracking-[0.15em] uppercase" style={{ color: c, opacity: 0.3 }}>
        W/S Pitch · A/D Roll · Q/E Yaw · Shift/Space Throttle
      </div>
    </div>
  );
}

/* ── Slow distant cyan meteor with luxurious glowing tail ── */
function BackgroundMeteor() {
  const { camera } = useThree();
  const linesRef = useRef<THREE.LineSegments>(null);
  const headRef = useRef<THREE.Points>(null);

  const TRAIL_SEGS = 180;
  const trailPos = useMemo(() => new Float32Array(TRAIL_SEGS * 6), []);
  const trailCol = useMemo(() => new Float32Array(TRAIL_SEGS * 8), []);
  const headPos = useMemo(() => new Float32Array(3), []);
  const headSizes = useMemo(() => new Float32Array(1), []);
  const headCol = useMemo(() => new Float32Array(3), []);

  interface MeteorState {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
    tailLen: number;
    brightness: number;
    active: boolean;
  }

  const meteor = useRef<MeteorState>({
    pos: new THREE.Vector3(), vel: new THREE.Vector3(),
    life: 0, maxLife: 0, tailLen: 0, brightness: 0, active: false
  });
  const nextSpawn = useRef(0.5 + Math.random() * 2);
  const elapsed = useRef(0);
  const posHistory = useRef<THREE.Vector3[]>([]);

  useFrame((_, dt) => {
    elapsed.current += dt;
    const t = elapsed.current;
    const m = meteor.current;
    const cam = camera.position;

    // Spawn in front of the camera, high in the sky
    if (!m.active && t > nextSpawn.current) {
      // Get camera forward direction (where user is looking)
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      // Spawn off to one side of the view, high up
      const side = Math.random() > 0.5 ? 1 : -1;
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
      const dist = 150 + Math.random() * 100; // far but visible

      m.pos.set(
        cam.x + fwd.x * dist + right.x * side * (40 + Math.random() * 60),
        cam.y + 60 + Math.random() * 80, // high above
        cam.z + fwd.z * dist + right.z * side * (40 + Math.random() * 60)
      );

      // Slow, majestic – cross the sky horizontally
      const speed = 2.5 + Math.random() * 2;
      m.vel.set(
        -right.x * side * speed * 0.8 + fwd.x * speed * 0.3,
        -(0.05 + Math.random() * 0.1) * speed,
        -right.z * side * speed * 0.8 + fwd.z * speed * 0.3
      );

      m.life = 0;
      m.maxLife = 25 + Math.random() * 20;
      m.tailLen = 120 + Math.random() * 60;
      m.brightness = 1.0;
      m.active = true;
      posHistory.current = [];
      nextSpawn.current = t + 35 + Math.random() * 45;
    }

    if (!linesRef.current || !headRef.current) return;

    const lArr = linesRef.current.geometry.attributes.position.array as Float32Array;
    const cArr = linesRef.current.geometry.attributes.color.array as Float32Array;
    const hArr = headRef.current.geometry.attributes.position.array as Float32Array;
    const hsArr = headRef.current.geometry.attributes.size.array as Float32Array;
    const hcArr = headRef.current.geometry.attributes.color.array as Float32Array;

    if (!m.active) {
      lArr.fill(-9999); cArr.fill(0); hArr.fill(-9999); hsArr[0] = 0;
      linesRef.current.geometry.attributes.position.needsUpdate = true;
      linesRef.current.geometry.attributes.color.needsUpdate = true;
      headRef.current.geometry.attributes.position.needsUpdate = true;
      headRef.current.geometry.attributes.size.needsUpdate = true;
      return;
    }

    m.life += dt;
    m.pos.addScaledVector(m.vel, dt);

    // Record position every ~0.08s for smooth tail
    const hLen = posHistory.current.length;
    if (hLen === 0 || m.pos.distanceTo(posHistory.current[hLen - 1]) > 0.3) {
      posHistory.current.push(m.pos.clone());
      if (posHistory.current.length > 350) posHistory.current.shift();
    }

    if (m.life > m.maxLife) { m.active = false; }

    const fadeIn = Math.min(m.life * 0.3, 1);
    const fadeOut = Math.min((m.maxLife - m.life) * 0.2, 1);
    const fade = fadeIn * fadeOut * m.brightness;

    // Bright cyan head glow
    hArr[0] = m.pos.x; hArr[1] = m.pos.y; hArr[2] = m.pos.z;
    hsArr[0] = 12.0 * fade;
    hcArr[0] = 0.4; hcArr[1] = 0.95; hcArr[2] = 1.0;

    // Tail from position history – cyan fading to deep blue
    const history = posHistory.current;
    const histLen = history.length;

    for (let s = 0; s < TRAIL_SEGS; s++) {
      const idx = s * 6;
      const cidx = s * 8;
      const t0 = s / TRAIL_SEGS;
      const t1 = (s + 1) / TRAIL_SEGS;

      const hi0 = Math.max(0, histLen - 1 - Math.floor(t0 * Math.min(histLen, TRAIL_SEGS)));
      const hi1 = Math.max(0, histLen - 1 - Math.floor(t1 * Math.min(histLen, TRAIL_SEGS)));

      if (hi0 < histLen && hi1 < histLen) {
        const p0 = history[hi0]; const p1 = history[hi1];
        lArr[idx] = p0.x; lArr[idx+1] = p0.y; lArr[idx+2] = p0.z;
        lArr[idx+3] = p1.x; lArr[idx+4] = p1.y; lArr[idx+5] = p1.z;
      } else {
        const tailDir = m.vel.clone().normalize();
        const p0 = m.pos.clone().addScaledVector(tailDir, -t0 * m.tailLen);
        const p1 = m.pos.clone().addScaledVector(tailDir, -t1 * m.tailLen);
        lArr[idx] = p0.x; lArr[idx+1] = p0.y; lArr[idx+2] = p0.z;
        lArr[idx+3] = p1.x; lArr[idx+4] = p1.y; lArr[idx+5] = p1.z;
      }

      // Alpha: brighter near head, fine feathered falloff
      const alpha0 = Math.pow(1 - t0, 2.0) * fade * 1.0;
      const alpha1 = Math.pow(1 - t1, 2.0) * fade * 1.0;
      // Bright white-cyan near head → deep cyan at tail
      const w0 = 1 - t0; const w1 = 1 - t1;
      cArr[cidx]   = w0 * 0.5;       cArr[cidx+1] = 0.35 + w0 * 0.6; cArr[cidx+2] = 0.6 + w0 * 0.4;  cArr[cidx+3] = alpha0;
      cArr[cidx+4] = w1 * 0.5;       cArr[cidx+5] = 0.35 + w1 * 0.6; cArr[cidx+6] = 0.6 + w1 * 0.4;  cArr[cidx+7] = alpha1;
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.color.needsUpdate = true;
    headRef.current.geometry.attributes.position.needsUpdate = true;
    headRef.current.geometry.attributes.size.needsUpdate = true;
    headRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments ref={linesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailCol, 4]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points ref={headRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[headPos, 3]} />
          <bufferAttribute attach="attributes-size" args={[headSizes, 1]} />
          <bufferAttribute attach="attributes-color" args={[headCol, 3]} />
        </bufferGeometry>
        <pointsMaterial vertexColors transparent sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

/* ── Rock indices for rendering ── */
function RockField({ physics, mobile = false }: { physics: RockPhysics; mobile?: boolean }) {
  const indices = useMemo(() => Array.from({ length: physics.count }, (_, i) => i), [physics.count]);
  return (
    <>
      {indices.map(i => <DynamicRock key={i} index={i} physics={physics} mobile={mobile} />)}
    </>
  );
}

/* ── Main ── */
export default function EliteShipScene({ embedded = false }: { embedded?: boolean }) {
  const initialRocks = useInitialRocks();
  const physics = useMemo(() => createRockPhysics(initialRocks), [initialRocks]);
  const { playing, start, stop, analysisRef } = useAudioAnalyser();
  const flightInput = useFlightInput();
  const mobile = useIsMobile();

  return (
    <div className={`relative w-full ${embedded ? 'h-[80vh] rounded-xl overflow-hidden' : 'h-screen'} overflow-hidden`} style={{ background: BG }}>
      {/* Solid black fallback behind WebGL canvas */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, background: '#000' }} />

      <Canvas
        className="relative z-10"
        camera={{ fov: 70, near: 0.1, far: 900 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: mobile ? 'low-power' : 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <PhysicsDriver physics={physics} />
        <CockpitCamera physics={physics} audioRef={analysisRef} flightInput={flightInput} />
        <MilkyWayNebula />
        <FallbackStarLayer mobile={mobile} />
        <RealisticStarfield mobile={mobile} />
        <ShootingStars />
        <BackgroundMeteor />
        <InfoExchange physics={physics} mobile={mobile} />
        <RockField physics={physics} mobile={mobile} />
        <DebrisSystem physics={physics} />
      </Canvas>
      
      <CockpitHUD flightInput={flightInput} />

      <button
        onClick={playing ? stop : start}
        className="absolute bottom-6 right-6 z-30 px-4 py-2 rounded border text-[11px] tracking-[0.2em] uppercase font-mono transition-opacity hover:opacity-100"
        style={{
          color: LINE_COLOR,
          borderColor: LINE_COLOR + '40',
          background: playing ? LINE_COLOR + '15' : 'transparent',
          opacity: 0.6,
        }}
      >
        {playing ? '■ SOUND OFF' : '♫ SOUND ON'}
      </button>
    </div>
  );
}
