import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  startAmbient, stopAmbient, setAudioEnabled, setSpeed, crash, ding, uiBeep,
} from '@/game/tunnelAudio';
import tunnelMusic from '@/assets/tunnel-music.mp3';

/* ─────────────────────────  Palette  ───────────────────────── */
const CYAN = '#4dd0ff';
const GOLD = '#f5b800';
const RED = '#ff3b5c';

/* ─────────────────────────  Types  ───────────────────────── */
type Phase = 'briefing' | 'playing' | 'dead';

interface Hud {
  shield: number;   // 0..1
  distance: number; // meters
  speed: number;    // 0..1
  best: number;     // best distance
}

/* ─────────────────────────  Tunnel curve  ───────────────────────── */
const SEGMENTS = 1600;
const TUBE_R = 7;                 // world radius of the tube
const SAFE = TUBE_R * 0.74;       // player boundary (crash beyond this)
const DIR = -1;                   // travel direction along the curve

const OBST_COUNT = 46;
const ORB_R = 1.25;
const SHIP_R = 0.7;
const HIT_WINDOW = 0.0032;        // u proximity for collision

function makeCurve(): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const N = 18;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rad = 70 + Math.sin(i * 1.7) * 26 + Math.cos(i * 0.9) * 14;
    const y = Math.sin(i * 1.3) * 42 + Math.cos(i * 2.1) * 22;
    const twist = Math.sin(i * 0.6) * 18;
    pts.push(new THREE.Vector3(
      Math.cos(a) * rad + twist,
      y,
      Math.sin(a) * rad - twist * 0.5,
    ));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
}

/* ─────────────────────────  Tunnel mesh (neon grid shader)  ───────────────────────── */
function Tunnel({ curve, matRef }: { curve: THREE.CatmullRomCurve3; matRef: React.MutableRefObject<THREE.ShaderMaterial | null> }) {
  const geo = useMemo(
    () => new THREE.TubeGeometry(curve, SEGMENTS, TUBE_R, 24, true),
    [curve],
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: false,
      uniforms: {
        uTime: { value: 0 },
        uColA: { value: new THREE.Color('#0a2a3a') },
        uColB: { value: new THREE.Color('#3a1060') },
        uGlow: { value: new THREE.Color('#4dd0ff') },
        uDanger: { value: 0 },
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColA;
        uniform vec3 uColB;
        uniform vec3 uGlow;
        uniform float uDanger;
        void main() {
          float ringPhase = vUv.x * 260.0 - uTime * 6.0;
          float ring = abs(sin(ringPhase * 3.14159));
          float glowRing = smoothstep(0.86, 1.0, ring);
          float rib = abs(sin(vUv.y * 3.14159 * 24.0));
          float glowRib = smoothstep(0.9, 1.0, rib);
          float g = max(glowRing, glowRib * 0.55);
          float mixv = 0.5 + 0.5 * sin(vUv.x * 8.0 - uTime * 0.4);
          vec3 base = mix(uColA, uColB, mixv);
          vec3 glow = mix(uGlow, vec3(1.0, 0.24, 0.36), uDanger);
          vec3 col = base * 0.5 + glow * g * (1.3 + uDanger * 0.8);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  useEffect(() => {
    matRef.current = material;
    return () => { material.dispose(); geo.dispose(); };
  }, [material, geo, matRef]);

  return <mesh geometry={geo} material={material} frustumCulled={false} />;
}

/* ─────────────────────────  Detailed player ship  ───────────────────────── */
/** Nose points toward -Z (travel direction after lookAt). */
function buildShip(): THREE.Group {
  const g = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: '#0f2233', metalness: 0.85, roughness: 0.3,
    emissive: new THREE.Color('#1a6a8a'), emissiveIntensity: 0.85,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: CYAN, metalness: 0.6, roughness: 0.25,
    emissive: new THREE.Color(CYAN), emissiveIntensity: 0.9,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: GOLD, metalness: 0.8, roughness: 0.3,
    emissive: new THREE.Color(GOLD), emissiveIntensity: 0.6,
  });

  // Fuselage — elongated nose cone pointing -Z
  const fuse = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.5, 12), hullMat);
  fuse.rotation.x = -Math.PI / 2;   // tip toward -Z
  fuse.position.z = -0.1;
  g.add(fuse);

  // Cockpit canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), trimMat);
  canopy.rotation.x = Math.PI / 2;
  canopy.position.set(0, 0.12, -0.15);
  canopy.scale.set(1, 1.4, 0.7);
  g.add(canopy);

  // Main swept wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(1.15, 0.55);
  wingShape.lineTo(1.15, 0.75);
  wingShape.lineTo(0, 0.35);
  wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: false });
  const wingL = new THREE.Mesh(wingGeo, hullMat);
  wingL.position.set(0.05, -0.02, 0.35);
  g.add(wingL);
  const wingR = wingL.clone();
  wingR.scale.x = -1;
  wingR.position.x = -0.05;
  g.add(wingR);

  // Wing edge glow strips
  const stripGeo = new THREE.BoxGeometry(1.15, 0.04, 0.06);
  const stripL = new THREE.Mesh(stripGeo, trimMat);
  stripL.position.set(0.62, 0.0, 0.62);
  stripL.rotation.y = -0.45;
  g.add(stripL);
  const stripR = stripL.clone();
  stripR.position.x = -0.62;
  stripR.rotation.y = 0.45;
  g.add(stripR);

  // Tail fin
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 4), goldMat);
  fin.position.set(0, 0.28, 0.55);
  fin.rotation.x = -0.2;
  g.add(fin);

  // Twin engines (index positions used for flicker)
  const engGeo = new THREE.CylinderGeometry(0.13, 0.16, 0.4, 12);
  const engL = new THREE.Mesh(engGeo, hullMat);
  engL.rotation.x = Math.PI / 2;
  engL.position.set(0.24, -0.05, 0.6);
  g.add(engL);
  const engR = engL.clone();
  engR.position.x = -0.24;
  g.add(engR);

  // Engine glow orbs (children indices tracked for flicker)
  const glowMat = new THREE.MeshBasicMaterial({ color: '#ff8a3d', transparent: true, opacity: 0.95 });
  const gl1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), glowMat.clone());
  gl1.position.set(0.24, -0.05, 0.82);
  g.add(gl1);
  const gl2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), glowMat.clone());
  gl2.position.set(-0.24, -0.05, 0.82);
  g.add(gl2);

  g.userData.glows = [gl1, gl2];
  g.scale.setScalar(0.85);
  return g;
}

