import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createRockPhysics, stepPhysics, DynamicRock, type RockPhysics } from '@/components/elite/PhysicsRocks';
import { DebrisSystem } from '@/components/elite/DebrisSystem';
import { useAudioAnalyser, type AudioAnalysis } from '@/hooks/useAudioAnalyser';

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

/* ── Rain near objects only ── */
const RAIN_COUNT = 2000;
const RAIN_SPREAD_LOCAL = 20;
const FALL_SPEED_MIN = 10;
const FALL_SPEED_MAX = 22;
const NEAR_BLUR_DIST = 8;
const FAR_BLUR_DIST = 60;

function Rain({ physics }: { physics: RockPhysics }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const dotsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const timeRef = useRef(0);

  const { linePos, dotPos, speeds, dotSizes, alive, lineCol, dotCol } = useMemo(() => {
    const lp = new Float32Array(RAIN_COUNT * 6);
    const dp = new Float32Array(RAIN_COUNT * 3);
    const spd = new Float32Array(RAIN_COUNT);
    const ds = new Float32Array(RAIN_COUNT);
    const al = new Uint8Array(RAIN_COUNT).fill(0);
    const lc = new Float32Array(RAIN_COUNT * 8);
    const dc = new Float32Array(RAIN_COUNT * 4);
    for (let i = 0; i < RAIN_COUNT; i++) {
      lp[i * 6 + 1] = -9999; lp[i * 6 + 4] = -9999;
      dp[i * 3 + 1] = -9999;
    }
    return { linePos: lp, dotPos: dp, speeds: spd, dotSizes: ds, alive: al, lineCol: lc, dotCol: dc };
  }, []);

  const ages = useMemo(() => new Float32Array(RAIN_COUNT), []);

  useFrame((_, dt) => {
    if (!linesRef.current || !dotsRef.current) return;
    timeRef.current += dt;

    const cycle = timeRef.current * 0.35;
    const intensity = Math.max(0, Math.sin(cycle) * 0.5 + Math.sin(cycle * 1.7) * 0.3 + Math.sin(cycle * 3.1) * 0.2);
    const spawning = intensity > 0.05;

    const lAttr = linesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const lcAttr = linesRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const dAttr = dotsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const dcAttr = dotsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const dsAttr = dotsRef.current.geometry.attributes.size as THREE.BufferAttribute;
    const lp = lAttr.array as Float32Array;
    const lc = lcAttr.array as Float32Array;
    const dp = dAttr.array as Float32Array;
    const dc = dcAttr.array as Float32Array;
    const ds = dsAttr.array as Float32Array;
    const cam = camera.position;
    const pp = physics.positions;
    const n = physics.count;

    for (let i = 0; i < RAIN_COUNT; i++) {
      const i6 = i * 6, i3 = i * 3, i8 = i * 8, i4 = i * 4;

      if (alive[i] === 0) {
        if (spawning && Math.random() < intensity * 0.15) {
          let attempts = 0;
          let rx = 0, ry = 0, rz = 0;
          while (attempts < 5) {
            const ri = Math.floor(Math.random() * n);
            const rix = ri * 3;
            const rdx = pp[rix] - cam.x, rdz = pp[rix + 2] - cam.z;
            if (rdx * rdx + rdz * rdz < 80 * 80) {
              rx = pp[rix] + (Math.random() - 0.5) * RAIN_SPREAD_LOCAL;
              ry = pp[rix + 1] + 10 + Math.random() * 20;
              rz = pp[rix + 2] + (Math.random() - 0.5) * RAIN_SPREAD_LOCAL;
              break;
            }
            attempts++;
          }
          if (attempts >= 5) continue;

          alive[i] = 1;
          ages[i] = 0;
          speeds[i] = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);
          lp[i6] = rx; lp[i6 + 1] = ry; lp[i6 + 2] = rz;
          lp[i6 + 3] = rx; lp[i6 + 4] = ry; lp[i6 + 5] = rz;
          dp[i3] = rx; dp[i3 + 1] = ry; dp[i3 + 2] = rz;
        } else {
          lp[i6 + 1] = -9999; lp[i6 + 4] = -9999;
          dp[i3 + 1] = -9999;
          ds[i] = 0; dc[i4 + 3] = 0;
          lc[i8 + 3] = 0; lc[i8 + 7] = 0;
          continue;
        }
      }

      ages[i] += dt;
      const fall = speeds[i] * dt;
      const drift = Math.sin(lp[i6 + 1] * 0.5) * 0.012;

      lp[i6] += drift;
      lp[i6 + 1] -= fall;
      lp[i6 + 2] += drift * 0.3;

      const birthFade = Math.min(ages[i] * 3, 1);
      const streakLen = speeds[i] * 0.14 * birthFade;

      lp[i6 + 3] = lp[i6];
      lp[i6 + 4] = lp[i6 + 1] - streakLen;
      lp[i6 + 5] = lp[i6 + 2];

      dp[i3] = lp[i6]; dp[i3 + 1] = lp[i6 + 1]; dp[i3 + 2] = lp[i6 + 2];

      const dx = lp[i6] - cam.x;
      const dy = lp[i6 + 1] - cam.y;
      const dz = lp[i6 + 2] - cam.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      let nearRock = false;
      for (let ri = 0; ri < n; ri++) {
        const rix = ri * 3;
        const ddx = lp[i6] - pp[rix], ddy = lp[i6 + 1] - pp[rix + 1], ddz = lp[i6 + 2] - pp[rix + 2];
        if (ddx * ddx + ddy * ddy + ddz * ddz < RAIN_SPREAD_LOCAL * RAIN_SPREAD_LOCAL * 4) {
          nearRock = true;
          break;
        }
      }

      if (!nearRock) {
        alive[i] = 0;
        lp[i6 + 1] = -9999; lp[i6 + 4] = -9999;
        dp[i3 + 1] = -9999;
        ds[i] = 0; dc[i4 + 3] = 0; lc[i8 + 3] = 0; lc[i8 + 7] = 0;
        continue;
      }

      const dropletVis = birthFade < 0.8 ? (1 - birthFade) * 0.6 : 0;

      if (dist < NEAR_BLUR_DIST) {
        const t = dist / NEAR_BLUR_DIST;
        lc[i8 + 3] = 0.2 + t * 0.35; lc[i8 + 7] = 0.06;
        ds[i] = 1.5 + (1 - t) * 3.0;
        dc[i4 + 3] = (0.15 + t * 0.2) * (dropletVis + 0.4);
        lc[i8] = 0.15; lc[i8 + 1] = 0.9; lc[i8 + 2] = 0.65;
        lc[i8 + 4] = 0.1; lc[i8 + 5] = 0.65; lc[i8 + 6] = 0.45;
      } else if (dist < FAR_BLUR_DIST) {
        const alpha = 0.4 + Math.random() * 0.3;
        lc[i8 + 3] = alpha; lc[i8 + 7] = alpha * 0.2;
        ds[i] = 0.3;
        dc[i4 + 3] = dropletVis * 0.6;
        lc[i8] = 0; lc[i8 + 1] = 1; lc[i8 + 2] = 0.67;
        lc[i8 + 4] = 0; lc[i8 + 5] = 0.75; lc[i8 + 6] = 0.5;
      } else {
        const t = Math.min((dist - FAR_BLUR_DIST) / 30, 1);
        lc[i8 + 3] = 0.25 * (1 - t); lc[i8 + 7] = 0;
        ds[i] = 0.15;
        dc[i4 + 3] = dropletVis * 0.35 * (1 - t);
        lc[i8] = 0; lc[i8 + 1] = 0.8; lc[i8 + 2] = 0.55;
        lc[i8 + 4] = 0; lc[i8 + 5] = 0.55; lc[i8 + 6] = 0.4;
      }

      if (lp[i6 + 1] < cam.y - 50) {
        alive[i] = 0;
        continue;
      }
    }
    lAttr.needsUpdate = true;
    lcAttr.needsUpdate = true;
    dAttr.needsUpdate = true;
    dcAttr.needsUpdate = true;
    dsAttr.needsUpdate = true;
  });

  return (
    <>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineCol, 4]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points ref={dotsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dotPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[dotCol, 4]} />
          <bufferAttribute attach="attributes-size" args={[dotSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial vertexColors transparent sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </>
  );
}

