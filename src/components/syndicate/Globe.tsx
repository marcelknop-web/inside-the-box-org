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
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={col} toneMapped={false} />
      </mesh>
      {/* glow halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial color={col} transparent opacity={dead ? 0.15 : 0.35} toneMapped={false} />
      </mesh>
      {/* beacon beam pointing outward */}
      {!dead && (
        <mesh position={pos.clone().normalize().multiplyScalar(0.18)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize())}>
          <cylinderGeometry args={[0.008, 0.03, 0.35, 8]} />
          <meshBasicMaterial color={col} transparent opacity={player.active ? 0.8 : 0.4} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

// Animated strike: a glowing projectile arcs from attacker to the target city,
// then bursts into an expanding impact ring. Loops while mounted.
function Attack({ attack }: { attack: GlobeAttack }) {
  const { curve, endPos, endNormal } = useMemo(() => {
    const start = latLonToVec3(attack.fromLat, attack.fromLon, R * 1.02);
    const end = latLonToVec3(attack.toLat, attack.toLon, R * 1.02);
    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(R * (1.35 + start.distanceTo(end) * 0.12));
    const c = new THREE.QuadraticBezierCurve3(start, mid, end);
    return { curve: c, endPos: end, endNormal: end.clone().normalize() };
  }, [attack.fromLat, attack.fromLon, attack.toLat, attack.toLon]);

  const trailGeom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
    return g;
  }, [curve]);

  const headRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Line>(null);
  const startT = useRef<number | null>(null);
  const col = attack.color;

  const ringQuat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), endNormal),
    [endNormal],
  );

  useFrame(({ clock }) => {
    if (startT.current === null) startT.current = clock.getElapsedTime();
    const CYCLE = 2.2;
    const local = (clock.getElapsedTime() - startT.current) % CYCLE;
    const flight = Math.min(1, local / 1.2); // 0..1 projectile travel
    const burst = Math.max(0, (local - 1.2) / 1.0); // 0..1 impact ring

    // projectile head
    if (headRef.current) {
      const p = curve.getPoint(flight);
      headRef.current.position.copy(p);
      const visible = flight < 1;
      headRef.current.visible = visible;
      headRef.current.scale.setScalar(0.9 + Math.sin(local * 20) * 0.15);
    }

    // trail fades in with the flight, out on burst
    if (trailRef.current) {
      const mat = trailRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = flight < 1 ? 0.35 + flight * 0.4 : Math.max(0, 0.75 - burst);
    }

    // impact ring
    if (ringRef.current) {
      const on = burst > 0 && burst < 1;
      ringRef.current.visible = on;
      if (on) {
        ringRef.current.scale.setScalar(0.2 + burst * 1.6);
        const mat = ringRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.9 * (1 - burst));
      }
    }
  });

  return (
    <group>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <line ref={trailRef as never}>
        <primitive object={trailGeom} attach="geometry" />
        <lineBasicMaterial color={col} transparent opacity={0.4} toneMapped={false} />
      </line>
      <mesh ref={headRef}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color={col} toneMapped={false} />
      </mesh>
      {/* impact ring at target, oriented flat to the surface */}
      <mesh ref={ringRef} position={endPos} quaternion={ringQuat} visible={false}>
        <ringGeometry args={[0.12, 0.18, 32]} />
        <meshBasicMaterial color={col} transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function EarthMesh({ players, attack }: { players: GlobePlayer[]; attack?: GlobeAttack | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, earthTex);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Always rotate slowly.
    groupRef.current.rotation.y += delta * 0.06;
  });

  return (
    <group ref={groupRef} rotation={[0.35, 0, 0.05]}>
      <mesh>
        <sphereGeometry args={[R, 64, 64]} />
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
        <sphereGeometry args={[R, 48, 48]} />
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
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
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
