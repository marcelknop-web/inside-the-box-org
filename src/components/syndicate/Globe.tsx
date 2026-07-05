import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
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

// Detect low-power / mobile devices once so we can dial back geometry detail,
// particle counts and pixel ratio to hold a stable frame rate.
const IS_MOBILE =
  typeof window !== "undefined" &&
  (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 768px)").matches));

// Level-of-detail knobs — coarser on mobile.
const LOD = {
  earthSeg: IS_MOBILE ? 40 : 64,
  atmoSeg: IS_MOBILE ? 24 : 48,
  tubeSeg: IS_MOBILE ? 28 : 64,
  tubeRad: IS_MOBILE ? 6 : 8,
  ringSeg: IS_MOBILE ? 24 : 40,
  glowSeg: IS_MOBILE ? 10 : 16,
  ringCount: IS_MOBILE ? 2 : 3,
};

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

function EarthMesh({ players, attack }: { players: GlobePlayer[]; attack?: GlobeAttack | null }) {
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
    if (attack && focusVec) {
      // Smoothly rotate the earth so the strike faces the camera and hold it.
      targetQuat.current.setFromUnitVectors(focusVec, FOCUS_DIR);
      g.quaternion.slerp(targetQuat.current, Math.min(1, delta * 2.6));
    } else {
      g.rotation.y += delta * 0.06;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.35, 0, 0.05]}>
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
      {/* atmosphere */}
      <mesh scale={1.06}>
        <sphereGeometry args={[R, LOD.atmoSeg, LOD.atmoSeg]} />
        <meshBasicMaterial color="#00bcd4" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      {players.map((p) => (
        <Marker key={p.id} player={p} />
      ))}
      {attack && <Attack key={attack.id} attack={attack} />}
    </group>
  );
}

export default function Globe({
  players,
  attack,
  className,
}: {
  players: GlobePlayer[];
  attack?: GlobeAttack | null;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        dpr={IS_MOBILE ? [1, 1.35] : [1, 1.75]}
        gl={{ antialias: !IS_MOBILE, alpha: true, powerPreference: "high-performance" }}
        frameloop="always"
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 3, 5]} intensity={1.1} color="#cfeeff" />
        <pointLight position={[-4, -2, -3]} intensity={0.5} color="#f5b800" />
        <Suspense fallback={null}>
          <EarthMesh players={players} attack={attack} />
        </Suspense>
      </Canvas>
    </div>
  );
}
