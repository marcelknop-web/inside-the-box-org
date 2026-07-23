import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import earthTex from "@/assets/syndicate/earth-cyber.jpg";

export interface GlobePlayer {
  id: string;
  color: string;
  lat: number;
  lon: number;
  active?: boolean;
  alive?: boolean;
}

export interface GlobeAttack {
  id: string | number; // change to retrigger
  color: string;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
}

const R = 2;

// Device performance profiling — we tune geometry detail, particle/ring counts
// and the renderer pixel ratio to the device so the additive-glow strike stays
// at a stable frame rate. Overdraw from the additive layers scales with the
// pixel count, so capping DPR is the single biggest win on high-DPR phones.
function detectTier(): "low" | "mid" | "high" {
  if (typeof window === "undefined") return "high";
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ||
    (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 768px)").matches);
  if (!isMobile) return "high";
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const dpr = window.devicePixelRatio || 1;
  // Constrained phones: few cores / little RAM, or very high-DPR panels that
  // multiply overdraw (e.g. dpr 3 flagships pushing 9x the fragments).
  if (cores <= 4 || mem <= 3 || dpr >= 2.5) return "low";
  return "mid";
}

const TIER = detectTier();
const IS_MOBILE = TIER !== "high";

// Per-tier level-of-detail + renderer pixel-ratio caps.
const LOD = {
  low:  { earthSeg: 32, atmoSeg: 20, tubeSeg: 22, tubeRad: 5, ringSeg: 20, glowSeg: 8,  ringCount: 2, dprCap: 1.2 },
  mid:  { earthSeg: 44, atmoSeg: 24, tubeSeg: 30, tubeRad: 6, ringSeg: 28, glowSeg: 10, ringCount: 2, dprCap: 1.5 },
  high: { earthSeg: 64, atmoSeg: 48, tubeSeg: 64, tubeRad: 8, ringSeg: 40, glowSeg: 16, ringCount: 3, dprCap: 1.75 },
}[TIER];

