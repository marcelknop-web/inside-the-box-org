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

function Rain({ linePosRef, aliveRef }: {
  linePosRef: React.MutableRefObject<Float32Array | null>;
  aliveRef: React.MutableRefObject<Uint8Array | null>;
}) {
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
      lp[i * 6 + 3] = x; lp[i * 6 + 4] = y - spd[i] * 0.06; lp[i * 6 + 5] = z;
      // Dot at bottom
      dp[i * 3] = x; dp[i * 3 + 1] = y; dp[i * 3 + 2] = z;
      ds[i] = 0;
      // Line colors (RGBA) – top bright, bottom fades
      lc[i * 8] = 0; lc[i * 8 + 1] = 1; lc[i * 8 + 2] = 0.67; lc[i * 8 + 3] = 0.4;
      lc[i * 8 + 4] = 0; lc[i * 8 + 5] = 0.7; lc[i * 8 + 6] = 0.5; lc[i * 8 + 7] = 0.05;
      // Dot color
      dc[i * 4] = 0.1; dc[i * 4 + 1] = 1; dc[i * 4 + 2] = 0.7; dc[i * 4 + 3] = 0;
    }
    linePosRef.current = lp;
    aliveRef.current = al;
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
      const streakLen = speeds[i] * 0.06 * birthFade;

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

/* ── Mandelbrot Background Skybox ── */
const mandelbrotVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.999, 1.0);
}
`;

const mandelbrotFragmentShader = `
precision highp float;
varying vec2 vUv;
uniform float uTime;

