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

/* ── Realistic Starfield with Milky Way band ── */
const STAR_COUNT = 30000;
function RealisticStarfield() {
  const pointsRef = useRef<THREE.Points>(null);
  const { positions, baseColors, sizes } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);

    // Milky Way band direction (tilted across sky)
    const milkyAxis = new THREE.Vector3(0.3, 1, 0.2).normalize();

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      let theta = Math.random() * Math.PI * 2;
      let phi = Math.acos(2 * Math.random() - 1);

      // Concentrate ~40% of stars near milky way band
      if (i < STAR_COUNT * 0.4) {
        const bandDir = milkyAxis.clone();
        const perp1 = new THREE.Vector3().crossVectors(bandDir, new THREE.Vector3(1, 0, 0)).normalize();
        const perp2 = new THREE.Vector3().crossVectors(bandDir, perp1).normalize();
        const along = (Math.random() - 0.5) * 2;
        const spread = (Math.random() - 0.5) * 0.25 + (Math.random() - 0.5) * 0.25; // tight gaussian-like
        const spread2 = (Math.random() - 0.5) * 0.25 + (Math.random() - 0.5) * 0.25;
        const dir = new THREE.Vector3()
          .addScaledVector(bandDir, along)
          .addScaledVector(perp1, spread)
          .addScaledVector(perp2, spread2)
          .normalize();
        theta = Math.atan2(dir.z, dir.x);
        phi = Math.acos(dir.y);
      }

      const r = 200 + Math.random() * 300;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      // Realistic magnitude distribution (more dim stars)
      const mag = Math.pow(Math.random(), 5);
      const brightness = 0.08 + mag * 0.92;

      // Spectral classes: O/B blue, A white, F/G yellow, K orange, M red
      const temp = Math.random();
      if (temp < 0.45) {
        // A/F white-blue (most common visible)
        col[i3] = 0.85 * brightness; col[i3+1] = 0.9 * brightness; col[i3+2] = 1.0 * brightness;
      } else if (temp < 0.7) {
        // G yellow-white (sun-like)
        col[i3] = 1.0 * brightness; col[i3+1] = 0.97 * brightness; col[i3+2] = 0.85 * brightness;
      } else if (temp < 0.85) {
        // B blue
        col[i3] = 0.6 * brightness; col[i3+1] = 0.75 * brightness; col[i3+2] = 1.0 * brightness;
      } else if (temp < 0.94) {
        // K orange
        col[i3] = 1.0 * brightness; col[i3+1] = 0.78 * brightness; col[i3+2] = 0.45 * brightness;
      } else {
        // M red
        col[i3] = 1.0 * brightness; col[i3+1] = 0.5 * brightness; col[i3+2] = 0.3 * brightness;
      }

      // Size: most stars tiny, few bright ones larger
      sz[i] = mag < 0.1 ? 0.04 + Math.random() * 0.04
            : mag < 0.5 ? 0.08 + mag * 0.2
            : mag < 0.85 ? 0.2 + mag * 0.6
            : 0.8 + mag * 1.5; // rare bright stars
    }
    return { positions: pos, baseColors: col, sizes: sz };
  }, []);

  const renderColors = useMemo(() => new Float32Array(baseColors), [baseColors]);
  const twinklePhases = useMemo(() => {
    const p = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) p[i] = Math.random() * Math.PI * 2;
    return p;
  }, []);
  const twinkleSpeeds = useMemo(() => {
    const s = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) s[i] = 0.1 + Math.random() * 0.8; // slower twinkle
    return s;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const col = colAttr.array as Float32Array;
    // Twinkle only brighter stars (every 3rd) for perf
    for (let i = 0; i < STAR_COUNT; i += 3) {
      const scintillation = 0.75 + 0.25 * Math.sin(t * twinkleSpeeds[i] + twinklePhases[i]);
      const i3 = i * 3;
      col[i3] = baseColors[i3] * scintillation;
      col[i3+1] = baseColors[i3+1] * scintillation;
      col[i3+2] = baseColors[i3+2] * scintillation;
    }
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[renderColors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial vertexColors transparent opacity={1} size={0.3} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ── Music-reactive Thruster Camera (smooth) ── */
function CockpitCamera({ physics, audioRef }: { physics: RockPhysics; audioRef: React.MutableRefObject<AudioAnalysis> }) {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(0, -5, 0));
  const vel = useRef(new THREE.Vector3(0, 0, -3));
  const orientation = useRef(new THREE.Quaternion());
  const angVel = useRef(new THREE.Vector3(0, 0, 0));
  const thrusterTime = useRef(0);
  const thrusters = useRef<{ axis: THREE.Vector3; torqueAxis: THREE.Vector3; force: number; torque: number; startTime: number; duration: number }[]>([]);
  const nextThrusterAt = useRef(0);
  const currentTarget = useRef<number>(-1);
  const targetCooldown = useRef(0);
  const smoothedAmplitude = useRef(0);
  const smoothedBass = useRef(0);
  // Extra smoothing for camera output
  const smoothPos = useRef(new THREE.Vector3(0, -5, 0));
  const smoothQuat = useRef(new THREE.Quaternion());

  useFrame((_, dt) => {
    thrusterTime.current += dt;
    const t = thrusterTime.current;
    const clampDt = Math.min(dt, 0.05);
    const p = pos.current;
    const pp = physics.positions;
    const pr = physics.radii;
    const n = physics.count;

    // ── Audio reactivity (very smooth) ──
    const audio = audioRef.current;
    const amp = audio.amplitude;
    const bass = audio.bass;
    smoothedAmplitude.current += (amp - smoothedAmplitude.current) * 0.02; // very slow smoothing
    smoothedBass.current += (bass - smoothedBass.current) * 0.03;
    const sa = smoothedAmplitude.current;
    const sb = smoothedBass.current;

    // Music modulates very gently – slow meditative cruise
    const musicSpeedMult = 0.25 + sa * 0.4;
    const musicThrustMult = 0.2 + sb * 0.5;
    const musicThrusterInterval = 6.0 - sa * 2.0;

    // Beat triggers a very gentle directional nudge
    if (audio.beat) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation.current);
      thrusters.current.push({
        axis: forward.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.05, 0)).normalize(),
        torqueAxis: new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).normalize(),
        force: 0.4 + sb * 0.6,
        torque: (Math.random() - 0.5) * 0.03,
        startTime: t,
        duration: 1.5 + Math.random() * 2.0, // very long, gentle burn
      });
    }

    // ── NO collision avoidance – fly through freely ──
    // Instead: find nearby rocks for cinematic close flyby targeting
    const tmpVec = new THREE.Vector3();
    const avoidForce = new THREE.Vector3(0, 0, 0); // minimal – just prevent literal overlap
    const avoidTorque = new THREE.Vector3(0, 0, 0);

    // Only prevent clipping through rock centers (very tight)
    for (let oi = 0; oi < n; oi++) {
      const ox = oi * 3;
      tmpVec.set(p.x - pp[ox], p.y - pp[ox + 1], p.z - pp[ox + 2]);
      const dist = tmpVec.length();
      const surfaceDist = dist - pr[oi];
      if (surfaceDist < 0.5) {
        // Only nudge gently if literally inside a rock
        avoidForce.addScaledVector(tmpVec.normalize(), 3.0 * (0.5 - surfaceDist));
      }
    }

    // ── Attraction: target rocks for close flybys ──
    targetCooldown.current -= clampDt;
    if (targetCooldown.current <= 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation.current);
      let bestScore = -Infinity;
      let bestIdx = -1;

      for (let oi = 0; oi < n; oi++) {
        const ox = oi * 3;
        tmpVec.set(pp[ox] - p.x, pp[ox + 1] - p.y, pp[ox + 2] - p.z);
        const dist = tmpVec.length();
        if (dist < 3 || dist > 50) continue;
        const dot = tmpVec.normalize().dot(forward);
        if (dot < -0.2) continue;

        // Prefer rocks that are close but slightly off-axis (= near-miss flyby)
        const offAxis = Math.abs(1.0 - Math.abs(dot)); // higher = more off-center
        let neighbors = 0;
        for (let nj = 0; nj < Math.min(n, 200); nj++) {
          if (nj === oi) continue;
          const njx = nj * 3;
          const ddx = pp[njx] - pp[ox], ddy = pp[njx + 1] - pp[ox + 1], ddz = pp[njx + 2] - pp[ox + 2];
          if (ddx * ddx + ddy * ddy + ddz * ddz < 150) neighbors++;
          if (neighbors > 6) break;
        }

        // Score: prefer forward + close + off-axis (dramatic flyby) + dense areas
        const score = dot * 1.5 + (1 - dist / 50) * 2.5 + offAxis * 3.0 + neighbors * 0.5 + Math.random() * 0.3;
        if (score > bestScore) { bestScore = score; bestIdx = oi; }
      }
      currentTarget.current = bestIdx;
      targetCooldown.current = 2.0 + Math.random() * 3.0;
    }

    const attractForce = new THREE.Vector3(0, 0, 0);
    if (currentTarget.current >= 0) {
      const ox = currentTarget.current * 3;
      tmpVec.set(pp[ox] - p.x, pp[ox + 1] - p.y, pp[ox + 2] - p.z);
      const dist = tmpVec.length();
      if (dist > 2) {
        // Aim slightly offset for flyby – not directly at the rock
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation.current);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(orientation.current);
        // Offset to the side for a cinematic pass
        const offsetDir = right.clone().multiplyScalar((Math.sin(t * 0.3) > 0 ? 1 : -1) * 2.0);
        tmpVec.add(offsetDir);
        attractForce.copy(tmpVec.normalize()).multiplyScalar(1.5 + sa * 1.0);
      }
    }

    // ── Altitude: alternate between above and within the field ──
    let nearbyYSum = 0, nearbyCount = 0;
    for (let oi = 0; oi < n; oi++) {
      const ox = oi * 3;
      const ddx = pp[ox] - p.x, ddz = pp[ox + 2] - p.z;
      if (ddx * ddx + ddz * ddz < 600) {
        nearbyYSum += pp[ox + 1] + pr[oi];
        nearbyCount++;
      }
    }
    if (nearbyCount > 0) {
      const avgTop = nearbyYSum / nearbyCount;
      // Long altitude cycles: mostly flying above for horizon views, occasional dips
      const altCycle = Math.sin(t * 0.04) * 0.5 + 0.5; // ~160s period
      const diveCycle = Math.max(0, Math.sin(t * 0.018)); // only positive = occasional dive
      // Spend most time above the field showing horizon, brief dives through
      const desiredAlt = avgTop + 2.0 + altCycle * 5.0 - diveCycle * 4.0 + sa * 0.5;
      const altDiff = desiredAlt - p.y;
      attractForce.y += altDiff * 0.15; // gentle altitude correction
    } else {
      attractForce.y += (-5 - p.y) * 0.1;
    }

    // ── Thruster bursts (music-synced, smoother) ──
    if (t > nextThrusterAt.current) {
      const ax = (Math.random() - 0.5) * 0.8;
      const ay = (Math.random() - 0.5) * 0.3;
      const az = -0.3 - Math.random() * 0.5;
      const axis = new THREE.Vector3(ax, ay, az).normalize();
      const tx = (Math.random() - 0.5) * 0.5;
      const ty = (Math.random() - 0.5) * 0.5;
      const tz = (Math.random() - 0.5) * 0.5;
      const torqueAxis = new THREE.Vector3(tx, ty, tz).normalize();
      thrusters.current.push({
        axis, torqueAxis,
        force: (0.2 + Math.random() * 0.6) * musicThrustMult,
        torque: (Math.random() - 0.5) * 0.04,
        startTime: t,
        duration: 3.0 + Math.random() * 6.0, // very long, slow burns
      });
      nextThrusterAt.current = t + Math.max(3.0, musicThrusterInterval + Math.random() * 4.0);
    }

    const thrustAccel = new THREE.Vector3(0, 0, 0);
    const torqueAccel = new THREE.Vector3(0, 0, 0);
    thrusters.current = thrusters.current.filter(th => {
      const elapsed = t - th.startTime;
      if (elapsed > th.duration) return false;
      // Smooth envelope: slow ramp up and down
      const rampUp = Math.min(elapsed / 0.4, 1);
      const rampDown = Math.min((th.duration - elapsed) / 0.5, 1);
      const env = rampUp * rampDown;
      const worldAxis = th.axis.clone().applyQuaternion(orientation.current);
      thrustAccel.addScaledVector(worldAxis, th.force * env);
      torqueAccel.addScaledVector(th.torqueAxis, th.torque * env);
      return true;
    });

    const DRAG = 0.4; // higher drag for very smooth deceleration
    const ANG_DRAG = 0.85; // heavy angular drag = barely any rotation jerk
    vel.current.addScaledVector(thrustAccel, clampDt);
    vel.current.addScaledVector(avoidForce, clampDt);
    vel.current.addScaledVector(attractForce, clampDt);
    vel.current.multiplyScalar(1 - DRAG * clampDt);

    const maxSpeed = 2.0 + sa * 2.0;    // much slower, meditative cruise
    const minSpeed = 0.3 + sa * 0.3;
    const speed = vel.current.length();
    if (speed > maxSpeed) vel.current.multiplyScalar(maxSpeed / speed);
    if (speed < minSpeed) vel.current.multiplyScalar(minSpeed / Math.max(speed, 0.01));

    pos.current.addScaledVector(vel.current, clampDt * musicSpeedMult);

    angVel.current.addScaledVector(torqueAccel, clampDt);
    angVel.current.addScaledVector(avoidTorque, clampDt);
    angVel.current.multiplyScalar(1 - ANG_DRAG * clampDt);
    const angSpeed = angVel.current.length();
    if (angSpeed > 0.15) angVel.current.multiplyScalar(0.15 / angSpeed); // very tight clamp

    if (angSpeed > 0.0001) {
      const halfAngle = angSpeed * clampDt * 0.5;
      const s = Math.sin(halfAngle) / angSpeed;
      const dq = new THREE.Quaternion(angVel.current.x * s, angVel.current.y * s, angVel.current.z * s, Math.cos(halfAngle));
      orientation.current.premultiply(dq);
      orientation.current.normalize();
    }

    // Align orientation toward velocity direction (very gentle)
    if (speed > 0.3) {
      const velDir = vel.current.clone().normalize();
      const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), velDir);
      orientation.current.slerp(targetQ, 0.008); // extremely gentle alignment
    }

    // ── Smooth camera output with heavy interpolation ──
    smoothPos.current.lerp(pos.current, 0.03); // very heavy smoothing on position
    smoothQuat.current.slerp(orientation.current, 0.03); // very heavy smoothing on rotation

    camera.position.copy(smoothPos.current);
    camera.quaternion.copy(smoothQuat.current);
  });

  return null;
}