// Convert lat/lon (degrees) to a point on a sphere of radius r.
// Tuned to line up with the equirectangular texture we ship.
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function Marker({ player }: { player: GlobePlayer }) {
  const pos = useMemo(() => latLonToVec3(player.lat, player.lon, R * 1.01), [player.lat, player.lon]);
  const haloRef = useRef<THREE.Mesh>(null);
  const dead = player.alive === false;
  const col = dead ? "#6b7280" : player.color;

  useFrame(({ clock }) => {
    if (!haloRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = player.active ? 1 + Math.sin(t * 4) * 0.35 : 1 + Math.sin(t * 2) * 0.12;
    haloRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={pos}>
      {/* core dot */}
      <mesh>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color={col} toneMapped={false} />
      </mesh>
      {/* glow halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.11, LOD.glowSeg, LOD.glowSeg]} />
        <meshBasicMaterial color={col} transparent opacity={dead ? 0.15 : 0.35} toneMapped={false} />
      </mesh>
      {/* beacon beam pointing outward */}
      {!dead && (
        <mesh position={pos.clone().normalize().multiplyScalar(0.18)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize())}>
          <cylinderGeometry args={[0.008, 0.03, 0.35, 6]} />
          <meshBasicMaterial color={col} transparent opacity={player.active ? 0.8 : 0.4} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

// Cinematic strike: a launch flash, a glowing comet arcing to the target, then
// a layered impact — flash pop, staggered shockwave rings and a rising light
// column. Loops while mounted. All glow layers use additive blending so the
// energy reads bright against the dark earth.
function Attack({ attack }: { attack: GlobeAttack }) {
  const { curve, startPos, endPos, endNormal } = useMemo(() => {
    const start = latLonToVec3(attack.fromLat, attack.fromLon, R * 1.02);
    const end = latLonToVec3(attack.toLat, attack.toLon, R * 1.02);
    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(R * (1.35 + start.distanceTo(end) * 0.12));
    const c = new THREE.QuadraticBezierCurve3(start, mid, end);
    return { curve: c, startPos: start, endPos: end, endNormal: end.clone().normalize() };
  }, [attack.fromLat, attack.fromLon, attack.toLat, attack.toLon]);

  const trailGeom = useMemo(() => new THREE.TubeGeometry(curve, LOD.tubeSeg, 0.02, LOD.tubeRad, false), [curve]);

  const headRef = useRef<THREE.Mesh>(null);
  const headGlowRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const launchRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const columnRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const ring0 = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const startT = useRef<number | null>(null);
  const col = attack.color;

  const surfaceQuat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), endNormal),
    [endNormal],
  );
  // Column stands up along the surface normal (cylinder default axis is Y).
  const columnQuat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), endNormal),
    [endNormal],
  );
  const columnPos = useMemo(() => endPos.clone().add(endNormal.clone().multiplyScalar(0.28)), [endPos, endNormal]);

  const setOpacity = (m: THREE.Mesh | null, o: number) => {
    if (m) (m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, o);
  };

  useFrame(({ clock }) => {
    if (startT.current === null) startT.current = clock.getElapsedTime();
    const CYCLE = 2.4;
    const local = (clock.getElapsedTime() - startT.current) % CYCLE;
    const FLIGHT_END = 1.1;
    const flight = Math.min(1, local / FLIGHT_END); // 0..1 projectile travel
    const burst = local > FLIGHT_END ? (local - FLIGHT_END) / (CYCLE - FLIGHT_END) : 0; // 0..1

    // launch flash at origin — bright pop as the projectile leaves
    if (launchRef.current) {
      const l = Math.max(0, 1 - local / 0.28);
      launchRef.current.visible = l > 0;
      launchRef.current.scale.setScalar(0.06 + (1 - l) * 0.22);
      setOpacity(launchRef.current, l * 0.9);
    }

    // projectile head + glow
    const headVisible = flight < 1 && burst === 0;
    if (headRef.current) {
      const p = curve.getPoint(flight);
      headRef.current.position.copy(p);
      headRef.current.visible = headVisible;
      headRef.current.scale.setScalar(0.9 + Math.sin(local * 26) * 0.12);
      if (headGlowRef.current) {
        headGlowRef.current.position.copy(p);
        headGlowRef.current.visible = headVisible;
        headGlowRef.current.scale.setScalar(1 + Math.sin(local * 14) * 0.25);
      }
    }

    // trail brightens during flight, snaps out on impact
    if (trailRef.current) {
      setOpacity(trailRef.current, flight < 1 ? 0.25 + flight * 0.55 : Math.max(0, 0.8 - burst * 4));
    }

    // target reticle pulses during flight to telegraph impact, hides on burst
    if (reticleRef.current) {
      const on = burst === 0;
      reticleRef.current.visible = on;
      if (on) {
        reticleRef.current.scale.setScalar(1.1 + Math.sin(local * 9) * 0.18);
        setOpacity(reticleRef.current, 0.3 + flight * 0.5);
      }
    }

    // impact flash — quick bright pop at the moment of contact
    if (flashRef.current) {
      const f = burst > 0 ? Math.max(0, 1 - burst / 0.25) : 0;
      flashRef.current.visible = f > 0;
      flashRef.current.scale.setScalar(0.08 + (1 - f) * 0.4);
      setOpacity(flashRef.current, f);
    }

    // staggered shockwave rings expanding across the surface
    const rings = [ring0.current, ring1.current, ring2.current];
    const delays = [0, 0.12, 0.26];
    rings.forEach((rm, i) => {
      if (!rm) return;
      const b = burst - delays[i];
      const on = b > 0 && b < 0.85;
      rm.visible = on;
      if (on) {
        rm.scale.setScalar(0.15 + b * 2.2);
        setOpacity(rm, 0.85 * (1 - b / 0.85));
      }
    });

    // rising light column — a beam of energy erupting from the impact
    if (columnRef.current) {
      const b = burst;
      const on = b > 0 && b < 0.5;
      columnRef.current.visible = on;
      if (on) {
        const grow = b / 0.5;
        columnRef.current.scale.set(1 - grow * 0.4, 0.3 + grow * 1.4, 1 - grow * 0.4);
        setOpacity(columnRef.current, 0.8 * (1 - grow));
      }
    }
  });

  return (
    <group>
      {/* launch flash */}
      <mesh ref={launchRef} position={startPos} visible={false}>
        <sphereGeometry args={[0.5, LOD.glowSeg, LOD.glowSeg]} />
        <meshBasicMaterial color={col} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* arc trail */}
      <mesh ref={trailRef}>
        <primitive object={trailGeom} attach="geometry" />
        <meshBasicMaterial color={col} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* comet head + soft glow */}
      <mesh ref={headGlowRef} visible={false}>
        <sphereGeometry args={[0.13, LOD.glowSeg, LOD.glowSeg]} />
        <meshBasicMaterial color={col} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={headRef} visible={false}>
        <sphereGeometry args={[0.055, LOD.glowSeg, LOD.glowSeg]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* target reticle before impact */}
      <mesh ref={reticleRef} position={endPos} quaternion={surfaceQuat} visible={false}>
        <ringGeometry args={[0.09, 0.12, LOD.ringSeg]} />
        <meshBasicMaterial color={col} transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* impact flash */}
      <mesh ref={flashRef} position={endPos} visible={false}>
        <sphereGeometry args={[0.4, LOD.glowSeg, LOD.glowSeg]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* shockwave rings flat on the surface */}
      {[ring0, ring1, ring2].slice(0, LOD.ringCount).map((ref, i) => (
        <mesh key={i} ref={ref} position={endPos} quaternion={surfaceQuat} visible={false}>
          <ringGeometry args={[0.11, 0.16, LOD.ringSeg]} />
          <meshBasicMaterial color={col} transparent opacity={0.9} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}

      {/* rising light column */}
      <mesh ref={columnRef} position={columnPos} quaternion={columnQuat} visible={false}>
        <cylinderGeometry args={[0.04, 0.11, 0.55, 16, 1, true]} />
        <meshBasicMaterial color={col} transparent opacity={0.7} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

const FOCUS_DIR = new THREE.Vector3(0, 0.28, 1).normalize();

// Respect the OS "reduce motion" setting — when on we skip the sweeping camera
// travel and cut straight to the framed victim so no vestibular-triggering
// movement plays.
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Total length of the cinematic sweep, plus a brief settle where the camera
// holds on the victim before the readout is fully legible.
const FLYOVER_DUR = 5.0;

// Base orientation applied to the earth group; lat/lon markers live inside it,
// so the flyover camera applies the same rotation to aim at real world points.
const BASE_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, 0, 0.05));

