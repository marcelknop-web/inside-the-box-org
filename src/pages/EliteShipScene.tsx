import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createRockPhysics, stepPhysics, DynamicRock, type RockPhysics } from '@/components/elite/PhysicsRocks';
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
    // Dense carpet of rocks forming a horizon
    const gridX = 50, gridZ = 30, spacing = 4;
    let idx = 0;
    for (let gx = 0; gx < gridX; gx++) {
      for (let gz = 0; gz < gridZ; gz++) {
        const r = 0.8 + rng(idx, 0) * 2.2;
        rocks.push({
          seed: idx * 13 + 7, radius: r,
          position: [
            gx * spacing + (rng(idx, 1) - 0.5) * spacing * 0.6 - (gridX * spacing) / 2,
            -8 + (rng(idx, 3) - 0.5) * 1.0 - r * 0.1,
            gz * spacing + (rng(idx, 2) - 0.5) * spacing * 0.6 - (gridZ * spacing) / 2,
          ],
          rotSpeed: [(rng(idx, 7) - 0.5) * 0.08, (rng(idx, 8) - 0.5) * 0.1, (rng(idx, 9) - 0.5) * 0.06],
        });
        idx++;
      }
    }
    // Floating rocks above the carpet
    const rng2 = (i: number, off: number) => {
      let x = Math.sin(i * 73.1 + off * 419.3) * 31758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 30; i++) {
      rocks.push({
        seed: i * 31 + 100, radius: 0.6 + rng2(i, 0) * 2.0,
        position: [rng2(i, 1) * 160 - 80, -4 + rng2(i, 2) * 10, rng2(i, 3) * 100 - 50],
        rotSpeed: [(rng2(i, 7) - 0.5) * 0.15, (rng2(i, 8) - 0.5) * 0.2, (rng2(i, 9) - 0.5) * 0.1],
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
const RAIN_COUNT = 800;
const RAIN_SPREAD_LOCAL = 15;
const FALL_SPEED_MIN = 14;
const FALL_SPEED_MAX = 26;
const NEAR_BLUR_DIST = 6;
const FAR_BLUR_DIST = 50;

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
        if (spawning && Math.random() < intensity * 0.06) {
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
        lc[i8 + 3] = 0.08 + t * 0.15; lc[i8 + 7] = 0.02;
        ds[i] = 1.0 + (1 - t) * 2.0;
        dc[i4 + 3] = (0.08 + t * 0.1) * (dropletVis + 0.3);
        lc[i8] = 0.15; lc[i8 + 1] = 0.85; lc[i8 + 2] = 0.6;
        lc[i8 + 4] = 0.1; lc[i8 + 5] = 0.6; lc[i8 + 6] = 0.4;
      } else if (dist < FAR_BLUR_DIST) {
        const alpha = 0.25 + Math.random() * 0.2;
        lc[i8 + 3] = alpha; lc[i8 + 7] = alpha * 0.15;
        ds[i] = 0.15;
        dc[i4 + 3] = dropletVis * 0.5;
        lc[i8] = 0; lc[i8 + 1] = 1; lc[i8 + 2] = 0.67;
        lc[i8 + 4] = 0; lc[i8 + 5] = 0.7; lc[i8 + 6] = 0.5;
      } else {
        const t = Math.min((dist - FAR_BLUR_DIST) / 30, 1);
        lc[i8 + 3] = 0.12 * (1 - t); lc[i8 + 7] = 0;
        ds[i] = 0.08;
        dc[i4 + 3] = dropletVis * 0.2 * (1 - t);
        lc[i8] = 0; lc[i8 + 1] = 0.75; lc[i8 + 2] = 0.5;
        lc[i8 + 4] = 0; lc[i8 + 5] = 0.5; lc[i8 + 6] = 0.35;
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

/* ── Realistic Starfield ── */
const STAR_COUNT = 20000;
function RealisticStarfield() {
  const pointsRef = useRef<THREE.Points>(null);
  const { positions, baseColors, sizes } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const sz = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 150 + Math.random() * 350;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
      const mag = Math.pow(Math.random(), 4);
      const temp = Math.random();
      const brightness = 0.15 + mag * 0.85;
      if (temp < 0.5) { col[i3] = 0.9 * brightness; col[i3+1] = 0.92 * brightness; col[i3+2] = 1.0 * brightness; }
      else if (temp < 0.75) { col[i3] = 1.0 * brightness; col[i3+1] = 0.96 * brightness; col[i3+2] = 0.88 * brightness; }
      else if (temp < 0.9) { col[i3] = 0.65 * brightness; col[i3+1] = 0.8 * brightness; col[i3+2] = 1.0 * brightness; }
      else if (temp < 0.97) { col[i3] = 1.0 * brightness; col[i3+1] = 0.85 * brightness; col[i3+2] = 0.5 * brightness; }
      else { col[i3] = 1.0 * brightness; col[i3+1] = 0.55 * brightness; col[i3+2] = 0.3 * brightness; }
      sz[i] = mag < 0.15 ? 0.08 + Math.random() * 0.06 : mag < 0.7 ? 0.14 + mag * 0.3 : 0.5 + mag * 1.2;
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
    for (let i = 0; i < STAR_COUNT; i++) s[i] = 0.2 + Math.random() * 1.5;
    return s;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const col = colAttr.array as Float32Array;
    for (let i = 0; i < STAR_COUNT; i += 4) {
      const brightness = 0.7 + 0.3 * Math.sin(t * twinkleSpeeds[i] + twinklePhases[i]);
      const i3 = i * 3;
      col[i3] = baseColors[i3] * brightness;
      col[i3+1] = baseColors[i3+1] * brightness;
      col[i3+2] = baseColors[i3+2] * brightness;
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
      <pointsMaterial vertexColors transparent opacity={1} size={0.35} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/* ── Music-reactive Thruster Camera ── */
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

  useFrame((_, dt) => {
    thrusterTime.current += dt;
    const t = thrusterTime.current;
    const clampDt = Math.min(dt, 0.05);
    const p = pos.current;
    const pp = physics.positions;
    const pr = physics.radii;
    const n = physics.count;

    // ── Audio reactivity ──
    const audio = audioRef.current;
    const amp = audio.amplitude;
    const bass = audio.bass;
    // Smooth the audio values for camera control
    smoothedAmplitude.current += (amp - smoothedAmplitude.current) * 0.08;
    smoothedBass.current += (bass - smoothedBass.current) * 0.1;
    const sa = smoothedAmplitude.current;
    const sb = smoothedBass.current;

    // Music modulates: speed range, thrust intensity, thruster frequency
    const musicSpeedMult = 0.4 + sa * 1.2;        // 0.4x – 1.6x
    const musicThrustMult = 0.5 + sb * 1.5;       // 0.5x – 2.0x
    const musicThrusterInterval = 3.0 - sa * 2.2;  // 0.8s – 3.0s

    // Beat triggers an extra thruster burst
    if (audio.beat) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation.current);
      thrusters.current.push({
        axis: forward.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 0)).normalize(),
        torqueAxis: new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).normalize(),
        force: 2.0 + sb * 3.0,
        torque: (Math.random() - 0.5) * 0.3,
        startTime: t,
        duration: 0.3 + Math.random() * 0.5,
      });
    }

    // ── Collision avoidance ──
    const AVOID_RADIUS = 8;
    const HARD_RADIUS = 2.5;
    const REPULSE_FORCE = 18;
    const avoidForce = new THREE.Vector3(0, 0, 0);
    const avoidTorque = new THREE.Vector3(0, 0, 0);
    const tmpVec = new THREE.Vector3();

    for (let oi = 0; oi < n; oi++) {
      const ox = oi * 3;
      tmpVec.set(p.x - pp[ox], p.y - pp[ox + 1], p.z - pp[ox + 2]);
      const dist = tmpVec.length();
      const surfaceDist = dist - pr[oi];
      if (dist > AVOID_RADIUS + pr[oi] + 5) continue;

      if (surfaceDist < AVOID_RADIUS) {
        const dir = tmpVec.normalize();
        if (surfaceDist < HARD_RADIUS) {
          const strength = REPULSE_FORCE * (1 + (HARD_RADIUS - surfaceDist) * 3);
          avoidForce.addScaledVector(dir, strength);
          const velToward = vel.current.dot(dir);
          if (velToward < 0) vel.current.addScaledVector(dir, -velToward * 0.8);
        } else {
          const t2 = (AVOID_RADIUS - surfaceDist) / (AVOID_RADIUS - HARD_RADIUS);
          avoidForce.addScaledVector(dir, REPULSE_FORCE * t2 * t2 * 0.4);
        }
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation.current);
        const cross = new THREE.Vector3().crossVectors(forward, dir);
        avoidTorque.addScaledVector(cross, surfaceDist < HARD_RADIUS ? 2.0 : 0.5);
      }
    }

    // ── Attraction: find dense rock cluster ahead & fly low over the field ──
    targetCooldown.current -= clampDt;
    if (targetCooldown.current <= 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation.current);
      let bestScore = -Infinity;
      let bestIdx = -1;

      for (let oi = 0; oi < n; oi++) {
        const ox = oi * 3;
        tmpVec.set(pp[ox] - p.x, pp[ox + 1] - p.y, pp[ox + 2] - p.z);
        const dist = tmpVec.length();
        if (dist < 6 || dist > 60) continue;
        const dot = tmpVec.normalize().dot(forward);
        if (dot < -0.3) continue;

        // Prefer closer rocks in dense areas
        let neighbors = 0;
        for (let nj = 0; nj < n; nj++) {
          if (nj === oi) continue;
          const njx = nj * 3;
          const ddx = pp[njx] - pp[ox], ddy = pp[njx + 1] - pp[ox + 1], ddz = pp[njx + 2] - pp[ox + 2];
          if (ddx * ddx + ddy * ddy + ddz * ddz < 200) neighbors++;
          if (neighbors > 8) break;
        }

        const score = dot * 2.5 + (1 - dist / 60) * 3.0 + neighbors * 0.6 + Math.random() * 0.2;
        if (score > bestScore) { bestScore = score; bestIdx = oi; }
      }
      currentTarget.current = bestIdx;
      targetCooldown.current = 1.5 + Math.random() * 2.0;
    }

    const attractForce = new THREE.Vector3(0, 0, 0);
    if (currentTarget.current >= 0) {
      const ox = currentTarget.current * 3;
      tmpVec.set(pp[ox] - p.x, pp[ox + 1] - p.y, pp[ox + 2] - p.z);
      const dist = tmpVec.length();
      if (dist > 5) {
        // Aim just barely above target – cruise low over the surface
        tmpVec.y += 1.5;
        attractForce.copy(tmpVec.normalize()).multiplyScalar(3.5 + sa * 2.0);
      }
    }

    // ── Keep altitude just above rock field surface ──
    let nearbyYSum = 0, nearbyYMax = -Infinity, nearbyCount = 0;
    for (let oi = 0; oi < n; oi++) {
      const ox = oi * 3;
      const ddx = pp[ox] - p.x, ddz = pp[ox + 2] - p.z;
      if (ddx * ddx + ddz * ddz < 400) { // within 20 units
        const rockTop = pp[ox + 1] + pr[oi];
        nearbyYSum += rockTop;
        if (rockTop > nearbyYMax) nearbyYMax = rockTop;
        nearbyCount++;
      }
    }
    if (nearbyCount > 0) {
      const avgTop = nearbyYSum / nearbyCount;
      // Cruise just 2-3 units above the rock tops, music slightly modulates
      const desiredAlt = avgTop + 2.0 + sa * 1.5;
      const altDiff = desiredAlt - p.y;
      // Pull toward desired altitude (both up and down)
      attractForce.y += altDiff * 1.5;
    } else {
      // No rocks nearby – pull down toward rock field level
      attractForce.y += (-6 - p.y) * 0.5;
    }

    // ── Thruster bursts (music-synced interval) ──
    if (t > nextThrusterAt.current) {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const ax = (Math.random() - 0.5) * 2;
        const ay = (Math.random() - 0.5) * 2;
        const az = -0.5 - Math.random() * 1.5;
        const axis = new THREE.Vector3(ax, ay, az).normalize();
        const tx = (Math.random() - 0.5) * 2;
        const ty = (Math.random() - 0.5) * 2;
        const tz = (Math.random() - 0.5) * 2;
        const torqueAxis = new THREE.Vector3(tx, ty, tz).normalize();
        thrusters.current.push({
          axis, torqueAxis,
          force: (0.8 + Math.random() * 2.0) * musicThrustMult,
          torque: (Math.random() - 0.5) * 0.25,
          startTime: t,
          duration: 0.5 + Math.random() * 3.0,
        });
      }
      nextThrusterAt.current = t + Math.max(0.8, musicThrusterInterval + Math.random() * 1.5);
    }

    const thrustAccel = new THREE.Vector3(0, 0, 0);
    const torqueAccel = new THREE.Vector3(0, 0, 0);
    thrusters.current = thrusters.current.filter(th => {
      const elapsed = t - th.startTime;
      if (elapsed > th.duration) return false;
      const env = elapsed < 0.15 ? elapsed / 0.15
        : elapsed > th.duration - 0.2 ? (th.duration - elapsed) / 0.2 : 1.0;
      const worldAxis = th.axis.clone().applyQuaternion(orientation.current);
      thrustAccel.addScaledVector(worldAxis, th.force * env);
      torqueAccel.addScaledVector(th.torqueAxis, th.torque * env);
      return true;
    });

    const DRAG = 0.15, ANG_DRAG = 0.4;
    vel.current.addScaledVector(thrustAccel, clampDt);
    vel.current.addScaledVector(avoidForce, clampDt);
    vel.current.addScaledVector(attractForce, clampDt);
    vel.current.multiplyScalar(1 - DRAG * clampDt);

    // Music-reactive speed limits
    const maxSpeed = 8 + sa * 8;   // 8-16 based on music
    const minSpeed = 1.0 + sa * 1.5; // 1-2.5
    const speed = vel.current.length();
    if (speed > maxSpeed) vel.current.multiplyScalar(maxSpeed / speed);
    if (speed < minSpeed) vel.current.multiplyScalar(minSpeed / Math.max(speed, 0.01));

    pos.current.addScaledVector(vel.current, clampDt * musicSpeedMult);

    angVel.current.addScaledVector(torqueAccel, clampDt);
    angVel.current.addScaledVector(avoidTorque, clampDt);
    angVel.current.multiplyScalar(1 - ANG_DRAG * clampDt);
    const angSpeed = angVel.current.length();
    if (angSpeed > 0.8) angVel.current.multiplyScalar(0.8 / angSpeed);

    if (angSpeed > 0.0001) {
      const halfAngle = angSpeed * clampDt * 0.5;
      const s = Math.sin(halfAngle) / angSpeed;
      const dq = new THREE.Quaternion(angVel.current.x * s, angVel.current.y * s, angVel.current.z * s, Math.cos(halfAngle));
      orientation.current.premultiply(dq);
      orientation.current.normalize();
    }

    if (speed > 0.5) {
      const velDir = vel.current.clone().normalize();
      const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), velDir);
      orientation.current.slerp(targetQ, 0.02);
    }

    camera.position.copy(pos.current);
    camera.quaternion.copy(orientation.current);
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
        <PhysicsDriver physics={physics} />
        <CockpitCamera physics={physics} audioRef={analysisRef} />
        <RealisticStarfield />
        <Rain physics={physics} />
        <RockField physics={physics} />
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
