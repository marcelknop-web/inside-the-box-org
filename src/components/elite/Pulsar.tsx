import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Distant pulsar that periodically emits powerful beams.
 * Realistic: a small bright core with two opposing relativistic jets
 * that sweep across the scene as the pulsar rotates.
 */

const PULSE_INTERVAL = 45; // seconds between pulses
const PULSE_DURATION = 6;  // seconds the beam is active
const BEAM_LENGTH = 600;
const BEAM_WIDTH = 0.8;
const CORE_SIZE = 1.2;

// Position far away so it looks distant
const PULSAR_POS = new THREE.Vector3(-200, 60, -350);

export function Pulsar() {
  const coreRef = useRef<THREE.Points>(null!);
  const beamRef = useRef<THREE.Mesh>(null!);
  const beam2Ref = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Points>(null!);
  const elapsed = useRef(Math.random() * PULSE_INTERVAL); // random start offset

  // Core point
  const corePos = useMemo(() => new Float32Array([PULSAR_POS.x, PULSAR_POS.y, PULSAR_POS.z]), []);
  const coreSize = useMemo(() => new Float32Array([CORE_SIZE]), []);
  const coreColor = useMemo(() => new Float32Array([0.7, 0.85, 1.0]), []);

  // Glow halo particles around core
  const glowCount = 12;
  const glowPos = useMemo(() => {
    const arr = new Float32Array(glowCount * 3);
    for (let i = 0; i < glowCount; i++) {
      const a = (i / glowCount) * Math.PI * 2;
      const r = 1.5 + Math.random() * 1.0;
      arr[i * 3] = PULSAR_POS.x + Math.cos(a) * r;
      arr[i * 3 + 1] = PULSAR_POS.y + Math.sin(a) * r;
      arr[i * 3 + 2] = PULSAR_POS.z + (Math.random() - 0.5) * 0.5;
    }
    return arr;
  }, []);
  const glowSizes = useMemo(() => {
    const arr = new Float32Array(glowCount);
    for (let i = 0; i < glowCount; i++) arr[i] = 0.3 + Math.random() * 0.5;
    return arr;
  }, []);

  // Beam geometry – thin cylinder for each jet
  const beamGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(BEAM_WIDTH * 0.15, BEAM_WIDTH, BEAM_LENGTH, 6, 1, true);
    geo.translate(0, BEAM_LENGTH / 2, 0);
    return geo;
  }, []);

  // Beam material with custom shader for realistic falloff
  const beamMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.4, 0.7, 1.0),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  const beamMat2 = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.4, 0.7, 1.0),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const cycle = elapsed.current % PULSE_INTERVAL;
    const active = cycle < PULSE_DURATION;

    // Slow rotation of the pulsar axis
    const rotAngle = elapsed.current * 0.08;

    // Pulse intensity envelope: smooth ramp up, hold, ramp down
    let intensity = 0;
    if (active) {
      const t = cycle / PULSE_DURATION;
      // Smooth bell curve
      intensity = Math.sin(t * Math.PI);
      // Add rhythmic pulsing within the burst
      intensity *= 0.7 + 0.3 * Math.sin(cycle * 12);
    }

    // Core brightness
    if (coreRef.current) {
      const sArr = coreRef.current.geometry.attributes.size.array as Float32Array;
      sArr[0] = CORE_SIZE + intensity * 4.0;
      coreRef.current.geometry.attributes.size.needsUpdate = true;
      (coreRef.current.material as THREE.PointsMaterial).opacity = 0.3 + intensity * 0.7;
    }

    // Glow halo
    if (glowRef.current) {
      (glowRef.current.material as THREE.PointsMaterial).opacity = 0.08 + intensity * 0.35;
    }

    // Beam jets
    if (beamRef.current && beam2Ref.current) {
      beamMat.opacity = intensity * 0.12;
      beamMat2.opacity = intensity * 0.12;

      // Beam 1: points "up" along rotated axis
      beamRef.current.position.copy(PULSAR_POS);
      beamRef.current.rotation.set(0, 0, rotAngle);

      // Beam 2: opposite direction
      beam2Ref.current.position.copy(PULSAR_POS);
      beam2Ref.current.rotation.set(Math.PI, 0, rotAngle);
    }
  });

  return (
    <group>
      {/* Core star */}
      <points ref={coreRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[corePos, 3]} />
          <bufferAttribute attach="attributes-size" args={[coreSize, 1]} />
          <bufferAttribute attach="attributes-color" args={[coreColor, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          transparent
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.3}
        />
      </points>

      {/* Glow halo */}
      <points ref={glowRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowPos, 3]} />
          <bufferAttribute attach="attributes-size" args={[glowSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          color={new THREE.Color(0.5, 0.75, 1.0)}
          transparent
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.08}
        />
      </points>

      {/* Beam jet 1 */}
      <mesh ref={beamRef} geometry={beamGeo} material={beamMat} frustumCulled={false} />

      {/* Beam jet 2 (opposite) */}
      <mesh ref={beam2Ref} geometry={beamGeo} material={beamMat2} frustumCulled={false} />
    </group>
  );
}