// Smooth coloring palette
vec3 palette(float t) {
  vec3 a = vec3(0.02, 0.01, 0.03);
  vec3 b = vec3(0.4, 0.6, 0.3);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.0, 0.15, 0.2);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  // Slowly drift through interesting Mandelbrot regions
  float speed = uTime * 0.012;
  
  // Cycle through spectacular coordinates
  float phase = mod(speed, 4.0);
  vec2 center;
  float zoom;
  
  if (phase < 1.0) {
    // Seahorse valley
    float t = phase;
    center = vec2(-0.745, 0.186);
    zoom = 0.004 * exp(-t * 2.5);
  } else if (phase < 2.0) {
    float t = phase - 1.0;
    // Elephant valley  
    center = vec2(0.282, 0.0073);
    zoom = 0.006 * exp(-t * 2.5);
  } else if (phase < 3.0) {
    float t = phase - 2.0;
    // Spiral arms
    center = vec2(-0.1011, 0.9563);
    zoom = 0.01 * exp(-t * 2.5);
  } else {
    float t = phase - 3.0;
    // Mini-brot
    center = vec2(-1.7497, 0.0);
    zoom = 0.02 * exp(-t * 2.5);
  }
  
  vec2 c = center + (vUv - 0.5) * vec2(zoom * 1.777, zoom);
  vec2 z = vec2(0.0);
  
  float iter = 0.0;
  const float MAX_ITER = 256.0;
  
  for (float i = 0.0; i < MAX_ITER; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 256.0) { iter = i; break; }
    iter = i;
  }
  
  if (iter >= MAX_ITER - 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    // Smooth iteration count
    float sl = iter - log2(log2(dot(z, z))) + 4.0;
    float t = sl / 60.0 + uTime * 0.01;
    vec3 col = palette(t);
    // Keep it dark/subtle as background
    col *= 0.35;
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

function MandelbrotBackground() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh renderOrder={-100} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={mandelbrotVertexShader}
        fragmentShader={mandelbrotFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
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

/* ── Hypnotic Camera with raindrop follow – all movements damped ── */
function CockpitCamera({ rainPositions, rainAlive }: {
  rainPositions: React.MutableRefObject<Float32Array | null>;
  rainAlive: React.MutableRefObject<Uint8Array | null>;
}) {
  const { camera } = useThree();
  const t = useRef(0);
  // Smoothed camera state (position + lookAt lerped every frame)
  const smoothPos = useRef(new THREE.Vector3(0, 2, 0));
  const smoothLook = useRef(new THREE.Vector3(0, 1.5, 1));
  const smoothRoll = useRef(0);
  const LERP_SPEED = 1.2; // lower = smoother/slower transitions

  const followRef = useRef<{
    active: boolean;
    dropIdx: number;
    duration: number;
    elapsed: number;
    offsetX: number;
    offsetZ: number;
  }>({ active: false, dropIdx: -1, duration: 0, elapsed: 0, offsetX: 0, offsetZ: 0 });
  const cooldownRef = useRef(0);

  useFrame((_, dt) => {
    t.current += dt * 0.04;
    const a = t.current;
    const scale = 35;
    const denom = 1 + Math.sin(a) * Math.sin(a);

    // Base lemniscate path with more vertical drift for horizon-losing effect
    const nx = scale * Math.cos(a) / denom;
    const nz = scale * Math.sin(a) * Math.cos(a) / denom;
    // More pronounced Y movement – gentle banking that loses the horizon
    const ny = 2
      + Math.sin(a * 0.37) * 2.5
      + Math.sin(a * 0.13) * 1.5
      + Math.sin(a * 0.71) * 0.8;

    // Look-at: further ahead on curve for smoother anticipation
    const la = a + 0.18;
    const ld = 1 + Math.sin(la) * Math.sin(la);
    const nlx = scale * Math.cos(la) / ld;
    const nlz = scale * Math.sin(la) * Math.cos(la) / ld;
    const nly = 1.5 + Math.sin(la * 0.37) * 1.8 + Math.sin(la * 0.71) * 0.6;

    // Gentle roll that drifts the horizon – subtle, never violent
    const targetRoll = Math.sin(a * 0.17) * 0.06 + Math.sin(a * 0.31) * 0.03;

    // Target position & look (may be overridden by follow)
    let tx = nx, ty = Math.max(ny, -3), tz = nz;
    let tlx = nlx, tly = nly, tlz = nlz;
    let tRoll = targetRoll;

    const follow = followRef.current;
    cooldownRef.current -= dt;

    // Try to start follow
    if (!follow.active && cooldownRef.current <= 0 && rainPositions.current && rainAlive.current) {
      if (Math.random() < 0.002) {
        const rp = rainPositions.current;
        const ra = rainAlive.current;
        const candidates: number[] = [];
        for (let i = 0; i < ra.length; i++) {
          if (ra[i] === 0) continue;
          const dx = rp[i * 6] - nx;
          const dz = rp[i * 6 + 2] - nz;
          if (dx * dx + dz * dz < 600) candidates.push(i);
        }
        if (candidates.length > 0) {
          const idx = candidates[(Math.random() * candidates.length) | 0];
          follow.active = true;
          follow.dropIdx = idx;
          follow.duration = 3 + Math.random() * 4; // 3-7s
          follow.elapsed = 0;
          follow.offsetX = (Math.random() - 0.5) * 2.5;
          follow.offsetZ = (Math.random() - 0.5) * 2.5;
        }
      }
    }

    if (follow.active && rainPositions.current && rainAlive.current) {
      follow.elapsed += dt;
      const rp = rainPositions.current;
      const ra = rainAlive.current;
      const idx = follow.dropIdx;

      if (ra[idx] === 0 || follow.elapsed >= follow.duration) {
        follow.active = false;
        cooldownRef.current = 10 + Math.random() * 15;
      } else {
        // Very slow ease: 2s in, 2s out
        const blendIn = Math.min(follow.elapsed / 2.0, 1);
        const blendOut = Math.min((follow.duration - follow.elapsed) / 2.0, 1);
        const blend = Math.min(blendIn, blendOut);
        const smooth = blend * blend * (3 - 2 * blend);

        const dx = rp[idx * 6];
        const dy = rp[idx * 6 + 1];
        const dz = rp[idx * 6 + 2];

        const fx = dx + follow.offsetX;
        const fy = dy + 2;
        const fz = dz + follow.offsetZ + 4;

        tx = nx + (fx - nx) * smooth;
        ty = Math.max(ny + (fy - ny) * smooth, -3);
        tz = nz + (fz - nz) * smooth;

        tlx = nlx + (dx - nlx) * smooth;
        tly = nly + (dy - 1.5 - nly) * smooth;
        tlz = nlz + (dz - nlz) * smooth;

        // Slight extra roll during follow
        tRoll = targetRoll * (1 - smooth * 0.5) + smooth * Math.sin(a * 0.5) * 0.04;
      }
    }

    // Lerp everything – no sudden jumps ever
    const lerpFactor = 1 - Math.exp(-LERP_SPEED * dt);
    smoothPos.current.x += (tx - smoothPos.current.x) * lerpFactor;
    smoothPos.current.y += (ty - smoothPos.current.y) * lerpFactor;
    smoothPos.current.z += (tz - smoothPos.current.z) * lerpFactor;
    smoothLook.current.x += (tlx - smoothLook.current.x) * lerpFactor;
    smoothLook.current.y += (tly - smoothLook.current.y) * lerpFactor;
    smoothLook.current.z += (tlz - smoothLook.current.z) * lerpFactor;
    smoothRoll.current += (tRoll - smoothRoll.current) * lerpFactor;

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
    camera.rotation.z = smoothRoll.current;
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
  const ambient = use432HzAmbient();
  const rainPosRef = useRef<Float32Array | null>(null);
  const rainAliveRef = useRef<Uint8Array | null>(null);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <MandelbrotBackground />
        <CockpitCamera rainPositions={rainPosRef} rainAlive={rainAliveRef} />
        <RealisticStarfield />
        <Rain linePosRef={rainPosRef} aliveRef={rainAliveRef} />
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
