import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  startAmbient, stopAmbient, setAudioEnabled, setSpeed, crash, ding, uiBeep,
} from '@/game/tunnelAudio';

/* ─────────────────────────  Palette  ───────────────────────── */
const CYAN = '#4dd0ff';
const GOLD = '#f5b800';

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
  const c = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  return c;
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
          // longitudinal rings sliding toward the viewer
          float ringPhase = vUv.x * 260.0 - uTime * 6.0;
          float ring = abs(sin(ringPhase * 3.14159));
          float glowRing = smoothstep(0.86, 1.0, ring);
          // circumferential ribs
          float rib = abs(sin(vUv.y * 3.14159 * 24.0));
          float glowRib = smoothstep(0.9, 1.0, rib);
          float g = max(glowRing, glowRib * 0.55);
          // flowing base hue along the tube
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

/* ─────────────────────────  Player ship (wireframe)  ───────────────────────── */
function buildShip(): THREE.Group {
  const g = new THREE.Group();
  const bodyGeo = new THREE.ConeGeometry(0.32, 1.2, 8);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMat = new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.95 });
  g.add(new THREE.Mesh(bodyGeo, bodyMat));

  const glowGeo = new THREE.ConeGeometry(0.34, 1.25, 8);
  glowGeo.rotateX(Math.PI / 2);
  const glowMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08 });
  g.add(new THREE.Mesh(glowGeo, glowMat));

  const wingGeo = new THREE.BoxGeometry(1.5, 0.06, 0.45);
  const wingMat = new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.8 });
  const wing = new THREE.Mesh(wingGeo, wingMat);
  wing.position.z = 0.3;
  g.add(wing);

  // engine glow
  const engGeo = new THREE.SphereGeometry(0.16, 8, 8);
  const engMat = new THREE.MeshBasicMaterial({ color: '#ff8a3d', transparent: true, opacity: 0.9 });
  const eng = new THREE.Mesh(engGeo, engMat);
  eng.position.z = 0.6;
  g.add(eng);

  return g;
}

/* ─────────────────────────  Game runner  ───────────────────────── */
interface Ctrl {
  x: number; // -1..1 target
  y: number;
}

