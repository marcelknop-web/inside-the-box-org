import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
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

/* ── Rain particle system with physics ── */
const RAIN_COUNT = 1200;
const RAIN_AREA = { x: 120, y: 40, z: 80 };
const GROUND_Y = -7;
const GRAVITY = -12;
const TERMINAL_VELOCITY = -25;
const SPLASH_FADE = 0.3;

function Rain() {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const { positions, velocities, alphas, splashTimers } = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    const vel = new Float32Array(RAIN_COUNT); // y velocity
    const alpha = new Float32Array(RAIN_COUNT);
    const splash = new Float32Array(RAIN_COUNT);

    for (let i = 0; i < RAIN_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * RAIN_AREA.x;
      pos[i3 + 1] = Math.random() * RAIN_AREA.y - 5;
      pos[i3 + 2] = (Math.random() - 0.5) * RAIN_AREA.z;
      vel[i] = -8 - Math.random() * 6; // initial downward velocity
      alpha[i] = 0.15 + Math.random() * 0.4;
      splash[i] = 0;
    }
    return { positions: pos, velocities: vel, alphas: alpha, splashTimers: splash };
  }, []);

  const colorsArr = useMemo(() => {
    const c = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      c[i * 3] = 0; c[i * 3 + 1] = 1; c[i * 3 + 2] = 0.67; // #00ffaa
    }
    return c;
  }, []);

  const sizesArr = useMemo(() => {
    const s = new Float32Array(RAIN_COUNT);
    for (let i = 0; i < RAIN_COUNT; i++) s[i] = 0.06 + Math.random() * 0.08;
    return s;
  }, []);

  useFrame((_, dt) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    const camX = camera.position.x;
    const camZ = camera.position.z;

    for (let i = 0; i < RAIN_COUNT; i++) {
      const i3 = i * 3;

      if (splashTimers[i] > 0) {
        // Splash phase: particle expands outward briefly then resets
        splashTimers[i] -= dt;
        // Fade to white during splash
        const t = splashTimers[i] / SPLASH_FADE;
        col[i3] = 0 + (1 - t) * 0.5;
        col[i3 + 1] = 1;
        col[i3 + 2] = 0.67 + (1 - t) * 0.33;
        // Slight outward motion
        pos[i3] += (Math.random() - 0.5) * 0.3;
        pos[i3 + 2] += (Math.random() - 0.5) * 0.3;
        pos[i3 + 1] = GROUND_Y + 0.1;

        if (splashTimers[i] <= 0) {
          // Reset particle
          pos[i3] = camX + (Math.random() - 0.5) * RAIN_AREA.x;
          pos[i3 + 1] = camera.position.y + 10 + Math.random() * RAIN_AREA.y * 0.5;
          pos[i3 + 2] = camZ + (Math.random() - 0.5) * RAIN_AREA.z;
          velocities[i] = -8 - Math.random() * 6;
          col[i3] = 0; col[i3 + 1] = 1; col[i3 + 2] = 0.67;
        }
      } else {
        // Physics: gravity acceleration
        velocities[i] += GRAVITY * dt;
        if (velocities[i] < TERMINAL_VELOCITY) velocities[i] = TERMINAL_VELOCITY;
        pos[i3 + 1] += velocities[i] * dt;

        // Wind drift
        pos[i3] += Math.sin(pos[i3 + 1] * 0.5) * 0.02;

        // Ground collision
        if (pos[i3 + 1] <= GROUND_Y) {
          pos[i3 + 1] = GROUND_Y;
          splashTimers[i] = SPLASH_FADE * (0.5 + Math.random() * 0.5);
        }

        // Recycle if too far from camera
        const dx = pos[i3] - camX;
        const dz = pos[i3 + 2] - camZ;
        if (dx * dx + dz * dz > 3600) { // 60^2
          pos[i3] = camX + (Math.random() - 0.5) * RAIN_AREA.x;
          pos[i3 + 1] = camera.position.y + 10 + Math.random() * 20;
          pos[i3 + 2] = camZ + (Math.random() - 0.5) * RAIN_AREA.z;
          velocities[i] = -8 - Math.random() * 6;
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Follow camera loosely
    pointsRef.current.position.set(0, 0, 0);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorsArr, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Camera ── */
function CockpitCamera() {
  const { camera } = useThree();
  const t = useRef(0);
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-20, 2, 0), new THREE.Vector3(0, 3, -8),
      new THREE.Vector3(20, 1.5, -12), new THREE.Vector3(40, 4, -5),
      new THREE.Vector3(55, 2, 5), new THREE.Vector3(70, 3, 15),
      new THREE.Vector3(80, 1, 8), new THREE.Vector3(90, 4, -3),
      new THREE.Vector3(75, 2.5, -15), new THREE.Vector3(50, 1.5, -10),
      new THREE.Vector3(30, 3.5, 0), new THREE.Vector3(10, 2, 10),
      new THREE.Vector3(-10, 3, 5), new THREE.Vector3(-20, 2, 0),
    ], true, 'centripetal', 0.5);
  }, []);
  useFrame((_, dt) => {
    t.current += dt * 0.008;
    const p = t.current % 1;
    const pos = curve.getPointAt(p);
    pos.y = Math.max(pos.y, -4);
    camera.position.copy(pos);
    camera.lookAt(curve.getPointAt((p + 0.015) % 1));
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

/* ── 432Hz Ambient Synthesizer (Web Audio API) ── */
function use432HzAmbient() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscs: OscillatorNode[]; gains: GainNode[]; master: GainNode } | null>(null);

  const start = useCallback(() => {
    if (ctxRef.current) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 3);
    master.connect(ctx.destination);

    // Frequencies based on 432Hz tuning (A=432, harmonics & sub-harmonics)
    const freqs = [
      54,      // sub bass C
      108,     // bass C
      162,     // fifth G
      216,     // octave C
      324,     // fifth G
      432,     // A4 at 432Hz
      540,     // C overtone
      648,     // E overtone
    ];

    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i < 2 ? 'sine' : i < 5 ? 'sine' : 'sine';
      osc.frequency.value = freq;
      // Gentle detune for warmth
      osc.detune.value = (Math.random() - 0.5) * 4;

      const gain = ctx.createGain();
      // Lower frequencies louder, higher softer
      const vol = i < 2 ? 0.12 : i < 4 ? 0.08 : 0.04;
      gain.gain.value = vol;

      // Slow LFO for evolving texture
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + Math.random() * 0.1; // Very slow
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = vol * 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      osc.connect(gain);
      gain.connect(master);
      osc.start();
      oscs.push(osc);
      gains.push(gain);
    });

    // Binaural beat: 432Hz in one implicit channel, slight offset for theta waves
    const binOsc = ctx.createOscillator();
    binOsc.type = 'sine';
    binOsc.frequency.value = 432 + 6; // 6Hz theta difference
    const binGain = ctx.createGain();
    binGain.gain.value = 0.02;
    binOsc.connect(binGain);
    binGain.connect(master);
    binOsc.start();
    oscs.push(binOsc);
    gains.push(binGain);

    nodesRef.current = { oscs, gains, master };
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (!ctxRef.current || !nodesRef.current) return;
    const { master, oscs } = nodesRef.current;
    const ctx = ctxRef.current;
    // Fade out
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    setTimeout(() => {
      oscs.forEach(o => { try { o.stop(); } catch {} });
      ctx.close();
      ctxRef.current = null;
      nodesRef.current = null;
      setPlaying(false);
    }, 2200);
  }, []);

  useEffect(() => () => {
    if (ctxRef.current) {
      nodesRef.current?.oscs.forEach(o => { try { o.stop(); } catch {} });
      ctxRef.current.close();
    }
  }, []);

  return { playing, start, stop };
}

/* ── Main ── */
export default function EliteShipScene() {
  const surfaceRocks = useSurfaceRocks();
  const floatingRocks = useFloatingRocks();
  const ambient = use432HzAmbient();

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: BG }}>
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: BG }}
      >
        <CockpitCamera />
        <Stars radius={300} depth={150} count={5000} factor={2} saturation={0} fade speed={0.2} />
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