// Cinematic camera that skims low over the globe from the attacker's location to
// the victim's, then settles framing the victim so its readout reads as "here".
function FlyoverCamera({ attack }: { attack: GlobeAttack }) {
  const { camera } = useThree();
  const startT = useRef<number | null>(null);
  const lookTarget = useRef(new THREE.Vector3());
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const { fromDir, toDir, toPoint, qFull } = useMemo(() => {
    const f = latLonToVec3(attack.fromLat, attack.fromLon, 1).applyQuaternion(BASE_QUAT).normalize();
    const t = latLonToVec3(attack.toLat, attack.toLon, 1).applyQuaternion(BASE_QUAT).normalize();
    return {
      fromDir: f,
      toDir: t,
      toPoint: t.clone().multiplyScalar(R),
      qFull: new THREE.Quaternion().setFromUnitVectors(f, t),
    };
  }, [attack.fromLat, attack.fromLon, attack.toLat, attack.toLon]);

  const qIdentity = useMemo(() => new THREE.Quaternion(), []);
  // Scratch objects reused every frame so the sweep allocates nothing (no GC
  // hitches → consistently smooth motion).
  const qCur = useRef(new THREE.Quaternion());
  const qLook = useRef(new THREE.Quaternion());
  const curDir = useRef(new THREE.Vector3());
  const lookDir = useRef(new THREE.Vector3());
  const settledFov = useRef(false);

  useFrame(({ clock }) => {
    if (startT.current === null) startT.current = clock.getElapsedTime();
    const cam = camera as THREE.PerspectiveCamera;

    // Reduced motion: pin the camera on the framed victim, no sweep.
    if (reduced) {
      cam.up.set(0, 1, 0);
      cam.position.copy(toDir).multiplyScalar(3.55);
      lookTarget.current.copy(toPoint);
      cam.lookAt(lookTarget.current);
      if (!settledFov.current && "fov" in cam) {
        cam.fov = 40;
        cam.updateProjectionMatrix();
        settledFov.current = true;
      }
      return;
    }

    const elapsed = clock.getElapsedTime() - startT.current;
    // Travel eases to a stop at ~80% of the clip, then holds on the victim for a
    // legibility beat so the readout lands on a still, precisely framed frame.
    const raw = Math.min(1, elapsed / (FLYOVER_DUR * 0.8));
    // easeInOutCubic — smooth filmic accel/decel.
    const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;

    // Sub-satellite point: exact position along the great circle between the two
    // real-world locations. slerp of the shortest-arc quaternion keeps it precise.
    qCur.current.slerpQuaternions(qIdentity, qFull, t);
    curDir.current.copy(fromDir).applyQuaternion(qCur.current).normalize();

    // Look slightly ahead along the same path for a sense of travel, easing the
    // lead to zero so the camera lands looking dead-on the victim at t = 1.
    const lead = 0.14 * (1 - t);
    qLook.current.slerpQuaternions(qIdentity, qFull, Math.min(1, t + lead));
    lookDir.current.copy(fromDir).applyQuaternion(qLook.current).normalize();

    // Altitude arc: high establishing shot → low skim at mid-flight → tight,
    // precise frame on arrival.
    const radius = 4.9 - 1.4 * t - Math.sin(t * Math.PI) * 0.62;
    cam.position.copy(curDir.current).multiplyScalar(radius);

    // Look target rides the surface and, because lookDir === toDir at t = 1,
    // resolves exactly onto the victim point (toPoint) with no drift.
    lookTarget.current.copy(lookDir.current).multiplyScalar(R);
    cam.up.set(0, 1, 0);
    cam.lookAt(lookTarget.current);

    // Gentle push-in (dolly-zoom) narrows the field of view as we close on the
    // target — adds cinematic weight without moving the landing point.
    if ("fov" in cam) {
      cam.fov = 52 - 13 * t;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

function EarthMesh({ players, attack, attackFocus = false, flyover = false }: { players: GlobePlayer[]; attack?: GlobeAttack | null; attackFocus?: boolean; flyover?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, earthTex);
  const targetQuat = useRef(new THREE.Quaternion());

  // Local direction we want facing the camera during an attack (midpoint of arc).
  const focusVec = useMemo(() => {
    if (!attack) return null;
    const a = latLonToVec3(attack.fromLat, attack.fromLon, 1);
    const b = latLonToVec3(attack.toLat, attack.toLon, 1);
    return a.add(b).normalize();
  }, [attack]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    // During a fly-over the camera moves instead of the earth — hold it still.
    if (flyover && attack) return;
    if (attack && focusVec) {
      // Smoothly rotate the earth so the strike faces the camera and hold it.
      targetQuat.current.setFromUnitVectors(focusVec, FOCUS_DIR);
      g.quaternion.slerp(targetQuat.current, Math.min(1, delta * (attackFocus ? 4.4 : 2.6)));
    } else {
      g.rotation.y += delta * 0.06;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.35, 0, 0.05]} scale={attackFocus && !flyover ? 1.18 : 1}>

      <mesh>
        <sphereGeometry args={[R, LOD.earthSeg, LOD.earthSeg]} />
        <meshStandardMaterial
          map={texture}
          emissive={new THREE.Color("#0a2a33")}
          emissiveMap={texture}
          emissiveIntensity={0.6}
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* inner atmosphere haze */}
      <mesh scale={1.045}>
        <sphereGeometry args={[R, LOD.atmoSeg, LOD.atmoSeg]} />
        <meshBasicMaterial color="#00bcd4" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      {/* fresnel rim-light shell — soft cyan halo that reads as atmosphere */}
      <mesh scale={1.14}>
        <sphereGeometry args={[R, LOD.atmoSeg, LOD.atmoSeg]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uColor: { value: new THREE.Color("#00bcd4") },
            uPower: { value: 2.4 },
            uIntensity: { value: 0.9 },
          }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vViewDir;
            void main() {
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vViewDir = normalize(-mv.xyz);
              gl_Position = projectionMatrix * mv;
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vViewDir;
            uniform vec3 uColor;
            uniform float uPower;
            uniform float uIntensity;
            void main() {
              float f = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
              gl_FragColor = vec4(uColor * f * uIntensity, f);
            }
          `}
        />
      </mesh>
      {players.map((p) => (
        <Marker key={p.id} player={p} />
      ))}
      {attack && <Attack key={attack.id} attack={attack} />}
    </group>
  );
}

// Deep-space starfield backdrop — additive dust of pinpoint stars so the
// globe sits in a real void rather than a flat black canvas.
function Starfield() {
  const { positions, sizes } = useMemo(() => {
    const count = IS_MOBILE ? 500 : 1400;
    const pos = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Uniform points on a large sphere so stars surround the globe.
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 30 + Math.random() * 20;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      s[i] = 0.6 + Math.random() * 1.8;
    }
    return { positions: pos, sizes: s };
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.005; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        sizeAttenuation
        color="#cfe8ff"
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

export default function Globe({
  players,
  attack,
  className,
  attackFocus = false,
  flyover = false,
}: {
  players: GlobePlayer[];
  attack?: GlobeAttack | null;
  className?: string;
  attackFocus?: boolean;
  flyover?: boolean;
}) {
  const flying = flyover && !!attack;
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, attackFocus ? 3.75 : 5.4], fov: flying ? 46 : attackFocus ? 34 : 42 }}
        dpr={[1, LOD.dprCap]}
        gl={{ antialias: !IS_MOBILE, alpha: true, powerPreference: "high-performance" }}
        frameloop="always"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 3, 5]} intensity={1.1} color="#cfeeff" />
        <pointLight position={[-4, -2, -3]} intensity={0.5} color="#f5b800" />
        <Suspense fallback={null}>
          <Starfield />
          <EarthMesh players={players} attack={attack} attackFocus={attackFocus} flyover={flyover} />
          {flying && attack && <FlyoverCamera key={attack.id} attack={attack} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
