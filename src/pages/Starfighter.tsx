import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  playerShot, enemyShot, explosion, playerHit, uiBeep, waveFanfare,
  startAmbient, stopAmbient, setSfxEnabled,
} from '@/game/starfighterSfx';

/* ─────────────────────────  Palette  ───────────────────────── */
const GREEN = '#00ffaa';
const CYAN = '#4dd0ff';
const RED = '#ff3b5c';
const GOLD = '#f5b800';

/* ─────────────────────────  Shared game state  ───────────────────────── */
type Phase = 'briefing' | 'playing' | 'dead' | 'won';

interface Hud {
  shield: number;      // 0..1
  score: number;
  wave: number;
  combo: number;
  kills: number;
  accuracy: number;    // 0..1
  diff: string;        // human label
  hint: string;
}

interface Enemy {
  mesh: THREE.Group;
  active: boolean;
  vel: THREE.Vector3;
  hp: number;
  maxHp: number;
  fireCd: number;
  type: 'scout' | 'fighter' | 'gunship';
  wobble: number;
  spin: number;
}

interface Bolt {
  mesh: THREE.Mesh;
  active: boolean;
  vel: THREE.Vector3;
  life: number;
}

interface Burst {
  line: THREE.LineSegments;
  active: boolean;
  age: number;
  ttl: number;
}

interface World {
  enemies: Enemy[];
  pBolts: Bolt[];
  eBolts: Bolt[];
  bursts: Burst[];
  aim: THREE.Vector2;       // NDC -1..1
  fireHeld: boolean;
  fireCd: number;
  shotsFired: number;
  shotsHit: number;
  shield: number;
  score: number;
  wave: number;
  combo: number;
  comboTimer: number;
  kills: number;
  spawnCd: number;
  spawnInterval: number;
  enemySpeedMul: number;
  enemyFireMul: number;
  diffTimer: number;
  toSpawnThisWave: number;
  spawnedThisWave: number;
  aliveThisWave: number;
  waveState: 'spawning' | 'clearing' | 'intermission';
  interTimer: number;
  phase: Phase;
  shake: number;
  invuln: number;
}

const MAX_ENEMIES = 12;
const MAX_PBOLTS = 60;
const MAX_EBOLTS = 90;
const MAX_BURSTS = 14;
const TOTAL_WAVES = 6;

const STORY_HINTS: Record<number, string> = {
  1: 'Sektor SIGMA. Feindliche Aufklärer voraus — Fadenkreuz führen, Feuer frei.',
  2: 'Die Drohnen lernen deine Muster. Bleib in Bewegung, halte die Combo.',
  3: 'Schwere Jäger rücken nach. Ziele auf den Kern, bevor sie feuern.',
  4: 'Die KI passt die Formation an dein Können an. Präzision zählt jetzt.',
  5: 'Gunships mit doppelter Panzerung. Bündle deine Salven.',
  6: 'Letzte Welle. Das gegnerische Rechenzentrum deckt sich selbst. Räum auf.',
};

/* ─────────────────────────  Geometry factories  ───────────────────────── */
function makeEnemyMesh(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 2.6, 4),
    new THREE.MeshBasicMaterial({ color: RED, wireframe: true, transparent: true, opacity: 0.95 }),
  );
  body.rotation.x = Math.PI / 2; // point +z toward player
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.12, 6, 12),
    new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.7 }),
  );
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 8, 8),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }),
  );
  g.add(body, ring, core);
  g.visible = false;
  return g;
}

function makeBolt(color: string): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  m.scale.set(0.6, 0.6, 2.4);
  m.visible = false;
  return m;
}

function makeBurst(): THREE.LineSegments {
  const geo = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1, 1));
  const mat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
  const ls = new THREE.LineSegments(geo, mat);
  ls.visible = false;
  return ls;
}