/* ── Photorealistic Starfield with custom shader ── */
const STAR_COUNT = 45000;

const starVertexShader = `
  attribute float size;
  attribute float brightness;
  varying vec3 vColor;
  varying float vBrightness;
  void main() {
    vColor = color;
    vBrightness = brightness;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 45.0);
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
    
    // Chromatic fringing on bright stars
    vec3 col = vColor;
    if (vBrightness > 0.7) {
      float fringe = outer * (vBrightness - 0.7) * 3.0;
      col += vec3(-0.05, 0.0, 0.08) * fringe;
    }
    
    gl_FragColor = vec4(col * intensity, intensity);
  }
`;

function RealisticStarfield() {
  const pointsRef = useRef<THREE.Points>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, sizes, brightnesses, baseColors } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    const br = new Float32Array(STAR_COUNT);

    const milkyAxis = new THREE.Vector3(0.3, 1, 0.2).normalize();
    const perp1Base = new THREE.Vector3().crossVectors(milkyAxis, new THREE.Vector3(1, 0, 0)).normalize();
    const perp2Base = new THREE.Vector3().crossVectors(milkyAxis, perp1Base).normalize();

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      let theta = Math.random() * Math.PI * 2;
      let phi = Math.acos(2 * Math.random() - 1);

      // 45% concentrated in milky way band with varying density
      if (i < STAR_COUNT * 0.45) {
        const along = (Math.random() - 0.5) * 2;
        // Box-Muller for gaussian spread
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

      // Vary distance for depth
      const r = 180 + Math.random() * 350;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      // Realistic luminosity function (exponential falloff — many dim, few bright)
      const mag = Math.pow(Math.random(), 3.2);
      const brightness = 0.15 + mag * 0.85;
      br[i] = brightness;

      // Realistic spectral color temperatures (Planck-like)
      const temp = Math.random();
      let cr: number, cg: number, cb: number;
      if (temp < 0.03) {
        // O-type blue-white (very rare, very bright)
        cr = 0.62; cg = 0.72; cb = 1.0;
      } else if (temp < 0.13) {
        // B-type blue
        cr = 0.68; cg = 0.8; cb = 1.0;
      } else if (temp < 0.35) {
        // A-type white-blue (Sirius-like)
        cr = 0.88; cg = 0.92; cb = 1.0;
      } else if (temp < 0.55) {
        // F-type yellow-white
        cr = 1.0; cg = 0.98; cb = 0.92;
      } else if (temp < 0.72) {
        // G-type yellow (Sun-like)
        cr = 1.0; cg = 0.94; cb = 0.8;
      } else if (temp < 0.88) {
        // K-type orange
        cr = 1.0; cg = 0.8; cb = 0.55;
      } else {
        // M-type red (most common in reality)
        cr = 1.0; cg = 0.6; cb = 0.35;
      }
      col[i3] = cr * brightness;
      col[i3 + 1] = cg * brightness;
      col[i3 + 2] = cb * brightness;

      // Size distribution: inverse square law feel
      sz[i] = mag < 0.05 ? 0.1 + Math.random() * 0.08
            : mag < 0.3 ? 0.18 + mag * 0.4
            : mag < 0.7 ? 0.4 + mag * 1.0
            : mag < 0.9 ? 1.2 + mag * 2.5
            : 3.5 + mag * 5.0; // very rare brilliant stars
    }
    return { positions: pos, colors: col, sizes: sz, brightnesses: br, baseColors: new Float32Array(col) };
  }, []);

  const twinklePhases = useMemo(() => {
    const p = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) p[i] = Math.random() * Math.PI * 2;
    return p;
  }, []);
  const twinkleSpeeds = useMemo(() => {
    const s = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) s[i] = 0.08 + Math.random() * 0.6;
    return s;
  }, []);
  // Atmospheric scintillation intensity per star (brighter stars twinkle more noticeably)
  const twinkleAmplitudes = useMemo(() => {
    const a = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      a[i] = 0.05 + brightnesses[i] * 0.25;
    }
    return a;
  }, [brightnesses]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const col = colAttr.array as Float32Array;
    const brAttr = pointsRef.current.geometry.attributes.brightness as THREE.BufferAttribute;
    const brArr = brAttr.array as Float32Array;

    // Twinkle with atmospheric scintillation pattern
    for (let i = 0; i < STAR_COUNT; i += 2) {
      const amp = twinkleAmplitudes[i];
      const phase = twinklePhases[i];
      const speed = twinkleSpeeds[i];
      // Multi-frequency scintillation for realism
      const scint = 1.0 - amp * (
        0.5 * (1 - Math.cos(t * speed + phase)) +
        0.3 * (1 - Math.cos(t * speed * 2.7 + phase * 1.3)) +
        0.2 * (1 - Math.cos(t * speed * 0.3 + phase * 0.7))
      );
      const i3 = i * 3;
      col[i3] = baseColors[i3] * scint;
      col[i3 + 1] = baseColors[i3 + 1] * scint;
      col[i3 + 2] = baseColors[i3 + 2] * scint;
      brArr[i] = brightnesses[i] * scint;
    }
    colAttr.needsUpdate = true;
    brAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-brightness" args={[brightnesses, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Airplane-style camera: smooth circuits over the field ── */
