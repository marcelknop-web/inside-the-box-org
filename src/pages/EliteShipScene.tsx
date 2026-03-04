import React, { useRef, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createRockPhysics, stepPhysics, DynamicRock, type RockPhysics } from '@/components/elite/PhysicsRocks';
import { DebrisSystem } from '@/components/elite/DebrisSystem';
import { ClusterExplosion } from '@/components/elite/ClusterExplosion';
import { Pulsar } from '@/components/elite/Pulsar';
import { useAudioAnalyser, type AudioAnalysis } from '@/hooks/useAudioAnalyser';


const LINE_COLOR = '#00ffaa';
const BG = '#000000';

/* ── Seeded RNG helper ── */
function makeRng(baseSeed: number) {
  let s = baseSeed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ── Generate polymer-chain rock formations ── */
function useInitialRocks(mobile: boolean) {
  return useMemo(() => {
    const rocks: { seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number] }[] = [];
    const chainCount = mobile ? 35 : 80;       // number of polymer chains
    const fieldW = mobile ? 140 : 260;          // field width
    const fieldD = mobile ? 90 : 180;           // field depth
    const planeY = -8;

    let globalIdx = 0;
    const rng = makeRng(42);

    for (let c = 0; c < chainCount; c++) {
      // Chain origin: random position in the field
      let cx = (rng() - 0.5) * fieldW;
      let cy = planeY + (rng() - 0.5) * 1.0;
      let cz = (rng() - 0.5) * fieldD;

      // Chain direction: random angle on the XZ plane, slight Y variation
      let angle = rng() * Math.PI * 2;
      let pitch = (rng() - 0.5) * 0.3; // slight vertical wander

      // Chain length: 3-12 rocks per chain
      const chainLen = 3 + Math.floor(rng() * (mobile ? 7 : 10));

      for (let n = 0; n < chainLen; n++) {
        const r = 0.5 + rng() * 2.2; // rock radius
        const seed = globalIdx * 13 + 7;

        rocks.push({
          seed,
          radius: r,
          position: [cx, cy, cz],
          rotSpeed: [
            (rng() - 0.5) * 0.012,
            (rng() - 0.5) * 0.015,
            (rng() - 0.5) * 0.008,
          ],
        });

        // Next rock: place it touching this one at exactly one edge
        // Distance = sum of radii (touching), direction follows chain with random bends
        const nextR = 0.5 + rng() * 2.2;
        const edgeDist = r + nextR; // exactly touching at edge

        // Bend the chain: random angular deviation (polymer-like zigzag)
        angle += (rng() - 0.5) * 1.2; // up to ~35° bend per link
        pitch += (rng() - 0.5) * 0.2;
        pitch = Math.max(-0.3, Math.min(0.3, pitch)); // clamp vertical

        cx += Math.cos(angle) * Math.cos(pitch) * edgeDist;
        cy += Math.sin(pitch) * edgeDist * 0.3; // gentle Y changes
        cy = Math.max(planeY - 2, Math.min(planeY + 2, cy)); // stay near plane
        cz += Math.sin(angle) * Math.cos(pitch) * edgeDist;

        globalIdx++;
      }
    }

    return rocks;
  }, [mobile]);
}

/* ── Physics simulation driver ── */
function PhysicsDriver({ physics, mobile }: { physics: RockPhysics; mobile: boolean }) {
  useFrame((_, dt) => stepPhysics(physics, dt, mobile));
  return null;
}

/* ── Information exchange: data packets flow between rocks, larger blocks = more traffic ── */
const INFO_COUNT_DESKTOP = 250;
const INFO_COUNT_MOBILE = 120;