/* ─────────────────────────  Starfield / nebula  ───────────────────────── */
function Starfield({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = mobile ? 1400 : 3000;
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 200 + Math.random() * 300;
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
      const b = 0.3 + Math.pow(Math.random(), 2) * 0.7;
      const warm = Math.random();
      col[i3] = (warm > 0.75 ? 1 : 0.8) * b;
      col[i3 + 1] = (warm > 0.75 ? 0.85 : 0.9) * b;
      col[i3 + 2] = b;
      sz[i] = 0.5 + Math.random() * 1.6;
    }
    return { positions: pos, colors: col, sizes: sz };
  }, [count]);

  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position);
  });

  return (
    <points ref={ref} frustumCulled={false} renderOrder={-100}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial vertexColors transparent size={1.4} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function Nebula() {
  const groupRef = useRef<THREE.Group>(null);
  const tex = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const c = canvas.getContext('2d')!;
    const grd = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.28)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = grd; c.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(canvas);
    t.needsUpdate = true;
    return t;
  }, []);
  const clouds = useMemo(() => {
    const arr: { pos: THREE.Vector3; scale: number; color: THREE.Color; opacity: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const dir = new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.5) * 0.5, Math.random() - 0.5).normalize();
      const r = 150 + Math.random() * 60;
      const hue = Math.random() < 0.5 ? 0.5 + Math.random() * 0.1 : 0.78 + Math.random() * 0.08;
      arr.push({
        pos: dir.multiplyScalar(r),
        scale: 40 + Math.random() * 70,
        color: new THREE.Color().setHSL(hue, 0.55, 0.5),
        opacity: 0.02 + Math.random() * 0.05,
      });
    }
    return arr;
  }, []);
  useFrame(({ camera }) => { if (groupRef.current) groupRef.current.position.copy(camera.position); });
  return (
    <group ref={groupRef}>
      {clouds.map((cl, i) => (
        <sprite key={i} position={cl.pos} scale={[cl.scale, cl.scale, 1]} renderOrder={-99} frustumCulled={false}>
          <spriteMaterial map={tex} color={cl.color} transparent opacity={cl.opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  );
}

/* ─────────────────────────  Game engine  ───────────────────────── */
function GameEngine({
  worldRef, onHud, mobile,
}: {
  worldRef: React.MutableRefObject<World>;
  onHud: (h: Partial<Hud>, opts?: { wave?: number; phase?: Phase; hint?: string }) => void;
  mobile: boolean;
}) {
  const { camera } = useThree();
  const enemyGroup = useRef<THREE.Group>(null);
  const boltGroup = useRef<THREE.Group>(null);
  const burstGroup = useRef<THREE.Group>(null);
  const hudClock = useRef(0);

  // Build pools once
  const pools = useMemo(() => {
    const enemies: Enemy[] = [];
    for (let i = 0; i < MAX_ENEMIES; i++) {
      enemies.push({ mesh: makeEnemyMesh(), active: false, vel: new THREE.Vector3(), hp: 1, maxHp: 1, fireCd: 0, type: 'scout', wobble: 0, spin: 0 });
    }
    const pBolts: Bolt[] = [];
    for (let i = 0; i < MAX_PBOLTS; i++) pBolts.push({ mesh: makeBolt(GREEN), active: false, vel: new THREE.Vector3(), life: 0 });
    const eBolts: Bolt[] = [];
    for (let i = 0; i < MAX_EBOLTS; i++) eBolts.push({ mesh: makeBolt(RED), active: false, vel: new THREE.Vector3(), life: 0 });
    const bursts: Burst[] = [];
    for (let i = 0; i < MAX_BURSTS; i++) bursts.push({ line: makeBurst(), active: false, age: 0, ttl: 0.6 });
    return { enemies, pBolts, eBolts, bursts };
  }, []);

  // attach pools to world + groups
  useEffect(() => {
    const w = worldRef.current;
    w.enemies = pools.enemies;
    w.pBolts = pools.pBolts;
    w.eBolts = pools.eBolts;
    w.bursts = pools.bursts;
    pools.enemies.forEach((e) => enemyGroup.current?.add(e.mesh));
    pools.pBolts.forEach((b) => boltGroup.current?.add(b.mesh));
    pools.eBolts.forEach((b) => boltGroup.current?.add(b.mesh));
    pools.bursts.forEach((b) => burstGroup.current?.add(b.line));
    return () => {
      pools.enemies.forEach((e) => { e.mesh.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); }); });
    };
  }, [pools, worldRef]);

  const spawnEnemy = useCallback((w: World) => {
    const e = w.enemies.find((x) => !x.active);
    if (!e) return;
    const wave = w.wave;
    // enemy composition scales with wave
    const roll = Math.random();
    let type: Enemy['type'] = 'scout';
    if (wave >= 5 && roll > 0.55) type = 'gunship';
    else if (wave >= 3 && roll > 0.45) type = 'fighter';
    else if (roll > 0.7) type = 'fighter';
    const hp = type === 'gunship' ? 4 : type === 'fighter' ? 2 : 1;
    e.type = type;
    e.hp = hp; e.maxHp = hp;
    e.active = true;
    e.mesh.visible = true;
    const scale = type === 'gunship' ? 2.0 : type === 'fighter' ? 1.35 : 1.0;
    e.mesh.scale.setScalar(scale);
    const spread = mobile ? 26 : 40;
    e.mesh.position.set((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread * 0.6, -130 - Math.random() * 40);
    const baseSpeed = (type === 'gunship' ? 7 : type === 'fighter' ? 11 : 14) * w.enemySpeedMul;
    e.vel.set(0, 0, baseSpeed);
    e.fireCd = 1.2 + Math.random() * 1.6;
    e.wobble = Math.random() * Math.PI * 2;
    e.spin = (Math.random() - 0.5) * 2;
    (e.mesh.children[1] as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: type === 'gunship' ? GOLD : CYAN, wireframe: true, transparent: true, opacity: 0.7 });
    w.spawnedThisWave++;
    w.aliveThisWave++;
  }, [mobile]);

  const beginWave = useCallback((w: World, wave: number) => {
    w.wave = wave;
    w.waveState = 'spawning';
    w.spawnedThisWave = 0;
    w.aliveThisWave = 0;
    w.toSpawnThisWave = 4 + wave * 2;
    w.spawnCd = 0.4;
    w.enemySpeedMul = 1 + (wave - 1) * 0.08;
    w.enemyFireMul = 1 + (wave - 1) * 0.12;
    waveFanfare();
    onHud({ wave }, { wave, hint: STORY_HINTS[wave] || '' });
  }, [onHud]);

  const fireBurst = useCallback((w: World, pos: THREE.Vector3, color: string, scale: number) => {
    const b = w.bursts.find((x) => !x.active);
    if (!b) return;
    b.active = true; b.age = 0; b.ttl = 0.55;
    b.line.visible = true;
    b.line.position.copy(pos);
    b.line.scale.setScalar(scale * 0.4);
    (b.line.material as THREE.LineBasicMaterial).color.set(color);
    (b.line.material as THREE.LineBasicMaterial).opacity = 1;
  }, []);

  useFrame((_, rawDelta) => {
    const w = worldRef.current;
    const delta = Math.min(rawDelta, 0.05);
    if (w.phase !== 'playing') return;

    // ── aim direction from NDC ──
    const aimVec = new THREE.Vector3(w.aim.x, w.aim.y, 0.5).unproject(camera);
    const aimDir = aimVec.sub(camera.position).normalize();

    // camera gentle bank toward aim + shake
    const targetRotZ = -w.aim.x * 0.12;
    camera.rotation.z += (targetRotZ - camera.rotation.z) * 0.08;
    if (w.shake > 0) {
      w.shake = Math.max(0, w.shake - delta * 2.5);
      camera.position.x = (Math.random() - 0.5) * w.shake;
      camera.position.y = (Math.random() - 0.5) * w.shake;
    } else {
      camera.position.x *= 0.9; camera.position.y *= 0.9;
    }
    if (w.invuln > 0) w.invuln -= delta;

    // ── player firing ──
    w.fireCd -= delta;
    if (w.fireHeld && w.fireCd <= 0) {
      w.fireCd = 0.16;
      const b = w.pBolts.find((x) => !x.active);
      if (b) {
        b.active = true; b.life = 2.2; b.mesh.visible = true;
        b.mesh.position.set(camera.position.x + aimDir.x * 2, camera.position.y - 1.4 + aimDir.y * 2, camera.position.z - 3);
        b.vel.copy(aimDir).multiplyScalar(180);
        b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aimDir);
        w.shotsFired++;
        playerShot();
      }
    }

    // ── move player bolts + collision with enemies ──
    for (const b of w.pBolts) {
      if (!b.active) continue;
      b.mesh.position.addScaledVector(b.vel, delta);
      b.life -= delta;
      if (b.life <= 0 || b.mesh.position.z < -170) { b.active = false; b.mesh.visible = false; continue; }
      for (const e of w.enemies) {
        if (!e.active) continue;
        const hitR = (e.type === 'gunship' ? 2.6 : e.type === 'fighter' ? 1.9 : 1.5) * 1.15;
        if (b.mesh.position.distanceTo(e.mesh.position) < hitR) {
          b.active = false; b.mesh.visible = false;
          e.hp -= 1;
          w.shotsHit++;
          fireBurst(w, e.mesh.position, CYAN, e.mesh.scale.x);
          if (e.hp <= 0) {
            e.active = false; e.mesh.visible = false;
            w.aliveThisWave = Math.max(0, w.aliveThisWave - 1);
            w.kills++;
            w.combo++;
            w.comboTimer = 3;
            const pts = (e.type === 'gunship' ? 300 : e.type === 'fighter' ? 150 : 100) * Math.max(1, w.combo);
            w.score += pts;
            fireBurst(w, e.mesh.position, GOLD, e.mesh.scale.x * 1.6);
            explosion();
          } else {
            uiBeep(900);
          }
          break;
        }
      }
    }

    // ── enemies ──
    for (const e of w.enemies) {
      if (!e.active) continue;
      e.wobble += delta * 2;
      e.mesh.position.x += Math.sin(e.wobble) * delta * 4;
      e.mesh.position.y += Math.cos(e.wobble * 0.7) * delta * 2.5;
      e.mesh.position.addScaledVector(e.vel, delta);
      e.mesh.rotation.z += e.spin * delta;
      (e.mesh.children[1] as THREE.Mesh).rotation.z += delta * 2;

      // enemy fire
      e.fireCd -= delta * w.enemyFireMul;
      if (e.fireCd <= 0 && e.mesh.position.z < -10) {
        e.fireCd = (e.type === 'gunship' ? 1.3 : 2.2) + Math.random() * 1.2;
        const eb = w.eBolts.find((x) => !x.active);
        if (eb) {
          eb.active = true; eb.life = 4; eb.mesh.visible = true;
          eb.mesh.position.copy(e.mesh.position);
          const dir = new THREE.Vector3(camera.position.x, camera.position.y - 1.4, camera.position.z + 3).sub(e.mesh.position).normalize();
          // aim assist gets worse (better for player) when struggling
          const jitter = w.shield < 0.4 ? 0.14 : 0.05;
          dir.x += (Math.random() - 0.5) * jitter;
          dir.y += (Math.random() - 0.5) * jitter;
          eb.vel.copy(dir.normalize()).multiplyScalar(mobile ? 55 : 70);
          eb.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), eb.vel.clone().normalize());
          enemyShot();
        }
      }

      // passed the player → ram damage
      if (e.mesh.position.z > 8) {
        e.active = false; e.mesh.visible = false;
        w.aliveThisWave = Math.max(0, w.aliveThisWave - 1);
        w.combo = 0;
        if (w.invuln <= 0) {
          w.shield = Math.max(0, w.shield - 0.14);
          w.shake = 0.9; w.invuln = 0.6; playerHit();
        }
      }
    }

    // ── enemy bolts ──
    for (const b of w.eBolts) {
      if (!b.active) continue;
      b.mesh.position.addScaledVector(b.vel, delta);
      b.life -= delta;
      if (b.life <= 0 || b.mesh.position.z > 12) { b.active = false; b.mesh.visible = false; continue; }
      const px = camera.position.x, py = camera.position.y - 1.4, pz = camera.position.z + 2;
      const d = Math.hypot(b.mesh.position.x - px, b.mesh.position.y - py, b.mesh.position.z - pz);
      if (d < 2.4 && w.invuln <= 0) {
        b.active = false; b.mesh.visible = false;
        w.shield = Math.max(0, w.shield - 0.08);
        w.combo = 0;
        w.shake = 0.6; w.invuln = 0.4; playerHit();
      }
    }

    // ── bursts ──
    for (const b of w.bursts) {
      if (!b.active) continue;
      b.age += delta;
      const t = b.age / b.ttl;
      b.line.scale.setScalar(b.line.scale.x + delta * 22);
      (b.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, 1 - t);
      b.line.rotation.x += delta * 3; b.line.rotation.y += delta * 2;
      if (t >= 1) { b.active = false; b.line.visible = false; }
    }

    // ── combo decay ──
    if (w.comboTimer > 0) { w.comboTimer -= delta; if (w.comboTimer <= 0) w.combo = 0; }

    // ── wave / spawn control ──
    if (w.waveState === 'spawning') {
      w.spawnCd -= delta;
      if (w.spawnCd <= 0 && w.spawnedThisWave < w.toSpawnThisWave && w.aliveThisWave < (mobile ? 4 : 6)) {
        spawnEnemy(w);
        w.spawnCd = Math.max(0.5, w.spawnInterval);
      }
      if (w.spawnedThisWave >= w.toSpawnThisWave) w.waveState = 'clearing';
    } else if (w.waveState === 'clearing') {
      if (w.aliveThisWave <= 0) {
        if (w.wave >= TOTAL_WAVES) {
          w.phase = 'won';
          stopAmbient();
          onHud({}, { phase: 'won' });
          return;
        }
        w.waveState = 'intermission';
        w.interTimer = 2.4;
      }
    } else if (w.waveState === 'intermission') {
      w.interTimer -= delta;
      if (w.interTimer <= 0) beginWave(w, w.wave + 1);
    }

    // ── adaptive difficulty ──
    w.diffTimer -= delta;
    if (w.diffTimer <= 0) {
      w.diffTimer = 3;
      const acc = w.shotsFired > 6 ? w.shotsHit / w.shotsFired : 0.5;
      const doingWell = acc > 0.45 && w.shield > 0.55;
      const struggling = w.shield < 0.4 || (acc < 0.25 && w.shotsFired > 12);
      if (doingWell) {
        w.spawnInterval = Math.max(0.7, w.spawnInterval - 0.15);
        w.enemySpeedMul = Math.min(1.9, w.enemySpeedMul + 0.05);
        w.enemyFireMul = Math.min(2.2, w.enemyFireMul + 0.06);
      } else if (struggling) {
        w.spawnInterval = Math.min(2.6, w.spawnInterval + 0.25);
        w.enemySpeedMul = Math.max(0.8, w.enemySpeedMul - 0.06);
        w.enemyFireMul = Math.max(0.7, w.enemyFireMul - 0.1);
      }
    }

    // ── death ──
    if (w.shield <= 0 && w.phase === 'playing') {
      w.phase = 'dead';
      stopAmbient();
      onHud({}, { phase: 'dead' });
      return;
    }

    // ── HUD throttle ──
    hudClock.current += delta;
    if (hudClock.current > 0.1) {
      hudClock.current = 0;
      const acc = w.shotsFired > 0 ? w.shotsHit / w.shotsFired : 0;
      const diffLabel = w.enemySpeedMul > 1.4 ? 'ADAPTIV · HOCH'
        : w.enemySpeedMul < 1.0 ? 'ADAPTIV · SANFT'
        : 'ADAPTIV · STABIL';
      onHud({ shield: w.shield, score: w.score, combo: w.combo, kills: w.kills, accuracy: acc, diff: diffLabel });
    }
  });

  return (
    <>
      <group ref={enemyGroup} />
      <group ref={boltGroup} />
      <group ref={burstGroup} />
    </>
  );
}