function CockpitCamera({ physics, audioRef }: { physics: RockPhysics; audioRef: React.MutableRefObject<AudioAnalysis> }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, -2, 0));
  const smoothQuat = useRef(new THREE.Quaternion());
  const smoothedAmplitude = useRef(0);
  const smoothedBass = useRef(0);
  const elapsed = useRef(0);

  // Flight closer to objects for better visibility
  const CRUISE_ALT = -5.5;
  const LOW_ALT = -7.0;

  const prevTangentRef = useRef(new THREE.Vector3(1, 0, 0));
  const smoothBank = useRef(0);
  const smoothInversion = useRef(0); // continuous roll angle for disorientation

  useFrame((_, dt) => {
    const clampDt = Math.min(dt, 0.033);
    elapsed.current += clampDt;
    const t = elapsed.current;

    // Audio smoothing
    const audio = audioRef.current;
    smoothedAmplitude.current += (audio.amplitude - smoothedAmplitude.current) * 0.015;
    smoothedBass.current += (audio.bass - smoothedBass.current) * 0.02;
    const sa = smoothedAmplitude.current;

    const baseSpeed = 0.009 + sa * 0.003;
    const phase = t * baseSpeed;

    const rx = 80;
    const rz = 55;

    const pathX = Math.sin(phase) * rx;
    const pathZ = Math.cos(phase) * rz;

    // ── Disorienting roll: slow continuous rotation that drifts through
    // inverted flight, sideways, upright – never settling clearly ──
    // Multiple overlapping sine waves create unpredictable orientation
    const rollTarget =
      Math.sin(t * 0.04) * 1.8 +          // very slow primary roll (~157s cycle)
      Math.sin(t * 0.071 + 1.3) * 1.2 +    // secondary drift
      Math.sin(t * 0.023 + 3.7) * 0.7 +    // ultra-slow wobble
      sa * Math.sin(t * 0.15) * 0.4;        // audio-reactive nudge
    smoothInversion.current += (rollTarget - smoothInversion.current) * 0.012;

    // Altitude also drifts unpredictably – sometimes above, sometimes below field
    const altDrift =
      Math.sin(t * 0.035) * 4.0 +
      Math.sin(t * 0.08 + 2.1) * 2.5 +
      Math.cos(t * 0.019) * 3.0;

    const centerDist = Math.sqrt(pathX * pathX + pathZ * pathZ) / Math.max(rx, rz);
    const desiredAlt = CRUISE_ALT + altDrift + sa * 0.5;

    const targetPos = new THREE.Vector3(pathX, desiredAlt, pathZ);

    // Analytic tangent
    const dxdt = Math.cos(phase) * rx * baseSpeed;
    const dzdt = -Math.sin(phase) * rz * baseSpeed;
    // Pitch follows altitude drift derivative
    const dydt =
      Math.cos(t * 0.035) * 0.035 * 4.0 +
      Math.cos(t * 0.08 + 2.1) * 0.08 * 2.5 +
      -Math.sin(t * 0.019) * 0.019 * 3.0;
    const tangent = new THREE.Vector3(dxdt, dydt, dzdt).normalize();

    // Smooth banking from tangent change
    const cross = prevTangentRef.current.clone().cross(tangent);
    const rawBank = Math.atan2(cross.y, 1) * 0.4;
    smoothBank.current += (rawBank - smoothBank.current) * 0.02;
    prevTangentRef.current.copy(tangent);

    // Build orientation
    const up = new THREE.Vector3(0, 1, 0);
    const lookTarget = targetPos.clone().add(tangent.clone().multiplyScalar(10));
    const lookMatrix = new THREE.Matrix4().lookAt(targetPos, lookTarget, up);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);

    // Apply bank + continuous disorienting roll
    const totalRoll = smoothBank.current + smoothInversion.current;
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1), -totalRoll
    );
    targetQuat.multiply(rollQuat);

    // Buttery smooth interpolation
    smoothPos.current.lerp(targetPos, 0.02);
    smoothQuat.current.slerp(targetQuat, 0.025);

    camera.position.copy(smoothPos.current);
    camera.quaternion.copy(smoothQuat.current);
  });

  return null;
}