function InfoExchange({ physics, mobile = false }: { physics: RockPhysics; mobile?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const sunDir = useMemo(() => new THREE.Vector3(0.6, 0.8, -0.3).normalize(), []);
  const _obj = useMemo(() => new THREE.Object3D(), []);
  const _lookTarget = useMemo(() => new THREE.Vector3(), []);
  const _tmpColor = useMemo(() => new THREE.Color(), []);

  const count = mobile ? INFO_COUNT_MOBILE : INFO_COUNT_DESKTOP;

  // Per-particle glint timing
  const glintData = useMemo(() => {
    const phase = new Float32Array(count);
    const period = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      phase[i] = Math.random() * 100;
      period[i] = 3 + Math.random() * 8;
    }
    return { phase, period };
  }, [count]);

  // Spindle geometry: elongated diamond (octahedron stretched along Z)
  const spindleGeo = useMemo(() => {
    const segments = 10; // length segments for smooth taper
    const radialSegs = 5; // pentagon cross-section
    const verts: number[] = [];
    const idxs: number[] = [];

    // Front tip
    verts.push(0, 0, -0.5);
    // Rings along length
    for (let s = 1; s < segments; s++) {
      const t = s / segments; // 0..1
      const z = -0.5 + t; // -0.5 to +0.5
      const r = Math.sin(t * Math.PI); // 0→1→0 spindle profile
      for (let r2 = 0; r2 < radialSegs; r2++) {
        const angle = (r2 / radialSegs) * Math.PI * 2;
        verts.push(Math.cos(angle) * r, Math.sin(angle) * r, z);
      }
    }
    // Back tip
    const backIdx = verts.length / 3;
    verts.push(0, 0, 0.5);

    // Triangles: front tip to first ring
    for (let r2 = 0; r2 < radialSegs; r2++) {
      const a = 1 + r2;
      const b = 1 + (r2 + 1) % radialSegs;
      idxs.push(0, a, b);
    }
    // Ring-to-ring quads
    for (let s = 1; s < segments - 1; s++) {
      const ringA = 1 + (s - 1) * radialSegs;
      const ringB = 1 + s * radialSegs;
      for (let r2 = 0; r2 < radialSegs; r2++) {
        const a0 = ringA + r2;
        const a1 = ringA + (r2 + 1) % radialSegs;
        const b0 = ringB + r2;
        const b1 = ringB + (r2 + 1) % radialSegs;
        idxs.push(a0, b0, b1);
        idxs.push(a0, b1, a1);
      }
    }
    // Last ring to back tip
    const lastRing = 1 + (segments - 2) * radialSegs;
    for (let r2 = 0; r2 < radialSegs; r2++) {
      const a = lastRing + r2;
      const b = lastRing + (r2 + 1) % radialSegs;
      idxs.push(a, backIdx, b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Material: additive blending, semi-transparent
  const spindleMat = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), []);

  // Pre-compute cumulative weight table for size-biased rock selection
  const weightTable = useMemo(() => {
    const w = new Float32Array(physics.count);
    let sum = 0;
    for (let i = 0; i < physics.count; i++) {
      const r = physics.radii[i];
      sum += r * r;
      w[i] = sum;
    }
    if (sum > 0) for (let i = 0; i < physics.count; i++) w[i] /= sum;
    return w;
  }, [physics.count, physics.radii]);

  const pickRockUniform = () => Math.floor(Math.random() * physics.count);

  const findLargerNeighbour = (s: number, maxDist: number): number => {
    const sx3 = s * 3;
    const sR = physics.radii[s];
    const pp = physics.positions;
    let bestIdx = -1;
    let bestDist = maxDist;
    const tries = Math.min(physics.count, 30);
    for (let a = 0; a < tries; a++) {
      const cand = Math.floor(Math.random() * physics.count);
      if (cand === s) continue;
      if (physics.radii[cand] <= sR * 1.15) continue;
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
    const alive = new Uint8Array(count);
    const progress = new Float32Array(count);
    const sourceRock = new Int32Array(count).fill(-1);
    const targetRock = new Int32Array(count).fill(-1);
    const travelTime = new Float32Array(count);
    const age = new Float32Array(count);
    const curveOffset = new Float32Array(count * 2);
    return { alive, progress, sourceRock, targetRock, travelTime, age, curveOffset };
  }, [count]);

  useFrame(({ clock }, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const {
      alive, progress: prog, sourceRock: src, targetRock: tgt,
      travelTime: tt, age, curveOffset: curve,
    } = data;

    const cam = camera.position;
    const pp = physics.positions;
    const n = physics.count;
    if (n === 0) return;

    const clampDt = Math.min(dt, 0.033);
    const elapsed = clock.elapsedTime;

    // Ensure instanceColor exists
    if (!mesh.instanceColor) {
      const colArr = new Float32Array(count * 3);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colArr, 3);
    }
    const colors = mesh.instanceColor.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Spawn new packet
      if (!alive[i]) {
        if (Math.random() > 0.06) {
          _obj.position.set(0, -9999, 0);
          _obj.scale.set(0, 0, 0);
          _obj.updateMatrix();
          mesh.setMatrixAt(i, _obj.matrix);
          colors[i * 3] = 0; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0;
          continue;
        }

        const isDownlink = Math.random() < 0.2;
        let s: number, t: number;
        if (isDownlink) {
          const big = pickRockUniform();
          let found = -1;
          const bR = physics.radii[big];
          for (let a = 0; a < 30; a++) {
            const cand = Math.floor(Math.random() * physics.count);
            if (cand === big || physics.radii[cand] >= bR * 0.85) continue;
            const cx3 = cand * 3, bx3 = big * 3;
            const ddx = pp[cx3] - pp[bx3], ddy = pp[cx3 + 1] - pp[bx3 + 1], ddz = pp[cx3 + 2] - pp[bx3 + 2];
            const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
            if (d > 5 && d < 80) { found = cand; break; }
          }
          if (found < 0) {
            _obj.position.set(0, -9999, 0); _obj.scale.set(0, 0, 0);
            _obj.updateMatrix(); mesh.setMatrixAt(i, _obj.matrix);
            continue;
          }
          s = big; t = found;
        } else {
          s = pickRockUniform();
          const larger = findLargerNeighbour(s, 80);
          if (larger < 0) {
            _obj.position.set(0, -9999, 0); _obj.scale.set(0, 0, 0);
            _obj.updateMatrix(); mesh.setMatrixAt(i, _obj.matrix);
            continue;
          }
          t = larger;
        }
        const sx3 = s * 3;

        const rdx = pp[sx3] - cam.x;
        const rdz = pp[sx3 + 2] - cam.z;
        if (rdx * rdx + rdz * rdz > 100 * 100) continue;

        src[i] = s;
        tgt[i] = t;
        age[i] = 0;
        alive[i] = 1;
        prog[i] = 0;

        const tx3 = t * 3;
        const dx = pp[tx3] - pp[sx3];
        const dy = pp[tx3 + 1] - pp[sx3 + 1];
        const dz = pp[tx3 + 2] - pp[sx3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const speed = 3 + Math.random() * 2; // slower, calmer
        tt[i] = dist / speed;

        curve[i * 2] = (Math.random() - 0.5) * 6;
        curve[i * 2 + 1] = 2 + Math.random() * 5;
      }

      age[i] += clampDt;
      prog[i] = Math.min(1, age[i] / Math.max(0.1, tt[i]));

      const s3 = src[i] * 3;
      const t3 = tgt[i] * 3;

      const t01 = prog[i];
      const inv = 1 - t01;
      const mx = (pp[s3] + pp[t3]) * 0.5 + curve[i * 2];
      const my = (pp[s3 + 1] + pp[t3 + 1]) * 0.5 + curve[i * 2 + 1];
      const mz = (pp[s3 + 2] + pp[t3 + 2]) * 0.5 + curve[i * 2] * 0.7;

      const px = inv * inv * pp[s3] + 2 * inv * t01 * mx + t01 * t01 * pp[t3];
      const py = inv * inv * pp[s3 + 1] + 2 * inv * t01 * my + t01 * t01 * pp[t3 + 1];
      const pz = inv * inv * pp[s3 + 2] + 2 * inv * t01 * mz + t01 * t01 * pp[t3 + 2];

      // Velocity = bezier derivative
      const dvx = 2 * (inv * (mx - pp[s3]) + t01 * (pp[t3] - mx));
      const dvy = 2 * (inv * (my - pp[s3 + 1]) + t01 * (pp[t3 + 1] - my));
      const dvz = 2 * (inv * (mz - pp[s3 + 2]) + t01 * (pp[t3 + 2] - mz));
      const spd = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz) + 0.01;

      // Spindle dimensions
      const beamLength = Math.min(18, spd * 0.35); // long streaks
      const widthCurve = Math.sin(t01 * Math.PI); // 0→1→0
      const beamWidth = 0.03 * widthCurve + 0.003; // hauchfein at tips, thicker in middle

      // Orient along velocity
      _lookTarget.set(px + dvx / spd, py + dvy / spd, pz + dvz / spd);
      _obj.position.set(px, py, pz);
      _obj.lookAt(_lookTarget);
      _obj.scale.set(beamWidth, beamWidth, beamLength);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);

      // ── Color logic ──
      const edgeFade = Math.min(t01 * 5, (1 - t01) * 5, 1);
      const cdx = px - cam.x, cdy = py - cam.y, cdz = pz - cam.z;
      const dist = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz);

      // Sunlight specular
      const nx = dvx / spd, ny = dvy / spd, nz = dvz / spd;
      const vdx = cam.x - px, vdy = cam.y - py, vdz = cam.z - pz;
      const vdLen = Math.sqrt(vdx * vdx + vdy * vdy + vdz * vdz) + 0.001;
      const hx = sunDir.x + vdx / vdLen;
      const hy = sunDir.y + vdy / vdLen;
      const hz = sunDir.z + vdz / vdLen;
      const hLen = Math.sqrt(hx * hx + hy * hy + hz * hz) + 0.001;
      const dotTH = Math.abs(nx * hx / hLen + ny * hy / hLen + nz * hz / hLen);
      const specular = Math.pow(1 - dotTH, 4);

      // Glint
      const glintPhase = (elapsed + glintData.phase[i]) % glintData.period[i];
      const glintStrength = glintPhase < 0.12
        ? Math.pow(Math.sin(glintPhase / 0.12 * Math.PI), 2) * 2.5
        : 0;

      const sunBoost = 1 + specular * 1.8 + glintStrength;
      const reflectMix = Math.min(specular * 2 + glintStrength * 0.5, 1);

      // Brightness based on distance + edge fade
      let brightness: number;
      if (dist < 12) {
        brightness = (0.35 + (dist / 12) * 0.25) * edgeFade * sunBoost;
      } else if (dist < 70) {
        brightness = (0.3 + Math.random() * 0.15) * edgeFade * sunBoost;
      } else {
        const td = Math.min((dist - 70) / 80, 1);
        brightness = 0.2 * (1 - td) * edgeFade * sunBoost;
      }
      brightness = Math.min(brightness, 1.2);

      // Cyan (#00bcd4) → Gold (#f5b800) on reflection
      const r = reflectMix * 0.96;
      const g = 0.74 + reflectMix * (0.72 - 0.74);
      const b = 0.83 * (1 - reflectMix);

      colors[i * 3] = r * brightness;
      colors[i * 3 + 1] = g * brightness;
      colors[i * 3 + 2] = b * brightness;

      // Trigger blink on arrival
      if (prog[i] >= 1) {
        if (tgt[i] >= 0 && tgt[i] < n) {
          physics.infoBlink[tgt[i]] = 1.0;
          physics.infoHitEdge[tgt[i]] = Math.floor(Math.random() * 100);
        }
        alive[i] = 0;
      }
    }

    // Decay infoBlink
    for (let r = 0; r < n; r++) {
      if (physics.infoBlink[r] > 0) {
        physics.infoBlink[r] = Math.max(0, physics.infoBlink[r] - clampDt * 3);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[spindleGeo, spindleMat, count]} frustumCulled={false} />
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

  // Reusable vectors to avoid per-frame allocations
  const _toCamera = useMemo(() => new THREE.Vector3(), []);
  const _up = useMemo(() => new THREE.Vector3(), []);
  const _camDir = useMemo(() => new THREE.Vector3(), []);
  const _camRight = useMemo(() => new THREE.Vector3(), []);
  const _headPos = useMemo(() => new THREE.Vector3(), []);
  const _perpDir = useMemo(() => new THREE.Vector3(), []);
  const _trailPos = useMemo(() => new THREE.Vector3(), []);

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
      const verts = new Float32Array(METEOR_SEGMENTS * 6);
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
        _toCamera.subVectors(camera.position, slot.origin).normalize();
        slot.direction.set(
          _toCamera.x + (Math.random() - 0.5) * 0.7,
          _toCamera.y + (Math.random() - 0.5) * 0.4,
          _toCamera.z + (Math.random() - 0.5) * 0.7
        ).normalize();
        slot.speed = 20 + Math.random() * 35;
        slot.length = 6 + Math.random() * 18;
        slot.duration = 0.3 + Math.random() * 1.0;
        slot.startTime = t;
        slot.active = true;
        slot.brightness = 0.5 + Math.random() * 0.5;
      }
      nextSpawn.current = 8 + Math.random() * 20;
    }

    _up.copy(camera.up).normalize();
    _camDir.copy(camera.position).normalize();
    _camRight.crossVectors(_camDir, _up).normalize();

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

      _headPos.copy(star.origin).addScaledVector(star.direction, elapsed * star.speed);
      _perpDir.crossVectors(star.direction, _camRight).normalize();

      const posAttr = trailGeos[si].attributes.position as THREE.BufferAttribute;
      const alphaAttr = trailGeos[si].attributes.alpha as THREE.BufferAttribute;
      const pos = posAttr.array as Float32Array;
      const alp = alphaAttr.array as Float32Array;

      for (let j = 0; j < METEOR_SEGMENTS; j++) {
        const frac = j / (METEOR_SEGMENTS - 1);
        _trailPos.copy(_headPos).addScaledVector(star.direction, -frac * star.length);
        const width = (1 - frac) * 0.3 * star.brightness;
        const a = masterAlpha * star.brightness * Math.pow(1 - frac, 2.0);

        pos[j * 6] = _trailPos.x + _perpDir.x * width;
        pos[j * 6 + 1] = _trailPos.y + _perpDir.y * width;
        pos[j * 6 + 2] = _trailPos.z + _perpDir.z * width;
        pos[j * 6 + 3] = _trailPos.x - _perpDir.x * width;
        pos[j * 6 + 4] = _trailPos.y - _perpDir.y * width;
        pos[j * 6 + 5] = _trailPos.z - _perpDir.z * width;
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
function CockpitCamera({ physics, audioRef, mobile = false }: { physics: RockPhysics; audioRef: React.MutableRefObject<AudioAnalysis>; mobile?: boolean }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, -2, 0));
  const smoothQuat = useRef(new THREE.Quaternion());
  const smoothedAmplitude = useRef(0);
  const smoothedBass = useRef(0);
  const elapsed = useRef(0);

  const CRUISE_ALT = mobile ? -7.0 : -5.5;

  const prevTangentRef = useRef(new THREE.Vector3(1, 0, 0));
  const smoothBank = useRef(0);
  const smoothInversion = useRef(0);

  // Reusable objects to avoid per-frame allocations
  const _targetPos = useMemo(() => new THREE.Vector3(), []);
  const _tangent = useMemo(() => new THREE.Vector3(), []);
  const _up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const _lookTarget = useMemo(() => new THREE.Vector3(), []);
  const _lookMatrix = useMemo(() => new THREE.Matrix4(), []);
  const _targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const _rollQuat = useMemo(() => new THREE.Quaternion(), []);
  const _rollAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const _cross = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    elapsed.current += clampDt;
    const t = elapsed.current;

    // Audio smoothing
    const audio = audioRef.current;
    smoothedAmplitude.current += (audio.amplitude - smoothedAmplitude.current) * 0.015;
    smoothedBass.current += (audio.bass - smoothedBass.current) * 0.02;
    const sa = smoothedAmplitude.current;

    const baseSpeed = 0.004 + sa * 0.001;
    const phase = t * baseSpeed;

    const rx = mobile ? 50 : 80;
    const rz = mobile ? 35 : 55;
    const pathX = Math.sin(phase) * rx;
    const pathZ = Math.cos(phase) * rz;

    const rollTarget =
      Math.sin(t * 0.015) * 0.6 +
      Math.sin(t * 0.028 + 1.3) * 0.4 +
      Math.sin(t * 0.009 + 3.7) * 0.3 +
      sa * Math.sin(t * 0.06) * 0.15;
    smoothInversion.current += (rollTarget - smoothInversion.current) * 0.006;

    const altDrift =
      Math.sin(t * 0.012) * 2.5 +
      Math.sin(t * 0.03 + 2.1) * 1.5 +
      Math.cos(t * 0.008) * 2.0;

    const desiredAlt = CRUISE_ALT + altDrift + sa * 0.5;
    _targetPos.set(pathX, desiredAlt, pathZ);

    const dxdt = Math.cos(phase) * rx * baseSpeed;
    const dzdt = -Math.sin(phase) * rz * baseSpeed;
    const dydt =
      Math.cos(t * 0.035) * 0.035 * 4.0 +
      Math.cos(t * 0.08 + 2.1) * 0.08 * 2.5 +
      -Math.sin(t * 0.019) * 0.019 * 3.0;
    _tangent.set(dxdt, dydt, dzdt).normalize();

    _cross.copy(prevTangentRef.current).cross(_tangent);
    const rawBank = Math.atan2(_cross.y, 1) * 0.4;
    smoothBank.current += (rawBank - smoothBank.current) * 0.02;
    prevTangentRef.current.copy(_tangent);

    _up.set(0, 1, 0);
    _lookTarget.copy(_targetPos).addScaledVector(_tangent, 10);
    _lookMatrix.lookAt(_targetPos, _lookTarget, _up);
    _targetQuat.setFromRotationMatrix(_lookMatrix);

    const totalRoll = smoothBank.current + smoothInversion.current;
    _rollQuat.setFromAxisAngle(_rollAxis, -totalRoll);
    _targetQuat.multiply(_rollQuat);

    smoothPos.current.lerp(_targetPos, 0.02);
    smoothQuat.current.slerp(_targetQuat, 0.025);

    camera.position.copy(smoothPos.current);
    camera.quaternion.copy(smoothQuat.current);
  });

  return null;
}



