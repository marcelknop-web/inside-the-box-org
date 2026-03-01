import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

const LINE_COLOR = '#00ffaa';
const BG = '#000000';

/* ── Random convex polyhedron ── */
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

/* ── Single polyhedron rock ── */
function Rock({ seed, radius, position: pos, rotSpeed }: {
  seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const { geo, edges } = useMemo(() => buildPolyhedron(seed, radius), [seed, radius]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += rotSpeed[0] * dt;
    ref.current.rotation.y += rotSpeed[1] * dt;
    ref.current.rotation.z += rotSpeed[2] * dt;
  });
  return (
    <group ref={ref} position={pos}>
      <mesh geometry={geo} renderOrder={0}>
        <meshBasicMaterial color="#000000" side={THREE.FrontSide} depthWrite polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments renderOrder={1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edges, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.8} depthTest />
      </lineSegments>
    </group>
  );
}

/* ── Surface rocks ── */
function useSurfaceRocks() {
  return useMemo(() => {
    const rng = (i: number, off: number) => {
      let x = Math.sin(i * 127.1 + off * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const rocks: { seed: number; radius: number; position: [number, number, number]; rotSpeed: [number, number, number] }[] = [];
    const gridX = 20, gridZ = 12, spacing = 6;
    let idx = 0;
    for (let gx = 0; gx < gridX; gx++) {
      for (let gz = 0; gz < gridZ; gz++) {
        const r = 1.5 + rng(idx, 0) * 3;
        rocks.push({
          seed: idx * 13 + 7, radius: r,
          position: [
            gx * spacing + (rng(idx, 1) - 0.5) * spacing * 0.7 - (gridX * spacing) / 2 + 40,
            -8 + (rng(idx, 3) - 0.5) * 1.5 - r * 0.15,
            gz * spacing + (rng(idx, 2) - 0.5) * spacing * 0.7 - (gridZ * spacing) / 2,
          ],
          rotSpeed: [(rng(idx, 7) - 0.5) * 0.02, (rng(idx, 8) - 0.5) * 0.03, (rng(idx, 9) - 0.5) * 0.01],
        });
        idx++;
      }
    }
    return rocks;
  }, []);
}

function useFloatingRocks() {
  return useMemo(() => {
    const rng = (i: number, off: number) => {
      let x = Math.sin(i * 73.1 + off * 419.3) * 31758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 12 }, (_, i) => ({
      seed: i * 31 + 100, radius: 0.8 + rng(i, 0) * 2.5,
      position: [rng(i, 1) * 100 - 20, -3 + rng(i, 2) * 8, rng(i, 3) * 50 - 25] as [number, number, number],
      rotSpeed: [(rng(i, 7) - 0.5) * 0.15, (rng(i, 8) - 0.5) * 0.2, (rng(i, 9) - 0.5) * 0.1] as [number, number, number],
    }));
  }, []);
}

/* ── Infinite Rain – streaks + droplets, depth blur ── */
const RAIN_COUNT = 800;
const RAIN_SPREAD = { x: 120, y: 80, z: 80 };
const FALL_SPEED_MIN = 14;
const FALL_SPEED_MAX = 26;
const NEAR_BLUR_DIST = 6;
const FAR_BLUR_DIST = 50;

function Rain() {
  const linesRef = useRef<THREE.LineSegments>(null);
  const dotsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const timeRef = useRef(0);

  // Each streak = 2 vertices (top + bottom of line segment)
  const { linePos, dotPos, speeds, dotSizes, alive, lineCol, dotCol } = useMemo(() => {
    const lp = new Float32Array(RAIN_COUNT * 6); // 2 verts * 3 coords
    const dp = new Float32Array(RAIN_COUNT * 3);
    const spd = new Float32Array(RAIN_COUNT);
    const ds = new Float32Array(RAIN_COUNT);
    const al = new Uint8Array(RAIN_COUNT).fill(1);
    const lc = new Float32Array(RAIN_COUNT * 8); // 2 verts * RGBA
    const dc = new Float32Array(RAIN_COUNT * 4);
    for (let i = 0; i < RAIN_COUNT; i++) {
      const x = (Math.random() - 0.5) * RAIN_SPREAD.x;
      const y = (Math.random() - 0.5) * RAIN_SPREAD.y;
      const z = (Math.random() - 0.5) * RAIN_SPREAD.z;
      spd[i] = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);
      // Line: top vertex
      lp[i * 6] = x; lp[i * 6 + 1] = y; lp[i * 6 + 2] = z;
      // Line: bottom vertex (streak length based on speed)
      lp[i * 6 + 3] = x; lp[i * 6 + 4] = y - spd[i] * 0.14; lp[i * 6 + 5] = z;
      // Dot at bottom
      dp[i * 3] = x; dp[i * 3 + 1] = y; dp[i * 3 + 2] = z;
      ds[i] = 0;
      // Line colors (RGBA) – top bright, bottom fades
      lc[i * 8] = 0; lc[i * 8 + 1] = 1; lc[i * 8 + 2] = 0.67; lc[i * 8 + 3] = 0.4;
      lc[i * 8 + 4] = 0; lc[i * 8 + 5] = 0.7; lc[i * 8 + 6] = 0.5; lc[i * 8 + 7] = 0.05;
      // Dot color
      dc[i * 4] = 0.1; dc[i * 4 + 1] = 1; dc[i * 4 + 2] = 0.7; dc[i * 4 + 3] = 0;
    }
    return { linePos: lp, dotPos: dp, speeds: spd, dotSizes: ds, alive: al, lineCol: lc, dotCol: dc };
  }, []);

  // Track per-drop age for droplet effect at birth/death
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
    const halfY = RAIN_SPREAD.y * 0.5;

    for (let i = 0; i < RAIN_COUNT; i++) {
      const i6 = i * 6;
      const i3 = i * 3;
      const i8 = i * 8;
      const i4 = i * 4;

      if (alive[i] === 0) {
        if (spawning && Math.random() < intensity * 0.06) {
          alive[i] = 1;
          ages[i] = 0;
          const x = cam.x + (Math.random() - 0.5) * RAIN_SPREAD.x;
          const y = cam.y + halfY + Math.random() * 10;
          const z = cam.z + (Math.random() - 0.5) * RAIN_SPREAD.z;
          speeds[i] = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);
          lp[i6] = x; lp[i6 + 1] = y; lp[i6 + 2] = z;
          lp[i6 + 3] = x; lp[i6 + 4] = y; lp[i6 + 5] = z;
          dp[i3] = x; dp[i3 + 1] = y; dp[i3 + 2] = z;
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

      // Move top vertex
      lp[i6] += drift;
      lp[i6 + 1] -= fall;
      lp[i6 + 2] += drift * 0.3;

      // Streak length: short at birth (droplet), long in mid-flight, short at death
      const birthFade = Math.min(ages[i] * 3, 1); // 0→1 over 0.33s
      const streakLen = speeds[i] * 0.14 * birthFade;

      // Bottom vertex = top - streak length
      lp[i6 + 3] = lp[i6];
      lp[i6 + 4] = lp[i6 + 1] - streakLen;
      lp[i6 + 5] = lp[i6 + 2];

      // Dot at tip (bottom of streak)
      dp[i3] = lp[i6]; dp[i3 + 1] = lp[i6 + 1]; dp[i3 + 2] = lp[i6 + 2];

      // Depth
      const dx = lp[i6] - cam.x;
      const dy = lp[i6 + 1] - cam.y;
      const dz = lp[i6 + 2] - cam.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Droplet dot visible at birth and death (when streak is short)
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

      // Die naturally
      if (lp[i6 + 1] < cam.y - halfY - 10) {
        alive[i] = 0;
        continue;
      }

      // Horizontal wrap
      if (Math.abs(dx) > RAIN_SPREAD.x * 0.5) lp[i6] = cam.x + (Math.random() - 0.5) * RAIN_SPREAD.x;
      if (Math.abs(dz) > RAIN_SPREAD.z * 0.5) lp[i6 + 2] = cam.z + (Math.random() - 0.5) * RAIN_SPREAD.z;
      lp[i6 + 3] = lp[i6]; lp[i6 + 5] = lp[i6 + 2];
    }
    lAttr.needsUpdate = true;
    lcAttr.needsUpdate = true;
    dAttr.needsUpdate = true;
    dcAttr.needsUpdate = true;
    dsAttr.needsUpdate = true;
  });

  return (
    <>
      {/* Streak lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineCol, 4]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {/* Droplet dots at birth/close range */}
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
      // Realistic magnitude distribution: most stars dim, very few bright
      const mag = Math.pow(Math.random(), 4); // heavily skewed to dim
      const temp = Math.random();
      const brightness = 0.15 + mag * 0.85;
      if (temp < 0.5) { col[i3] = 0.9 * brightness; col[i3+1] = 0.92 * brightness; col[i3+2] = 1.0 * brightness; }
      else if (temp < 0.75) { col[i3] = 1.0 * brightness; col[i3+1] = 0.96 * brightness; col[i3+2] = 0.88 * brightness; }
      else if (temp < 0.9) { col[i3] = 0.65 * brightness; col[i3+1] = 0.8 * brightness; col[i3+2] = 1.0 * brightness; }
      else if (temp < 0.97) { col[i3] = 1.0 * brightness; col[i3+1] = 0.85 * brightness; col[i3+2] = 0.5 * brightness; }
      else { col[i3] = 1.0 * brightness; col[i3+1] = 0.55 * brightness; col[i3+2] = 0.3 * brightness; } // rare red giants
      // Size: tiny for most, a few prominent
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
    // Only twinkle brighter stars (every 4th) for perf, rest stay static
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
      <pointsMaterial
        vertexColors
        transparent
        opacity={1}
        size={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Physics-based Thruster Camera with collision avoidance ── */
function CockpitCamera({ obstacles }: { obstacles: { position: [number, number, number]; radius: number }[] }) {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(0, 2, 0));
  const vel = useRef(new THREE.Vector3(0, 0, -3));
  const orientation = useRef(new THREE.Quaternion());
  const angVel = useRef(new THREE.Vector3(0, 0, 0));
  const thrusterTime = useRef(0);
  const thrusters = useRef<{ axis: THREE.Vector3; torqueAxis: THREE.Vector3; force: number; torque: number; startTime: number; duration: number }[]>([]);
  const nextThrusterAt = useRef(0);

  // Precompute obstacle positions as Vector3 once
  const obstaclePts = useMemo(() =>
    obstacles.map(o => ({ pos: new THREE.Vector3(...o.position), r: o.radius })),
    [obstacles]
  );

  // Find nearest interesting rock to steer toward (but not into)
  const currentTarget = useRef<THREE.Vector3 | null>(null);
  const targetCooldown = useRef(0);

  useFrame((_, dt) => {
    thrusterTime.current += dt;
    const t = thrusterTime.current;
    const clampDt = Math.min(dt, 0.05);
    const p = pos.current;

    // ── Collision avoidance: repulsion force field ──
    const AVOID_RADIUS = 8;    // start avoiding at this distance from surface
    const HARD_RADIUS = 2.5;   // hard repulsion shell
    const REPULSE_FORCE = 18;
    const avoidForce = new THREE.Vector3(0, 0, 0);
    const avoidTorque = new THREE.Vector3(0, 0, 0);
    const tmpVec = new THREE.Vector3();

    for (const obs of obstaclePts) {
      tmpVec.subVectors(p, obs.pos);
      const dist = tmpVec.length();
      const surfaceDist = dist - obs.r;

      if (surfaceDist < AVOID_RADIUS) {
        const dir = tmpVec.normalize();
        if (surfaceDist < HARD_RADIUS) {
          // Hard repulsion – exponential push away
          const strength = REPULSE_FORCE * (1 + (HARD_RADIUS - surfaceDist) * 3);
          avoidForce.addScaledVector(dir, strength);
          // Also deflect velocity away from obstacle
          const velToward = vel.current.dot(dir);
          if (velToward < 0) {
            vel.current.addScaledVector(dir, -velToward * 0.8);
          }
        } else {
          // Soft deflection – inverse square
          const t2 = (AVOID_RADIUS - surfaceDist) / (AVOID_RADIUS - HARD_RADIUS);
          avoidForce.addScaledVector(dir, REPULSE_FORCE * t2 * t2 * 0.4);
        }
        // Torque to turn away
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation.current);
        const cross = new THREE.Vector3().crossVectors(forward, dir);
        avoidTorque.addScaledVector(cross, surfaceDist < HARD_RADIUS ? 2.0 : 0.5);
      }
    }

    // ── Attraction: periodically pick a nearby rock to fly close to ──
    targetCooldown.current -= clampDt;
    if (targetCooldown.current <= 0 || !currentTarget.current) {
      // Find rocks that are ahead and within range 15-60
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(orientation.current);
      let bestScore = -Infinity;
      let bestPos: THREE.Vector3 | null = null;
      for (const obs of obstaclePts) {
        tmpVec.subVectors(obs.pos, p);
        const dist = tmpVec.length();
        if (dist < 10 || dist > 70) continue;
        const dot = tmpVec.normalize().dot(forward);
        // Prefer rocks roughly ahead and at medium distance
        const score = dot * 2 + (1 - dist / 70) + Math.random() * 0.5;
        if (score > bestScore) {
          bestScore = score;
          bestPos = obs.pos;
        }
      }
      currentTarget.current = bestPos;
      targetCooldown.current = 3 + Math.random() * 4;
    }

    // Gentle attraction toward target (fly-by, not fly-into)
    const attractForce = new THREE.Vector3(0, 0, 0);
    if (currentTarget.current) {
      tmpVec.subVectors(currentTarget.current, p);
      const dist = tmpVec.length();
      if (dist > 6) {
        attractForce.copy(tmpVec.normalize()).multiplyScalar(1.5);
      }
    }

    // ── Schedule thruster bursts ──
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
          force: 0.8 + Math.random() * 2.0,
          torque: (Math.random() - 0.5) * 0.25,
          startTime: t,
          duration: 0.5 + Math.random() * 3.0,
        });
      }
      nextThrusterAt.current = t + 1.5 + Math.random() * 4.0;
    }

    // Accumulate thruster forces
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

    // Sum all forces
    const DRAG = 0.15;
    const ANG_DRAG = 0.4;

    vel.current.addScaledVector(thrustAccel, clampDt);
    vel.current.addScaledVector(avoidForce, clampDt);
    vel.current.addScaledVector(attractForce, clampDt);
    vel.current.multiplyScalar(1 - DRAG * clampDt);

    const speed = vel.current.length();
    if (speed > 12) vel.current.multiplyScalar(12 / speed);
    if (speed < 1.5) vel.current.multiplyScalar(1.5 / Math.max(speed, 0.01)); // keep minimum speed

    pos.current.addScaledVector(vel.current, clampDt);

    // Angular
    angVel.current.addScaledVector(torqueAccel, clampDt);
    angVel.current.addScaledVector(avoidTorque, clampDt);
    angVel.current.multiplyScalar(1 - ANG_DRAG * clampDt);
    const angSpeed = angVel.current.length();
    if (angSpeed > 0.8) angVel.current.multiplyScalar(0.8 / angSpeed);

    if (angSpeed > 0.0001) {
      const halfAngle = angSpeed * clampDt * 0.5;
      const s = Math.sin(halfAngle) / angSpeed;
      const dq = new THREE.Quaternion(
        angVel.current.x * s, angVel.current.y * s, angVel.current.z * s,
        Math.cos(halfAngle)
      );
      orientation.current.premultiply(dq);
      orientation.current.normalize();
    }

    // Gently align orientation to velocity direction (ship faces where it flies)
    if (speed > 0.5) {
      const velDir = vel.current.clone().normalize();
      const targetQ = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, -1), velDir
      );
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