/* ── Glowing particles drifting between rock clusters ── */
const GLOW_COUNT = 600;
function GlowParticles({ physics }: { physics: RockPhysics }) {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const { positions, colors, sizes, velocities, phases } = useMemo(() => {
    const pos = new Float32Array(GLOW_COUNT * 3);
    const col = new Float32Array(GLOW_COUNT * 4);
    const sz = new Float32Array(GLOW_COUNT);
    const vel = new Float32Array(GLOW_COUNT * 3);
    const ph = new Float32Array(GLOW_COUNT);

    const pp = physics.positions;
    const n = physics.count;

    for (let i = 0; i < GLOW_COUNT; i++) {
      // Place near random rocks
      const ri = Math.floor(Math.random() * n);
      const rx = ri * 3;
      pos[i * 3] = pp[rx] + (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = pp[rx + 1] + (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = pp[rx + 2] + (Math.random() - 0.5) * 12;

      // Gentle drift velocity
      vel[i * 3] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      // Color: mix of cyan, green, white glows
      const type = Math.random();
      if (type < 0.4) {
        col[i * 4] = 0.1; col[i * 4 + 1] = 1.0; col[i * 4 + 2] = 0.7; // cyan-green
      } else if (type < 0.7) {
        col[i * 4] = 0.0; col[i * 4 + 1] = 0.8; col[i * 4 + 2] = 1.0; // cyan
      } else if (type < 0.9) {
        col[i * 4] = 0.7; col[i * 4 + 1] = 1.0; col[i * 4 + 2] = 0.9; // white-green
      } else {
        col[i * 4] = 0.2; col[i * 4 + 1] = 1.0; col[i * 4 + 2] = 0.4; // pure green
      }
      col[i * 4 + 3] = 0.3 + Math.random() * 0.5;

      sz[i] = 0.5 + Math.random() * 2.5;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, colors: col, sizes: sz, velocities: vel, phases: ph };
  }, [physics]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const szAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;
    const sz = szAttr.array as Float32Array;
    const cam = camera.position;

    for (let i = 0; i < GLOW_COUNT; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      // Gentle drift
      pos[i3] += velocities[i3] * 0.016;
      pos[i3 + 1] += velocities[i3 + 1] * 0.016;
      pos[i3 + 2] += velocities[i3 + 2] * 0.016;

      // Pulsing glow
      const pulse = 0.4 + 0.6 * Math.sin(t * (0.3 + phases[i] * 0.2) + phases[i]);
      const baseSz = sizes[i];
      sz[i] = baseSz * pulse;

      // Alpha pulsing
      const baseAlpha = colors[i4 + 3];
      col[i4 + 3] = baseAlpha * pulse;

      // Distance fade
      const dx = pos[i3] - cam.x;
      const dy = pos[i3 + 1] - cam.y;
      const dz = pos[i3 + 2] - cam.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 80) col[i4 + 3] *= Math.max(0, 1 - (dist - 80) / 40);

      // Brighten when very close for flyby glow effect
      if (dist < 8) {
        sz[i] *= 1.5 + (1 - dist / 8) * 2;
        col[i4 + 3] = Math.min(1, col[i4 + 3] * 1.5);
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    szAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[new Float32Array(colors), 4]} />
        <bufferAttribute attach="attributes-size" args={[new Float32Array(sizes), 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
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

/* ── Comets with long tails ── */
const MAX_COMETS = 3;
function Comets() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  interface CometData {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
    brightness: number;
    tailLen: number;
  }

  const comets = useRef<CometData[]>([]);
  const nextSpawn = useRef(5 + Math.random() * 15);
  const elapsed = useRef(0);

  // Trail geometry: each comet gets TRAIL_SEGS segments
  const TRAIL_SEGS = 60;
  const trailPos = useMemo(() => new Float32Array(MAX_COMETS * TRAIL_SEGS * 6), []);
  const trailCol = useMemo(() => new Float32Array(MAX_COMETS * TRAIL_SEGS * 8), []);
  const linesRef = useRef<THREE.LineSegments>(null);
  const headRef = useRef<THREE.Points>(null);
  const headPos = useMemo(() => new Float32Array(MAX_COMETS * 3), []);
  const headSizes = useMemo(() => new Float32Array(MAX_COMETS), []);
  const headCol = useMemo(() => new Float32Array(MAX_COMETS * 3), []);

  useFrame((_, dt) => {
    elapsed.current += dt;
    const t = elapsed.current;

    // Spawn new comets
    if (t > nextSpawn.current && comets.current.length < MAX_COMETS) {
      const camPos = camera.position;
      // Spawn far away in a random direction in the sky (above horizon)
      const angle = Math.random() * Math.PI * 2;
      const elev = 0.2 + Math.random() * 0.6; // above horizon
      const dist = 120 + Math.random() * 80;
      const startPos = new THREE.Vector3(
        camPos.x + Math.cos(angle) * dist,
        camPos.y + elev * dist * 0.5 + 30,
        camPos.z + Math.sin(angle) * dist
      );
      // Velocity: cross the sky
      const speed = 15 + Math.random() * 25;
      const velAngle = angle + Math.PI + (Math.random() - 0.5) * 1.2;
      const vel = new THREE.Vector3(
        Math.cos(velAngle) * speed,
        -(0.1 + Math.random() * 0.3) * speed, // slight downward
        Math.sin(velAngle) * speed
      );

      comets.current.push({
        pos: startPos,
        vel,
        life: 0,
        maxLife: 4 + Math.random() * 6,
        brightness: 0.5 + Math.random() * 0.5,
        tailLen: 30 + Math.random() * 40,
      });
      nextSpawn.current = t + 8 + Math.random() * 20;
    }

    // Update comets
    const deadIndices: number[] = [];
    comets.current.forEach((c, ci) => {
      c.life += dt;
      c.pos.addScaledVector(c.vel, dt);

      if (c.life > c.maxLife) {
        deadIndices.push(ci);
      }
    });
    // Remove dead
    for (let i = deadIndices.length - 1; i >= 0; i--) {
      comets.current.splice(deadIndices[i], 1);
    }

    // Update trail geometry
    if (!linesRef.current || !headRef.current) return;
    const lArr = linesRef.current.geometry.attributes.position.array as Float32Array;
    const cArr = linesRef.current.geometry.attributes.color.array as Float32Array;
    const hArr = headRef.current.geometry.attributes.position.array as Float32Array;
    const hsArr = headRef.current.geometry.attributes.size.array as Float32Array;
    const hcArr = headRef.current.geometry.attributes.color.array as Float32Array;

    // Clear all
    lArr.fill(-9999);
    cArr.fill(0);
    hArr.fill(-9999);
    hsArr.fill(0);

    comets.current.forEach((c, ci) => {
      if (ci >= MAX_COMETS) return;
      const fadeIn = Math.min(c.life * 2, 1);
      const fadeOut = Math.min((c.maxLife - c.life) * 1.5, 1);
      const fade = fadeIn * fadeOut * c.brightness;

      // Head
      hArr[ci * 3] = c.pos.x;
      hArr[ci * 3 + 1] = c.pos.y;
      hArr[ci * 3 + 2] = c.pos.z;
      hsArr[ci] = 3.0 * fade;
      hcArr[ci * 3] = 0.9; hcArr[ci * 3 + 1] = 1.0; hcArr[ci * 3 + 2] = 0.95;

      // Trail segments behind the comet
      const tailDir = c.vel.clone().normalize();
      const baseOff = ci * TRAIL_SEGS;
      for (let s = 0; s < TRAIL_SEGS; s++) {
        const t0 = s / TRAIL_SEGS;
        const t1 = (s + 1) / TRAIL_SEGS;
        const idx = (baseOff + s) * 6;
        const cidx = (baseOff + s) * 8;

        const p0 = c.pos.clone().addScaledVector(tailDir, -t0 * c.tailLen);
        const p1 = c.pos.clone().addScaledVector(tailDir, -t1 * c.tailLen);

        lArr[idx] = p0.x; lArr[idx + 1] = p0.y; lArr[idx + 2] = p0.z;
        lArr[idx + 3] = p1.x; lArr[idx + 4] = p1.y; lArr[idx + 5] = p1.z;

        const alpha0 = (1 - t0) * fade * 0.7;
        const alpha1 = (1 - t1) * fade * 0.7;
        // Gradient: white-green head to dim green tail
        cArr[cidx] = 0.3 + (1 - t0) * 0.7;
        cArr[cidx + 1] = 1.0;
        cArr[cidx + 2] = 0.5 + (1 - t0) * 0.5;
        cArr[cidx + 3] = alpha0;
        cArr[cidx + 4] = 0.2 + (1 - t1) * 0.6;
        cArr[cidx + 5] = 0.9;
        cArr[cidx + 6] = 0.4 + (1 - t1) * 0.4;
        cArr[cidx + 7] = alpha1;
      }
    });

    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.color.needsUpdate = true;
    headRef.current.geometry.attributes.position.needsUpdate = true;
    headRef.current.geometry.attributes.size.needsUpdate = true;
    headRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
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
export default function EliteShipScene() {
  const initialRocks = useInitialRocks();
  const physics = useMemo(() => createRockPhysics(initialRocks), [initialRocks]);
  const { playing, start, stop, analysisRef } = useAudioAnalyser();

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <GlowParticles physics={physics} />
        <PhysicsDriver physics={physics} />
        <CockpitCamera physics={physics} audioRef={analysisRef} />
        <RealisticStarfield />
        <Comets />
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