/* ── Permanent distant comet – spawns once, ultra-long tail, always visible ── */
function BackgroundMeteor() {
  const { camera } = useThree();
  const linesRef = useRef<THREE.LineSegments>(null);
  const headRef = useRef<THREE.Points>(null);

  const TRAIL_SEGS = 400; // very long tail
  const trailPos = useMemo(() => new Float32Array(TRAIL_SEGS * 6), []);
  const trailCol = useMemo(() => new Float32Array(TRAIL_SEGS * 8), []);
  const headPos = useMemo(() => new Float32Array(3), []);
  const headSizes = useMemo(() => new Float32Array(1), []);
  const headCol = useMemo(() => new Float32Array(3), []);

  // Comet follows an exact elliptical orbit relative to camera
  const cometAngle = useRef(0); // orbital angle (true anomaly)
  const cometOffset = useMemo(() => ({
    semiMajor: 250,     // long axis radius
    semiMinor: 120,     // short axis radius
    height: 90,         // base height above camera
    heightAmplitude: 25, // vertical oscillation on ellipse
    angularSpeed: 0.006, // slow orbital drift
    startAngle: Math.random() * Math.PI * 2,
    tilt: 0.15,         // slight tilt of orbital plane
  }), []);
  const posHistory = useRef<THREE.Vector3[]>([]);
  const spawned = useRef(false);
  const elapsed = useRef(0);
  const _tmpVec3 = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    elapsed.current += dt;
    if (!linesRef.current || !headRef.current) return;

    const lArr = linesRef.current.geometry.attributes.position.array as Float32Array;
    const cArr = linesRef.current.geometry.attributes.color.array as Float32Array;
    const hArr = headRef.current.geometry.attributes.position.array as Float32Array;
    const hsArr = headRef.current.geometry.attributes.size.array as Float32Array;
    const hcArr = headRef.current.geometry.attributes.color.array as Float32Array;

    // Wait 2s before appearing
    if (elapsed.current < 2) {
      lArr.fill(-9999); cArr.fill(0); hArr.fill(-9999); hsArr[0] = 0;
      linesRef.current.geometry.attributes.position.needsUpdate = true;
      headRef.current.geometry.attributes.position.needsUpdate = true;
      return;
    }

    if (!spawned.current) {
      spawned.current = true;
      cometAngle.current = cometOffset.startAngle;
    }

    // Advance angle – Kepler-like: faster near periapsis (closer to camera)
    const e = cometOffset;
    cometAngle.current += e.angularSpeed * dt;
    const a = cometAngle.current;
    const cam = camera.position;

    // Exact elliptical position
    const cx = cam.x + Math.cos(a) * e.semiMajor;
    const cy = cam.y + e.height + Math.sin(a) * e.heightAmplitude * Math.cos(e.tilt);
    const cz = cam.z + Math.sin(a) * e.semiMinor;

    // Record history for tail (world-space) — reuse Vector3 objects
    const _currentPos = _tmpVec3 ?? new THREE.Vector3();
    _currentPos.set(cx, cy, cz);
    const hLen = posHistory.current.length;
    if (hLen === 0 || _currentPos.distanceTo(posHistory.current[hLen - 1]) > 0.15) {
      posHistory.current.push(_currentPos.clone());
      if (posHistory.current.length > 800) posHistory.current.shift();
    }

    // Fade in over 5s, never fade out
    const fade = Math.min(1, (elapsed.current - 2) * 0.2);

    // Bright cyan head glow
    hArr[0] = cx; hArr[1] = cy; hArr[2] = cz;
    hsArr[0] = 10.0 * fade;
    hcArr[0] = 0.5; hcArr[1] = 0.95; hcArr[2] = 1.0;

    // Build tail from position history
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
        lArr[idx] = cx; lArr[idx+1] = cy; lArr[idx+2] = cz;
        lArr[idx+3] = cx; lArr[idx+4] = cy; lArr[idx+5] = cz;
      }

      // Alpha: very gentle falloff for ultra-long visible tail
      const alpha0 = Math.pow(1 - t0, 1.5) * fade * 0.9;
      const alpha1 = Math.pow(1 - t1, 1.5) * fade * 0.9;
      // White-cyan head → deep cyan → subtle blue at tip
      const w0 = 1 - t0; const w1 = 1 - t1;
      cArr[cidx]   = w0 * 0.5;       cArr[cidx+1] = 0.3 + w0 * 0.65; cArr[cidx+2] = 0.5 + w0 * 0.5;  cArr[cidx+3] = alpha0;
      cArr[cidx+4] = w1 * 0.5;       cArr[cidx+5] = 0.3 + w1 * 0.65; cArr[cidx+6] = 0.5 + w1 * 0.5;  cArr[cidx+7] = alpha1;
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
  const mobile = useIsMobile();
  const initialRocks = useInitialRocks(mobile);
  const physics = useMemo(() => createRockPhysics(initialRocks), [initialRocks]);
  const { playing, start, stop, analysisRef } = useAudioAnalyser();

  return (
    <div className={`relative w-full ${embedded ? 'h-[80vh] rounded-xl overflow-hidden' : 'h-screen'} overflow-hidden`} style={{ background: BG }}>
      {/* Solid black fallback behind WebGL canvas */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, background: '#000' }} />

      <Canvas
        className="relative z-10"
        camera={{ fov: mobile ? 85 : 70, near: 0.1, far: 900 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: mobile ? 'low-power' : 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <PhysicsDriver physics={physics} mobile={mobile} />
        <CockpitCamera physics={physics} audioRef={analysisRef} mobile={mobile} />
        <MilkyWayNebula />
        <FallbackStarLayer mobile={mobile} />
        <RealisticStarfield mobile={mobile} />
        <ShootingStars />
        <BackgroundMeteor />
        <InfoExchange physics={physics} mobile={mobile} />
        <RockField physics={physics} mobile={mobile} />
        <DebrisSystem physics={physics} />
        <ClusterExplosion physics={physics} />
        <Pulsar />
      </Canvas>
      


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
