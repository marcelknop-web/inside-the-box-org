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

function EarthMesh({ players, focusLon }: { players: GlobePlayer[]; focusLon?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, earthTex);
  const targetY = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (focusLon !== undefined) {
      // Rotate so the focused longitude faces the camera (-Z toward viewer).
      targetY.current = -(focusLon + 180) * (Math.PI / 180) - Math.PI / 2;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetY.current,
        Math.min(1, delta * 2.5),
      );
    } else {
      groupRef.current.rotation.y += delta * 0.06;
    }
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
    </group>
  );
}

export default function Globe({
  players,
  focusLon,
  className,
}: {
  players: GlobePlayer[];
  focusLon?: number;
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
          <EarthMesh players={players} focusLon={focusLon} />
        </Suspense>
      </Canvas>
    </div>
  );
}