/* ─────────────────────────  Obstacle orb  ───────────────────────── */
function buildOrb(): THREE.Group {
  const grp = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(ORB_R, 0),
    new THREE.MeshBasicMaterial({ color: RED, wireframe: true, transparent: true, opacity: 0.9 }),
  );
  grp.add(core);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(ORB_R * 0.7, 12, 12),
    new THREE.MeshBasicMaterial({ color: '#ff6b7f', transparent: true, opacity: 0.28 }),
  );
  grp.add(glow);
  grp.visible = false;
  return grp;
}

interface Obst {
  ou: number;    // position along curve
  ang: number;   // base angle in cross-section
  rad: number;   // radial offset magnitude
  amp: number;   // drift amplitude
  phase: number; // drift phase
  grp: THREE.Group;
  ox: number;    // current cross-section offset
  oy: number;
}

/* ─────────────────────────  Game runner  ───────────────────────── */
interface Ctrl { x: number; y: number; }

function GameRunner({
  curve, phase, matRef, ctrlRef, onHud, onDead,
}: {
  curve: THREE.CatmullRomCurve3;
  phase: Phase;
  matRef: React.MutableRefObject<THREE.ShaderMaterial | null>;
  ctrlRef: React.MutableRefObject<Ctrl>;
  onHud: (h: Partial<Hud>) => void;
  onDead: (dist: number) => void;
}) {
  const { camera, scene } = useThree();
  const frames = useMemo(() => curve.computeFrenetFrames(SEGMENTS, true), [curve]);
  const length = useMemo(() => curve.getLength(), [curve]);
  const ship = useMemo(buildShip, []);

  const obstacles = useMemo<Obst[]>(() => {
    const arr: Obst[] = [];
    for (let i = 0; i < OBST_COUNT; i++) {
      const rnd = (n: number) => {
        const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
        return x - Math.floor(x);
      };
      arr.push({
        ou: (i + 0.5) / OBST_COUNT,
        ang: rnd(1) * Math.PI * 2,
        rad: SAFE * (0.35 + rnd(2) * 0.4),
        amp: SAFE * (0.1 + rnd(3) * 0.25),
        phase: rnd(4) * Math.PI * 2,
        grp: buildOrb(),
        ox: 0, oy: 0,
      });
    }
    return arr;
  }, []);

  const st = useRef({
    u: 0, speed: 0.055,
    off: new THREE.Vector2(0, 0),
    offVel: new THREE.Vector2(0, 0),
    shield: 1, dist: 0, dead: false, danger: 0, invuln: 0, hudAcc: 0,
    time: 0, hitCd: 0,
  });

  const tmp = useRef({
    pos: new THREE.Vector3(), posShip: new THREE.Vector3(), look: new THREE.Vector3(),
    n: new THREE.Vector3(), b: new THREE.Vector3(),
    t0: new THREE.Vector3(), t1: new THREE.Vector3(), v: new THREE.Vector3(),
  }).current;

  useEffect(() => {
    if (phase === 'playing') {
      const s = st.current;
      s.u = 0; s.speed = 0.055; s.off.set(0, 0); s.offVel.set(0, 0);
      s.shield = 1; s.dist = 0; s.dead = false; s.danger = 0; s.invuln = 1.4;
      s.time = 0; s.hitCd = 0;
      obstacles.forEach((o) => { o.grp.visible = false; });
      onHud({ shield: 1, distance: 0, speed: 0 });
    }
  }, [phase, onHud, obstacles]);

  const sampleFrame = useCallback((u: number) => {
    const i = Math.min(SEGMENTS - 1, Math.max(0, Math.floor(u * SEGMENTS)));
    tmp.n.copy(frames.normals[i]);
    tmp.b.copy(frames.binormals[i]);
    tmp.t0.copy(frames.tangents[i]);
    tmp.t1.copy(frames.tangents[Math.min(SEGMENTS - 1, i + 4)]);
    return i;
  }, [frames, tmp]);

  const placeAt = useCallback((u: number, offX: number, offY: number, target: THREE.Vector3) => {
    const uu = ((u % 1) + 1) % 1;
    curve.getPointAt(uu, target);
    sampleFrame(uu);
    target.addScaledVector(tmp.n, offX);
    target.addScaledVector(tmp.b, offY);
  }, [curve, sampleFrame, tmp]);

  useFrame((_, rawDt) => {
    const s = st.current;
    if (phase !== 'playing' || s.dead) {
      if (matRef.current) matRef.current.uniforms.uTime.value += rawDt * 0.6;
      return;
    }
    const dt = Math.min(rawDt, 0.05);
    s.time += dt;

    s.speed = Math.min(0.13, s.speed + dt * 0.0016);
    s.u += DIR * s.speed * dt;
    s.dist += s.speed * dt * length;

    const u = ((s.u % 1) + 1) % 1;
    sampleFrame(u);

    // Direct, intuitive control: the ship goes exactly where you point.
    // Cursor / finger position maps 1:1 to a target inside the tube; the
    // ship eases toward it — snappy but smooth, no fighting the player.
    const ctrl = ctrlRef.current;
    const reach = SAFE * 0.92;
    const desiredX = ctrl.x * reach;
    const desiredY = -ctrl.y * reach;
    const follow = 1 - Math.pow(0.0008, dt); // responsive easing
    s.off.x += (desiredX - s.off.x) * follow;
    s.off.y += (desiredY - s.off.y) * follow;


    const r = s.off.length();
    const rFrac = r / SAFE;

    const targetDanger = THREE.MathUtils.clamp((rFrac - 0.55) / 0.45, 0, 1);
    s.danger += (targetDanger - s.danger) * Math.min(1, dt * 8);

    if (s.invuln > 0) s.invuln -= dt;
    if (s.hitCd > 0) s.hitCd -= dt;

    const applyHit = (amount: number) => {
      s.shield -= amount;
      crash();
      s.invuln = 0.9;
      s.hitCd = 0.5;
      if (s.shield <= 0) {
        s.shield = 0; s.dead = true;
        onHud({ shield: 0 });
        onDead(Math.round(s.dist));
        stopAmbient();
        return true;
      }
      return false;
    };

    // wall collision
    if (rFrac >= 1 && s.invuln <= 0) {
      s.off.multiplyScalar(0.55);
      s.offVel.multiplyScalar(-0.3);
      if (applyHit(0.34)) return;
    }
    if (r > SAFE * 1.02) s.off.setLength(SAFE * 1.02);

    // ── obstacles ──
    const numActive = Math.min(OBST_COUNT, Math.max(0, Math.floor((s.dist - 140) / 55)));
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const active = i < numActive;
      // distance in u (wrapped) between player and obstacle
      let du = o.ou - u;
      du = du - Math.round(du); // shortest wrap in [-0.5,0.5]
      const near = Math.abs(du) < 0.06;
      if (!active || !near) { if (o.grp.visible) o.grp.visible = false; continue; }

      // current drifting cross-section offset
      const drift = Math.sin(s.time * 0.8 + o.phase) * o.amp;
      o.ox = Math.cos(o.ang) * o.rad + Math.cos(o.ang + Math.PI / 2) * drift;
      o.oy = Math.sin(o.ang) * o.rad + Math.sin(o.ang + Math.PI / 2) * drift;

      // place mesh
      placeAt(o.ou, o.ox, o.oy, tmp.pos);
      o.grp.position.copy(tmp.pos);
      o.grp.visible = true;
      const pulse = 1 + Math.sin(s.time * 4 + o.phase) * 0.12;
      o.grp.scale.setScalar(pulse);
      o.grp.rotation.x += dt * 1.2;
      o.grp.rotation.y += dt * 0.9;

      // collision when passing
      if (Math.abs(du) < HIT_WINDOW && s.hitCd <= 0) {
        const dx = s.off.x - o.ox;
        const dy = s.off.y - o.oy;
        if (Math.hypot(dx, dy) < ORB_R + SHIP_R) {
          if (applyHit(0.25)) return;
        }
      }
    }

    // ── camera (chase) ──
    placeAt(u, s.off.x, s.off.y, tmp.pos);
    sampleFrame(u);
    camera.up.copy(tmp.n);
    camera.position.copy(tmp.pos);
    placeAt(u + DIR * 0.018, s.off.x * 0.6, s.off.y * 0.6, tmp.look);
    camera.lookAt(tmp.look);
    camera.rotateZ(-ctrl.x * 0.28);

    // ── ship (ahead in travel direction) ──
    placeAt(u + DIR * 0.006, s.off.x * 0.85, s.off.y * 0.85, tmp.posShip);
    ship.position.copy(tmp.posShip);
    placeAt(u + DIR * 0.02, s.off.x * 0.6, s.off.y * 0.6, tmp.look);
    ship.up.copy(tmp.n);
    ship.lookAt(tmp.look);
    ship.rotation.z += (-ctrl.x * 0.5 - ship.rotation.z) * Math.min(1, dt * 6);
    const glows = ship.userData.glows as THREE.Mesh[];
    glows.forEach((m) => { (m.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.random() * 0.4; });
    // flicker ship during invuln
    ship.visible = s.invuln <= 0 || Math.floor(s.time * 20) % 2 === 0;

    // ── shader ──
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt * (2.5 + s.speed * 18);
      matRef.current.uniforms.uDanger.value = s.danger;
    }

    // ── audio ──
    const speed01 = (s.speed - 0.055) / (0.13 - 0.055);
    setSpeed(speed01);

    s.hudAcc += dt;
    if (s.hudAcc > 0.1) {
      s.hudAcc = 0;
      onHud({ shield: s.shield, distance: Math.round(s.dist), speed: speed01 });
    }
  });

  useEffect(() => {
    scene.add(ship);
    obstacles.forEach((o) => scene.add(o.grp));
    // lights so the standard-material ship reads well
    const key = new THREE.PointLight('#8fdcff', 2.4, 40);
    const rim = new THREE.PointLight('#ffb066', 1.6, 40);
    const amb = new THREE.AmbientLight('#4a5f77', 1.8);
    ship.add(key); key.position.set(1.5, 2, -1.5);
    ship.add(rim); rim.position.set(-1.5, -1, 2);
    scene.add(amb);
    return () => {
      scene.remove(ship);
      scene.remove(amb);
      obstacles.forEach((o) => scene.remove(o.grp));
    };
  }, [scene, ship, obstacles]);

  return null;
}