/* ─────────────────────────  Page  ───────────────────────── */
function freshWorld(): World {
  return {
    enemies: [], pBolts: [], eBolts: [], bursts: [],
    aim: new THREE.Vector2(0, 0),
    fireHeld: false, fireCd: 0,
    shotsFired: 0, shotsHit: 0,
    shield: 1, score: 0, wave: 0, combo: 0, comboTimer: 0, kills: 0,
    spawnCd: 0, spawnInterval: 1.8, enemySpeedMul: 1, enemyFireMul: 1,
    diffTimer: 3, toSpawnThisWave: 0, spawnedThisWave: 0, aliveThisWave: 0,
    waveState: 'intermission', interTimer: 0, phase: 'briefing',
    shake: 0, invuln: 0,
  };
}

export default function Starfighter() {
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const worldRef = useRef<World>(freshWorld());
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('briefing');
  const [sound, setSound] = useState(true);
  const [hint, setHint] = useState('');
  const [hintKey, setHintKey] = useState(0);
  const [autoFire, setAutoFire] = useState(true);
  const [hud, setHud] = useState<Hud>({ shield: 1, score: 0, wave: 1, combo: 0, kills: 0, accuracy: 0, diff: 'ADAPTIV · STABIL', hint: '' });

  const onHud = useCallback((h: Partial<Hud>, opts?: { wave?: number; phase?: Phase; hint?: string }) => {
    if (Object.keys(h).length) setHud((prev) => ({ ...prev, ...h }));
    if (opts?.phase) setPhase(opts.phase);
    if (opts?.wave) setHud((prev) => ({ ...prev, wave: opts.wave! }));
    if (opts?.hint !== undefined) { setHint(opts.hint); setHintKey((k) => k + 1); }
  }, []);

  useEffect(() => { setSfxEnabled(sound); }, [sound]);
  useEffect(() => () => stopAmbient(), []);

  const startGame = useCallback(() => {
    const w = worldRef.current;
    Object.assign(w, freshWorld());
    w.phase = 'playing';
    // seed first wave
    w.wave = 1;
    w.waveState = 'spawning';
    w.toSpawnThisWave = 6;
    w.spawnCd = 0.6;
    setPhase('playing');
    setHud({ shield: 1, score: 0, wave: 1, combo: 0, kills: 0, accuracy: 0, diff: 'ADAPTIV · STABIL', hint: '' });
    setHint(STORY_HINTS[1]); setHintKey((k) => k + 1);
    if (sound) { startAmbient(); waveFanfare(); }
    uiBeep(660);
  }, [sound]);

  const restart = useCallback(() => { uiBeep(520); startGame(); }, [startGame]);

  // pointer aim
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const setAim = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      worldRef.current.aim.set(((cx - r.left) / r.width) * 2 - 1, -(((cy - r.top) / r.height) * 2 - 1));
    };
    const onMove = (e: PointerEvent) => setAim(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      setAim(e.clientX, e.clientY);
      if (!autoFire) worldRef.current.fireHeld = true;
    };
    const onUp = () => { if (!autoFire) worldRef.current.fireHeld = false; };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [autoFire]);

  // auto-fire toggle drives fireHeld while playing
  useEffect(() => {
    worldRef.current.fireHeld = autoFire && phase === 'playing';
  }, [autoFire, phase]);

  // keyboard fire
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); if (!autoFire) worldRef.current.fireHeld = true; } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space' && !autoFire) worldRef.current.fireHeld = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [autoFire]);

  const shieldPct = Math.round(hud.shield * 100);
  const shieldColor = hud.shield > 0.5 ? GREEN : hud.shield > 0.25 ? GOLD : RED;

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden select-none touch-none" style={{ background: '#000', cursor: phase === 'playing' ? 'none' : 'default' }}>
      <Helmet>
        <title>Starfighter SIGMA — Immersives KI-Weltraumgefecht</title>
        <meta name="description" content="Ein hochwertiges, KI-gesteuertes Weltraumgefecht im Elite-Vektorstil. Adaptive Gegner, einfache Steuerung, sechs Wellen." />
      </Helmet>

      <Canvas
        className="absolute inset-0 z-0"
        camera={{ fov: mobile ? 82 : 72, near: 0.1, far: 900, position: [0, 0, 0] }}
        dpr={mobile ? 1 : Math.min(window.devicePixelRatio, 2)}
        gl={{ antialias: !mobile, alpha: false, powerPreference: mobile ? 'low-power' : 'high-performance' }}
      >
        <color attach="background" args={['#000000']} />
        <Starfield mobile={mobile} />
        <Nebula />
        <GameEngine worldRef={worldRef} onHud={onHud} mobile={mobile} />
      </Canvas>

      {/* ── Crosshair ── */}
      {phase === 'playing' && (
        <CrosshairOverlay worldRef={worldRef} />
      )}

      {/* ── HUD ── */}
      {phase === 'playing' && (
        <div className="pointer-events-none absolute inset-0 z-20 font-mono">
          {/* Shield */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-44 sm:w-56">
            <div className="flex justify-between text-[10px] tracking-[0.25em] mb-1" style={{ color: shieldColor }}>
              <span>SCHILD</span><span>{shieldPct}%</span>
            </div>
            <div className="h-2 rounded-sm overflow-hidden border" style={{ borderColor: shieldColor + '55', background: '#0a0a0a' }}>
              <div className="h-full transition-[width] duration-200" style={{ width: `${shieldPct}%`, background: shieldColor, boxShadow: `0 0 12px ${shieldColor}` }} />
            </div>
            <div className="mt-2 text-[9px] tracking-[0.25em]" style={{ color: CYAN }}>{hud.diff}</div>
          </div>

          {/* Score / wave */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-right">
            <div className="text-[10px] tracking-[0.25em]" style={{ color: GREEN }}>PUNKTE</div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: '#fff', textShadow: `0 0 14px ${GREEN}` }}>{hud.score.toLocaleString('de-DE')}</div>
            <div className="mt-1 text-[10px] tracking-[0.25em]" style={{ color: GOLD }}>WELLE {hud.wave} / {TOTAL_WAVES}</div>
            <div className="mt-0.5 text-[9px] tracking-[0.2em]" style={{ color: CYAN }}>TREFFER {Math.round(hud.accuracy * 100)}% · KILLS {hud.kills}</div>
          </div>

          {/* Combo */}
          {hud.combo > 1 && (
            <div className="absolute left-1/2 -translate-x-1/2 top-20 sm:top-24 text-center">
              <div className="text-3xl sm:text-4xl font-bold" style={{ color: GOLD, textShadow: `0 0 18px ${GOLD}` }}>×{hud.combo}</div>
              <div className="text-[9px] tracking-[0.3em]" style={{ color: GOLD }}>COMBO</div>
            </div>
          )}

          {/* Story hint */}
          {hint && (
            <div key={hintKey} className="absolute left-1/2 -translate-x-1/2 bottom-24 sm:bottom-28 max-w-[90%] text-center px-4 animate-[fadeSlide_0.5s_ease]">
              <p className="text-[11px] sm:text-sm tracking-wide leading-relaxed" style={{ color: '#cfeee2', textShadow: '0 0 10px rgba(0,255,170,0.4)' }}>{hint}</p>
            </div>
          )}

          {/* Damage vignette */}
          {hud.shield <= 0.3 && (
            <div className="absolute inset-0 animate-pulse" style={{ boxShadow: `inset 0 0 160px ${RED}`, opacity: 0.5 }} />
          )}
        </div>
      )}

      {/* ── Controls bar ── */}
      {phase === 'playing' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 font-mono">
          <GameBtn onClick={() => setAutoFire((v) => { uiBeep(600); return !v; })} active={autoFire}>
            {autoFire ? '⦿ AUTO-FEUER' : '○ AUTO-FEUER'}
          </GameBtn>
          <GameBtn onClick={() => setSound((v) => !v)} active={sound}>
            {sound ? '♫ TON' : '✕ TON'}
          </GameBtn>
        </div>
      )}

      {/* ── Briefing ── */}
      {phase === 'briefing' && (
        <Overlay>
          <p className="text-[11px] tracking-[0.4em] mb-3" style={{ color: CYAN }}>MISSIONSAKTE · SEKTOR SIGMA</p>
          <h1 className="text-4xl sm:text-6xl font-bold mb-4" style={{ color: GREEN, textShadow: `0 0 30px ${GREEN}` }}>STARFIGHTER</h1>
          <p className="max-w-xl text-sm sm:text-base leading-relaxed mb-2" style={{ color: '#cfeee2' }}>
            Eine gegnerische KI-Flotte hat den Aussensektor besetzt. Ihre Drohnen <em>lernen</em> —
            je besser du fliegst, desto klüger schlagen sie zurück. Halte dagegen.
          </p>
          <p className="max-w-xl text-xs sm:text-sm leading-relaxed mb-6" style={{ color: '#8fbfb0' }}>
            Steuerung so einfach wie ein Smartphone: <b style={{ color: GREEN }}>Fadenkreuz mit Maus / Finger führen</b>.
            Auto-Feuer ist aktiv — du musst nur zielen. Sechs Wellen. Die KI stellt sich auf dich ein.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 rounded font-mono text-sm tracking-[0.3em] transition-all hover:scale-105"
            style={{ color: '#001a12', background: GREEN, boxShadow: `0 0 30px ${GREEN}` }}
          >
            ▶ MISSION STARTEN
          </button>
          <button onClick={() => navigate('/')} className="mt-4 text-[11px] tracking-[0.25em] font-mono opacity-60 hover:opacity-100" style={{ color: CYAN }}>
            ← ZURÜCK
          </button>
        </Overlay>
      )}

      {/* ── Dead ── */}
      {phase === 'dead' && (
        <Overlay>
          <p className="text-[11px] tracking-[0.4em] mb-3" style={{ color: RED }}>SCHIFF VERLOREN</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: RED, textShadow: `0 0 26px ${RED}` }}>GAME OVER</h1>
          <ResultStats hud={hud} />
          <div className="flex gap-3 mt-6">
            <button onClick={restart} className="px-6 py-3 rounded font-mono text-sm tracking-[0.25em] hover:scale-105 transition-all" style={{ color: '#001a12', background: GREEN, boxShadow: `0 0 24px ${GREEN}` }}>↻ NOCHMAL</button>
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded font-mono text-sm tracking-[0.25em] border hover:scale-105 transition-all" style={{ color: CYAN, borderColor: CYAN + '55' }}>← ENDE</button>
          </div>
        </Overlay>
      )}

      {/* ── Won ── */}
      {phase === 'won' && (
        <Overlay>
          <p className="text-[11px] tracking-[0.4em] mb-3" style={{ color: GOLD }}>SEKTOR SIGMA · BEFREIT</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: GOLD, textShadow: `0 0 26px ${GOLD}` }}>SIEG</h1>
          <p className="max-w-md text-sm leading-relaxed mb-2" style={{ color: '#cfeee2' }}>
            Die feindliche KI ist geschlagen. Du hast schneller gelernt als die Maschine.
          </p>
          <ResultStats hud={hud} />
          <div className="flex gap-3 mt-6">
            <button onClick={restart} className="px-6 py-3 rounded font-mono text-sm tracking-[0.25em] hover:scale-105 transition-all" style={{ color: '#001a12', background: GOLD, boxShadow: `0 0 24px ${GOLD}` }}>↻ NEUE RUNDE</button>
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded font-mono text-sm tracking-[0.25em] border hover:scale-105 transition-all" style={{ color: CYAN, borderColor: CYAN + '55' }}>← ENDE</button>
          </div>
        </Overlay>
      )}

      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
}