/* ── Ambient Music Player ── */
function use432HzAmbient() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const start = useCallback(() => {
    if (audioRef.current) return;
    const audio = new Audio('/audio/ambient-heartbeat.mp3');
    audio.loop = true;
    audio.volume = 0.7;
    audioRef.current = audio;
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = '';
    audioRef.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, []);

  return { playing, start, stop };
}



/* ── Main ── */
export default function EliteShipScene() {
  const surfaceRocks = useSurfaceRocks();
  const floatingRocks = useFloatingRocks();
  const allObstacles = useMemo(() => [...surfaceRocks, ...floatingRocks], [surfaceRocks, floatingRocks]);
  const ambient = use432HzAmbient();

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <CockpitCamera obstacles={allObstacles} />
        <RealisticStarfield />
        <Rain />
        {surfaceRocks.map((r, i) => <Rock key={`s${i}`} {...r} />)}
        {floatingRocks.map((r, i) => <Rock key={`f${i}`} {...r} />)}
      </Canvas>
      
      <CockpitHUD />

      <button
        onClick={ambient.playing ? ambient.stop : ambient.start}
        className="absolute bottom-6 right-6 z-30 px-4 py-2 rounded border text-[11px] tracking-[0.2em] uppercase font-mono transition-opacity hover:opacity-100"
        style={{
          color: LINE_COLOR,
          borderColor: LINE_COLOR + '40',
          background: ambient.playing ? LINE_COLOR + '15' : 'transparent',
          opacity: 0.6,
        }}
      >
        {ambient.playing ? '■ STOP 432Hz' : '♫ 432Hz AMBIENT'}
      </button>
    </div>
  );
}