function GameRunner({
  curve,
  phase,
  matRef,
  ctrlRef,
  onHud,
  onDead,
  best,
}: {
  curve: THREE.CatmullRomCurve3;
  phase: Phase;
  matRef: React.MutableRefObject<THREE.ShaderMaterial | null>;
  ctrlRef: React.MutableRefObject<Ctrl>;
  onHud: (h: Partial<Hud>) => void;
  onDead: (dist: number) => void;
  best: number;
}) {
  const { camera } = useThree();
  const frames = useMemo(() => curve.computeFrenetFrames(SEGMENTS, true), [curve]);
  const length = useMemo(() => curve.getLength(), [curve]);
  const ship = useMemo(buildShip, []);

  // mutable state
  const st = useRef({
    u: 0,
    speed: 0.055,       // fraction of curve per second
    off: new THREE.Vector2(0, 0),
    offVel: new THREE.Vector2(0, 0),
    shield: 1,
    dist: 0,
    dead: false,
    danger: 0,
    invuln: 0,
    hudAcc: 0,
    started: false,
  });

  // scratch
  const tmp = useRef({
    pos: new THREE.Vector3(),
    posShip: new THREE.Vector3(),
    look: new THREE.Vector3(),
    n: new THREE.Vector3(),
    b: new THREE.Vector3(),
    t0: new THREE.Vector3(),
    t1: new THREE.Vector3(),
    v: new THREE.Vector3(),
  }).current;

  // reset when entering "playing"
  useEffect(() => {
    if (phase === 'playing') {
      const s = st.current;
      s.u = 0; s.speed = 0.055; s.off.set(0, 0); s.offVel.set(0, 0);
      s.shield = 1; s.dist = 0; s.dead = false; s.danger = 0; s.invuln = 1.2; s.started = true;
      onHud({ shield: 1, distance: 0, speed: 0 });
    }
  }, [phase, onHud]);

  const sampleFrame = useCallback((u: number) => {
    const i = Math.min(SEGMENTS - 1, Math.max(0, Math.floor(u * SEGMENTS)));
    tmp.n.copy(frames.normals[i]);
    tmp.b.copy(frames.binormals[i]);
    tmp.t0.copy(frames.tangents[i]);
    tmp.t1.copy(frames.tangents[Math.min(SEGMENTS - 1, i + 4)]);
    return i;
  }, [frames, tmp]);

  const placeAt = useCallback((u: number, offX: number, offY: number, target: THREE.Vector3) => {
    curve.getPointAt(((u % 1) + 1) % 1, target);
    sampleFrame(((u % 1) + 1) % 1);
    target.addScaledVector(tmp.n, offX);
    target.addScaledVector(tmp.b, offY);
  }, [curve, sampleFrame, tmp]);

  useFrame((_, rawDt) => {
    const s = st.current;
    if (phase !== 'playing' || s.dead) {
      if (matRef.current) matRef.current.uniforms.uTime.value += rawDt * 0.6; // gentle drift on menus
      return;
    }
    const dt = Math.min(rawDt, 0.05);

    // difficulty ramp (adaptive & beginner-friendly): slow build-up
    s.speed = Math.min(0.13, s.speed + dt * 0.0016);
    s.u += s.speed * dt;
    s.dist += s.speed * dt * length;

    // curvature push (rollercoaster centrifugal feel)
    const u = ((s.u % 1) + 1) % 1;
    sampleFrame(u);
    tmp.v.subVectors(tmp.t1, tmp.t0);
    const curveN = tmp.v.dot(tmp.n);
    const curveB = tmp.v.dot(tmp.b);
    // ramps up with distance for adaptive challenge
    const centro = 34 + Math.min(40, s.dist * 0.006);
    s.offVel.x += (-curveN) * centro * dt;
    s.offVel.y += (-curveB) * centro * dt;

    // steering input (easy, responsive)
    const ctrl = ctrlRef.current;
    const accel = 42;
    s.offVel.x += ctrl.x * accel * dt;
    s.offVel.y += -ctrl.y * accel * dt;

    // damping + integrate
    s.offVel.multiplyScalar(Math.pow(0.02, dt));
    s.off.addScaledVector(s.offVel, dt);

    // radial distance vs wall
    const r = s.off.length();
    const rFrac = r / SAFE;

    // danger glow rises near wall
    const targetDanger = THREE.MathUtils.clamp((rFrac - 0.55) / 0.45, 0, 1);
    s.danger += (targetDanger - s.danger) * Math.min(1, dt * 8);

    if (s.invuln > 0) s.invuln -= dt;

    // collision
    if (rFrac >= 1 && s.invuln <= 0) {
      s.shield -= 0.34;
      crash();
      s.invuln = 0.9;
      // bounce back toward centre
      s.off.multiplyScalar(0.55);
      s.offVel.multiplyScalar(-0.3);
      if (s.shield <= 0) {
        s.shield = 0;
        s.dead = true;
        onHud({ shield: 0 });
        onDead(Math.round(s.dist));
        stopAmbient();
        return;
      }
    }

    // clamp so ship can't leave geometry entirely
    if (r > SAFE * 1.02) s.off.setLength(SAFE * 1.02);

    // ── camera (chase) ──
    placeAt(u, s.off.x, s.off.y, tmp.pos);
    // camera up follows tube normal for banking immersion
    sampleFrame(u);
    camera.up.copy(tmp.n).multiplyScalar(-1).lerp(new THREE.Vector3(0, 1, 0), 0); // keep tube-relative up
    camera.up.copy(tmp.n);
    camera.position.copy(tmp.pos);
    placeAt(u + 0.018, s.off.x * 0.6, s.off.y * 0.6, tmp.look);
    camera.lookAt(tmp.look);
    // subtle roll from steering
    camera.rotateZ(-ctrl.x * 0.28);

    // ── ship (ahead of camera) ──
    placeAt(u + 0.006, s.off.x * 0.85, s.off.y * 0.85, tmp.posShip);
    ship.position.copy(tmp.posShip);
    placeAt(u + 0.02, s.off.x * 0.6, s.off.y * 0.6, tmp.look);
    ship.up.copy(tmp.n);
    ship.lookAt(tmp.look);
    ship.rotation.z += (-ctrl.x * 0.5 - ship.rotation.z) * Math.min(1, dt * 6);
    // engine flicker
    const eng = ship.children[3] as THREE.Mesh;
    (eng.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.random() * 0.4;

    // ── shader ──
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt * (2.5 + s.speed * 18);
      matRef.current.uniforms.uDanger.value = s.danger;
    }

    // ── audio ──
    const speed01 = (s.speed - 0.055) / (0.13 - 0.055);
    setSpeed(speed01);

    // ── HUD (throttled) ──
    s.hudAcc += dt;
    if (s.hudAcc > 0.1) {
      s.hudAcc = 0;
      onHud({ shield: s.shield, distance: Math.round(s.dist), speed: speed01 });
    }
  });

  // add/remove ship from scene
  const { scene } = useThree();
  useEffect(() => {
    scene.add(ship);
    return () => { scene.remove(ship); };
  }, [scene, ship]);

  return null;
}