/* ─────────────────────────  Small UI pieces  ───────────────────────── */
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center px-6" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55), rgba(0,0,0,0.9))', backdropFilter: 'blur(2px)' }}>
      {children}
    </div>
  );
}

function GameBtn({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded border text-[10px] tracking-[0.2em] uppercase transition-all"
      style={{ color: active ? GREEN : '#7f9c92', borderColor: (active ? GREEN : '#556') + '66', background: active ? GREEN + '18' : 'transparent' }}
    >
      {children}
    </button>
  );
}

function ResultStats({ hud }: { hud: Hud }) {
  return (
    <div className="grid grid-cols-3 gap-6 font-mono mt-2">
      <Stat label="PUNKTE" value={hud.score.toLocaleString('de-DE')} color={GREEN} />
      <Stat label="KILLS" value={String(hud.kills)} color={GOLD} />
      <Stat label="TREFFER" value={`${Math.round(hud.accuracy * 100)}%`} color={CYAN} />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[9px] tracking-[0.25em] opacity-70" style={{ color }}>{label}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: '#fff' }}>{value}</div>
    </div>
  );
}

function CrosshairOverlay({ worldRef }: { worldRef: React.MutableRefObject<World> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const a = worldRef.current.aim;
        el.style.left = `${(a.x * 0.5 + 0.5) * 100}%`;
        el.style.top = `${(-a.y * 0.5 + 0.5) * 100}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [worldRef]);
  return (
    <div ref={ref} className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: '50%', top: '50%' }}>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border" style={{ borderColor: GREEN + 'cc', boxShadow: `0 0 10px ${GREEN}` }} />
        <div className="absolute left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
        <div className="absolute left-1/2 -top-2 w-px h-2 -translate-x-1/2" style={{ background: GREEN }} />
        <div className="absolute left-1/2 -bottom-2 w-px h-2 -translate-x-1/2" style={{ background: GREEN }} />
        <div className="absolute -left-2 top-1/2 h-px w-2 -translate-y-1/2" style={{ background: GREEN }} />
        <div className="absolute -right-2 top-1/2 h-px w-2 -translate-y-1/2" style={{ background: GREEN }} />
      </div>
    </div>
  );
}