/* ─────────────────────────  Scene  ───────────────────────── */
function Scene({ phase, ctrlRef, onHud, onDead }: {
  phase: Phase;
  ctrlRef: React.MutableRefObject<Ctrl>;
  onHud: (h: Partial<Hud>) => void;
  onDead: (dist: number) => void;
}) {
  const curve = useMemo(makeCurve, []);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  return (
    <>
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 18, 60]} />
      <Tunnel curve={curve} matRef={matRef} />
      <GameRunner curve={curve} phase={phase} matRef={matRef} ctrlRef={ctrlRef} onHud={onHud} onDead={onDead} />
    </>
  );
}

/* ─────────────────────────  Page  ───────────────────────── */
const BEST_KEY = 'tunnelflyer.best';

export default function Starfighter() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('briefing');
  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState<Hud>({ shield: 1, distance: 0, speed: 0, best: 0 });
  const ctrlRef = useRef<Ctrl>({ x: 0, y: 0 });
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const b = Number(localStorage.getItem(BEST_KEY) || 0);
    setHud((h) => ({ ...h, best: b }));
    const a = new Audio(tunnelMusic);
    a.loop = true;
    a.volume = 0.0;
    musicRef.current = a;
    return () => { a.pause(); };
  }, []);

  const fadeMusic = useCallback((to: number) => {
    const a = musicRef.current;
    if (!a) return;
    const step = () => {
      if (!musicRef.current) return;
      const d = to - a.volume;
      if (Math.abs(d) < 0.02) { a.volume = to; if (to === 0) a.pause(); return; }
      a.volume = Math.max(0, Math.min(1, a.volume + Math.sign(d) * 0.04));
      requestAnimationFrame(step);
    };
    step();
  }, []);

  const onHud = useCallback((h: Partial<Hud>) => {
    setHud((prev) => ({ ...prev, ...h }));
  }, []);

  const onDead = useCallback((dist: number) => {
    setHud((prev) => {
      const best = Math.max(prev.best, dist);
      localStorage.setItem(BEST_KEY, String(best));
      return { ...prev, best, distance: dist };
    });
    setPhase('dead');
    fadeMusic(0);
  }, [fadeMusic]);

  const start = useCallback(() => {
    setAudioEnabled(!muted);
    if (!muted) {
      startAmbient();
      const a = musicRef.current;
      if (a) { a.currentTime = 0; a.volume = 0; a.play().catch(() => {}); fadeMusic(0.55); }
    }
    uiBeep(880);
    ctrlRef.current.x = 0; ctrlRef.current.y = 0;
    setPhase('playing');
  }, [muted, fadeMusic]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      setAudioEnabled(!next);
      if (next) { stopAmbient(); fadeMusic(0); }
      else if (phase === 'playing') {
        startAmbient();
        const a = musicRef.current;
        if (a) { a.play().catch(() => {}); fadeMusic(0.55); }
      }
      return next;
    });
  }, [phase, fadeMusic]);

  useEffect(() => () => { stopAmbient(); }, []);

  /* input */
  useEffect(() => {
    const setFromClient = (cx: number, cy: number) => {
      const nx = (cx / window.innerWidth) * 2 - 1;
      const ny = (cy / window.innerHeight) * 2 - 1;
      ctrlRef.current.x = THREE.MathUtils.clamp(nx * 1.15, -1, 1);
      ctrlRef.current.y = THREE.MathUtils.clamp(-ny * 1.15, -1, 1);
    };
    const onPointer = (e: PointerEvent) => setFromClient(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length) setFromClient(e.touches[0].clientX, e.touches[0].clientY);
    };
    const keys = new Set<string>();
    const applyKeys = () => {
      let x = 0, y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y += 1;
      if (keys.has('s') || keys.has('arrowdown')) y -= 1;
      if (x || y) { ctrlRef.current.x = x; ctrlRef.current.y = y; }
    };
    const kd = (e: KeyboardEvent) => { keys.add(e.key.toLowerCase()); applyKeys(); };
    const ku = (e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); applyKeys(); };
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  const shieldPct = Math.round(hud.shield * 100);
  const speedPct = Math.round(hud.speed * 100);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#02040a] font-mono text-cyan-100 select-none">
      <Helmet>
        <title>Tunnel Flyer — Inside the Box</title>
        <meta name="description" content="Fliege durch eine unendliche, sich windende Röhre. Weiche Hindernissen aus, bleib im Tunnel — ein immersives 3D-Erlebnis mit hochwertigem Sound." />
      </Helmet>

      <Canvas
        camera={{ fov: 82, near: 0.1, far: 400, position: [0, 0, 0] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Scene phase={phase} ctrlRef={ctrlRef} onHud={onHud} onDead={onDead} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 220px 40px rgba(0,0,0,0.85)' }} />

      {phase === 'playing' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 md:p-6">
          <div className="rounded-lg bg-black/30 px-3 py-2 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-widest text-cyan-300/70">Distanz</div>
            <div className="text-2xl font-bold tabular-nums text-cyan-200">{hud.distance.toLocaleString('de-DE')} m</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-lg bg-black/30 px-3 py-2 text-right backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-widest text-cyan-300/70">Hülle</div>
              <div className="mt-1 h-2 w-28 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${shieldPct}%`,
                    background: shieldPct > 40 ? 'linear-gradient(90deg,#4dd0ff,#00ffaa)' : 'linear-gradient(90deg,#ff3b5c,#f5b800)',
                  }}
                />
              </div>
            </div>
            <div className="rounded-lg bg-black/30 px-3 py-2 text-right backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-widest text-cyan-300/70">Speed</div>
              <div className="text-lg font-bold tabular-nums text-[#f5b800]">{speedPct}%</div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute right-4 bottom-4 z-20 flex gap-2">
        <button
          onClick={toggleMute}
          className="pointer-events-auto rounded-lg border border-cyan-400/30 bg-black/40 px-3 py-2 text-xs backdrop-blur-sm transition hover:bg-black/60"
        >
          {muted ? '🔇 Ton aus' : '🔊 Ton an'}
        </button>
      </div>
      <button
        onClick={() => { stopAmbient(); fadeMusic(0); navigate('/'); }}
        className="absolute left-4 bottom-4 z-20 rounded-lg border border-cyan-400/30 bg-black/40 px-3 py-2 text-xs backdrop-blur-sm transition hover:bg-black/60"
      >
        ← Zurück
      </button>

      {phase === 'briefing' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-cyan-400/20 bg-[#050a16]/90 p-8 text-center shadow-2xl">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-cyan-200">TUNNEL&nbsp;FLYER</h1>
            <p className="mb-6 text-sm leading-relaxed text-cyan-100/70">
              Fliege durch eine unendliche, sich windende Röhre. Steuere sanft, folge den Kurven,
              weiche den roten Hindernissen aus und bleib im Tunnel. Auf Kurven zieht es dich nach außen — gegenlenken!
            </p>
            <div className="mb-6 space-y-1 text-xs text-cyan-100/60">
              <p><span className="text-cyan-300">Maus / Finger</span> — lenken</p>
              <p><span className="text-cyan-300">WASD / Pfeile</span> — lenken</p>
            </div>
            <button
              onClick={start}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 font-bold text-[#02040a] transition hover:brightness-110"
            >
              Start
            </button>
            {hud.best > 0 && (
              <p className="mt-4 text-xs text-cyan-100/50">Bestwert: {hud.best.toLocaleString('de-DE')} m</p>
            )}
          </div>
        </div>
      )}

      {phase === 'dead' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-red-400/20 bg-[#160509]/90 p-8 text-center shadow-2xl">
            <h2 className="mb-1 text-2xl font-bold text-red-300">Aufgeschlagen</h2>
            <p className="mb-6 text-sm text-cyan-100/60">Die Röhre hat gewonnen — diesmal.</p>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-black/30 px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest text-cyan-300/60">Distanz</div>
                <div className="text-xl font-bold text-cyan-200">{hud.distance.toLocaleString('de-DE')} m</div>
              </div>
              <div className="rounded-lg bg-black/30 px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest text-cyan-300/60">Bestwert</div>
                <div className="text-xl font-bold text-[#f5b800]">{hud.best.toLocaleString('de-DE')} m</div>
              </div>
            </div>
            <button
              onClick={start}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 font-bold text-[#02040a] transition hover:brightness-110"
            >
              Nochmal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