/* ─────────────────────────  Scene wrapper  ───────────────────────── */
function Scene({
  phase, ctrlRef, onHud, onDead, best,
}: {
  phase: Phase;
  ctrlRef: React.MutableRefObject<Ctrl>;
  onHud: (h: Partial<Hud>) => void;
  onDead: (dist: number) => void;
  best: number;
}) {
  const curve = useMemo(makeCurve, []);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  return (
    <>
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 18, 60]} />
      <Tunnel curve={curve} matRef={matRef} />
      <GameRunner
        curve={curve}
        phase={phase}
        matRef={matRef}
        ctrlRef={ctrlRef}
        onHud={onHud}
        onDead={onDead}
        best={best}
      />
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
  const lastDist = useRef(0);

  useEffect(() => {
    const b = Number(localStorage.getItem(BEST_KEY) || 0);
    setHud((h) => ({ ...h, best: b }));
  }, []);

  const onHud = useCallback((h: Partial<Hud>) => {
    setHud((prev) => ({ ...prev, ...h }));
    if (h.distance != null) lastDist.current = h.distance;
  }, []);

  const onDead = useCallback((dist: number) => {
    setHud((prev) => {
      const best = Math.max(prev.best, dist);
      localStorage.setItem(BEST_KEY, String(best));
      return { ...prev, best, distance: dist };
    });
    setPhase('dead');
  }, []);

  const start = useCallback(() => {
    setAudioEnabled(!muted);
    if (!muted) startAmbient();
    uiBeep(880);
    ctrlRef.current.x = 0; ctrlRef.current.y = 0;
    setPhase('playing');
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      setAudioEnabled(!next);
      if (next) stopAmbient();
      else if (phase === 'playing') startAmbient();
      return next;
    });
  }, [phase]);

  useEffect(() => () => { stopAmbient(); }, []);

  /* ── input: pointer + touch + keyboard ── */
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
        <meta name="description" content="Fliege durch eine unendliche, sich windende Röhre. Bleib im Tunnel, halte die Geschwindigkeit — ein immersives 3D-Erlebnis." />
      </Helmet>

      <Canvas
        camera={{ fov: 82, near: 0.1, far: 400, position: [0, 0, 0] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Scene phase={phase} ctrlRef={ctrlRef} onHud={onHud} onDead={onDead} best={hud.best} />
      </Canvas>

      {/* vignette */}
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 220px 40px rgba(0,0,0,0.85)' }} />

      {/* ── Top HUD ── */}
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

      {/* mute + exit */}
      <div className="absolute right-4 bottom-4 z-20 flex gap-2">
        <button
          onClick={toggleMute}
          className="pointer-events-auto rounded-lg border border-cyan-400/30 bg-black/40 px-3 py-2 text-xs backdrop-blur-sm transition hover:bg-black/60"
        >
          {muted ? '🔇 Ton aus' : '🔊 Ton an'}
        </button>
      </div>
      <button
        onClick={() => { stopAmbient(); navigate('/'); }}
        className="absolute left-4 bottom-4 z-20 rounded-lg border border-cyan-400/30 bg-black/40 px-3 py-2 text-xs backdrop-blur-sm transition hover:bg-black/60"
      >
        ← Zurück
      </button>

      {/* ── Briefing ── */}
      {phase === 'briefing' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-cyan-400/20 bg-[#050a16]/90 p-8 text-center shadow-2xl">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-cyan-200">TUNNEL&nbsp;FLYER</h1>
            <p className="mb-6 text-sm leading-relaxed text-cyan-100/70">
              Fliege durch eine unendliche, sich windende Röhre. Steuere sanft, folge den Kurven
              und bleib im Tunnel. Auf Kurven zieht es dich nach außen — gegenlenken!
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

      {/* ── Dead ── */}
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
