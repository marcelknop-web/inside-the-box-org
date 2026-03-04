import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Distant pulsar that periodically emits powerful beams.
 * Positioned relative to camera so it's always visible in the far background.
 */

const PULSE_INTERVAL = 45;
const PULSE_DURATION = 6;
const BEAM_LENGTH = 600;
const BEAM_WIDTH = 0.8;
const CORE_SIZE = 1.2;

// Offset from camera – far away, slightly above and to the left
const OFFSET = new THREE.Vector3(-180, 80, -300);

export function Pulsar() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);
  const coreRef = useRef<THREE.Points>(null!);
  const beamRef = useRef<THREE.Mesh>(null!);
  const beam2Ref = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Points>(null!);
  const elapsed = useRef(Math.random() * PULSE_INTERVAL);

  // Local-space positions (core at origin, glow around it)
  const corePos = useMemo(() => new Float32Array([0, 0, 0]), []);
  const coreSize = useMemo(() => new Float32Array([CORE_SIZE]), []);
  const coreColor = useMemo(() => new Float32Array([0.7, 0.85, 1.0]), []);

  const glowCount = 12;
  const glowPos = useMemo(() => {
    const arr = new Float32Array(glowCount * 3);
    for (let i = 0; i < glowCount; i++) {
      const a = (i / glowCount) * Math.PI * 2;
      const r = 1.5 + Math.random() * 1.0;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.sin(a) * r;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return arr;
  }, []);
  const glowSizes = useMemo(() => {
    const arr = new Float32Array(glowCount);
    for (let i = 0; i < glowCount; i++) arr[i] = 0.3 + Math.random() * 0.5;
    return arr;
  }, []);

  const beamGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(BEAM_WIDTH * 0.15, BEAM_WIDTH, BEAM_LENGTH, 6, 1, true);
    geo.translate(0, BEAM_LENGTH / 2, 0);
    return geo;
  }, []);

  const beamMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.4, 0.7, 1.0),
    transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);

  const beamMat2 = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.4, 0.7, 1.0),
    transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const cycle = elapsed.current % PULSE_INTERVAL;
    const active = cycle < PULSE_DURATION;

    // Track camera position so pulsar is always in the far background
    if (groupRef.current) {
      groupRef.current.position.set(
        camera.position.x + OFFSET.x,
        camera.position.y + OFFSET.y,
        camera.position.z + OFFSET.z,
      );
    }

    const rotAngle = elapsed.current * 0.08;

    let intensity = 0;
    if (active) {
      const t = cycle / PULSE_DURATION;
      intensity = Math.sin(t * Math.PI);
      intensity *= 0.7 + 0.3 * Math.sin(cycle * 12);
    }

    if (coreRef.current) {
      const sArr = coreRef.current.geometry.attributes.size.array as Float32Array;
      sArr[0] = CORE_SIZE + intensity * 4.0;
      coreRef.current.geometry.attributes.size.needsUpdate = true;
      (coreRef.current.material as THREE.PointsMaterial).opacity = 0.3 + intensity * 0.7;
    }

    if (glowRef.current) {
      (glowRef.current.material as THREE.PointsMaterial).opacity = 0.08 + intensity * 0.35;
    }

    if (beamRef.current && beam2Ref.current) {
      beamMat.opacity = intensity * 0.12;
      beamMat2.opacity = intensity * 0.12;
      beamRef.current.position.set(0, 0, 0);
      beamRef.current.rotation.set(0, 0, rotAngle);
      beam2Ref.current.position.set(0, 0, 0);
      beam2Ref.current.rotation.set(Math.PI, 0, rotAngle);
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={coreRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[corePos, 3]} />
          <bufferAttribute attach="attributes-size" args={[coreSize, 1]} />
          <bufferAttribute attach="attributes-color" args={[coreColor, 3]} />
        </bufferGeometry>
        <pointsMaterial vertexColors transparent sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.3} />
      </points>

      <points ref={glowRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowPos, 3]} />
          <bufferAttribute attach="attributes-size" args={[glowSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial color={new THREE.Color(0.5, 0.75, 1.0)} transparent sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.08} />
      </points>

      <mesh ref={beamRef} geometry={beamGeo} material={beamMat} frustumCulled={false} />
      <mesh ref={beam2Ref} geometry={beamGeo} material={beamMat2} frustumCulled={false} />
    </group>
  );
}