/* ── Cockpit frame ── */
function CockpitHUD() {
  const c = LINE_COLOR;
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none">
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
        <rect x="140" y="900" width="200" height="80" rx="4" fill="none" stroke={c} strokeWidth="0.6" opacity="0.2" />
        <rect x="860" y="895" width="200" height="85" rx="4" fill="none" stroke={c} strokeWidth="0.6" opacity="0.2" />
        <rect x="1580" y="900" width="200" height="80" rx="4" fill="none" stroke={c} strokeWidth="0.6" opacity="0.2" />
      </svg>
    </div>
  );
}

/* ── Slow background meteor with long glowing tail ── */
function BackgroundMeteor() {
  const { camera } = useThree();
  const linesRef = useRef<THREE.LineSegments>(null);
  const headRef = useRef<THREE.Points>(null);

  const TRAIL_SEGS = 120;
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
  const nextSpawn = useRef(3 + Math.random() * 8);
  const elapsed = useRef(0);

  // Position history for smooth curved tail
  const posHistory = useRef<THREE.Vector3[]>([]);

  useFrame((_, dt) => {
    elapsed.current += dt;
    const t = elapsed.current;
    const m = meteor.current;
    const cam = camera.position;

    // Spawn in the far background sky
    if (!m.active && t > nextSpawn.current) {
      const skyAngle = Math.random() * Math.PI * 2;
      const skyElev = 0.2 + Math.random() * 0.45;
      const dist = 250 + Math.random() * 100;

      m.pos.set(
        cam.x + Math.cos(skyAngle) * dist,
        cam.y + skyElev * dist * 0.6 + 50,
        cam.z + Math.sin(skyAngle) * dist
      );

      const speed = 3 + Math.random() * 4;
      const crossAngle = skyAngle + Math.PI * 0.4 + (Math.random() - 0.5) * 0.6;
      m.vel.set(
        Math.cos(crossAngle) * speed,
        -(0.02 + Math.random() * 0.06) * speed,
        Math.sin(crossAngle) * speed
      );

      m.life = 0;
      m.maxLife = 15 + Math.random() * 20;
      m.tailLen = 80 + Math.random() * 60;
      m.brightness = 0.6 + Math.random() * 0.4;
      m.active = true;
      posHistory.current = [];
      nextSpawn.current = t + 25 + Math.random() * 40;
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

    posHistory.current.push(m.pos.clone());
    if (posHistory.current.length > 200) posHistory.current.shift();

    if (m.life > m.maxLife) { m.active = false; }

    const fadeIn = Math.min(m.life * 0.5, 1);
    const fadeOut = Math.min((m.maxLife - m.life) * 0.3, 1);
    const fade = fadeIn * fadeOut * m.brightness;

    // Head glow
    hArr[0] = m.pos.x; hArr[1] = m.pos.y; hArr[2] = m.pos.z;
    hsArr[0] = 4.0 * fade;
    hcArr[0] = 1.0; hcArr[1] = 0.95; hcArr[2] = 0.8;

    // Tail from position history
    const history = posHistory.current;
    const hLen = history.length;

    for (let s = 0; s < TRAIL_SEGS; s++) {
      const idx = s * 6;
      const cidx = s * 8;
      const t0 = s / TRAIL_SEGS;
      const t1 = (s + 1) / TRAIL_SEGS;

      const hi0 = Math.max(0, hLen - 1 - Math.floor(t0 * Math.min(hLen, TRAIL_SEGS)));
      const hi1 = Math.max(0, hLen - 1 - Math.floor(t1 * Math.min(hLen, TRAIL_SEGS)));

      if (hi0 < hLen && hi1 < hLen) {
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

      const alpha0 = (1 - t0) * (1 - t0) * fade * 0.8;
      const alpha1 = (1 - t1) * (1 - t1) * fade * 0.8;
      const w0 = 1 - t0; const w1 = 1 - t1;
      cArr[cidx] = 0.2+w0*0.8; cArr[cidx+1] = 0.6+w0*0.4; cArr[cidx+2] = 0.8+w0*0.2; cArr[cidx+3] = alpha0;
      cArr[cidx+4] = 0.2+w1*0.8; cArr[cidx+5] = 0.6+w1*0.4; cArr[cidx+6] = 0.8+w1*0.2; cArr[cidx+7] = alpha1;
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.color.needsUpdate = true;
    headRef.current.geometry.attributes.position.needsUpdate = true;
    headRef.current.geometry.attributes.size.needsUpdate = true;
    headRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailCol, 4]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points ref={headRef}>
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
function RockField({ physics }: { physics: RockPhysics }) {
  const indices = useMemo(() => Array.from({ length: physics.count }, (_, i) => i), [physics.count]);
  return (
    <>
      {indices.map(i => <DynamicRock key={i} index={i} physics={physics} />)}
    </>
  );
}

/* ── Main ── */
export default function EliteShipScene({ embedded = false }: { embedded?: boolean }) {
  const initialRocks = useInitialRocks();
  const physics = useMemo(() => createRockPhysics(initialRocks), [initialRocks]);
  const { playing, start, stop, analysisRef } = useAudioAnalyser();

  return (
    <div className={`relative w-full ${embedded ? 'h-[80vh] rounded-xl overflow-hidden' : 'h-screen'} overflow-hidden`} style={{ background: BG }}>
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <PhysicsDriver physics={physics} />
        <CockpitCamera physics={physics} audioRef={analysisRef} />
        <RealisticStarfield />
        <BackgroundMeteor />
        <Rain physics={physics} />
        <RockField physics={physics} />
        <DebrisSystem physics={physics} />
      </Canvas>
      
      <CockpitHUD />

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
        {playing ? '■ STOP 432Hz' : '♫ 432Hz AMBIENT'}
      </button>
    </div>
  );
}
