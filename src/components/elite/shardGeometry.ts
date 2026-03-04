import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

/**
 * Build a jagged polyhedron shard from a seed + radius.
 * Shared by ClusterExplosion, DebrisSystem, and PhysicsRocks.
 */
export function buildShard(
  seed: number,
  radius: number,
  vertRange = 6,
  seedOffset = 0.3,
  seedMul = 104729
): { geo: THREE.BufferGeometry; edges: Float32Array } {
  const rng = (i: number) => {
    let x = Math.sin(seed * 7919 + i * seedMul + seedOffset) * seedMul;
    return x - Math.floor(x);
  };
  const numVerts = 5 + Math.floor(rng(0) * vertRange);
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < numVerts; i++) {
    const y = 1 - (i / (numVerts - 1)) * 2;
    const ry = Math.sqrt(1 - y * y);
    const theta = (2 * Math.PI * i) / 1.618033988749895 + rng(i + 10) * 1.2;
    const r = radius * (0.4 + rng(i + 30) * 0.6);
    verts.push(new THREE.Vector3(
      Math.cos(theta) * ry * r, y * r * (0.4 + rng(i + 50) * 0.6), Math.sin(theta) * ry * r
    ));
  }
  const geo = new ConvexGeometry(verts);
  geo.computeVertexNormals();
  const edgesGeo = new THREE.EdgesGeometry(geo, 1);
  const arr = new Float32Array(edgesGeo.attributes.position.array);
  edgesGeo.dispose();
  return { geo, edges: arr };
}

/**
 * Build a polyhedron for rocks (slightly different parameterization).
 */
export function buildPolyhedron(seed: number, radius: number): { geo: THREE.BufferGeometry; edges: Float32Array } {
  const rng = (i: number) => {
    let x = Math.sin(seed * 9301 + i * 49297 + 0.1) * 49297;
    return x - Math.floor(x);
  };
  // Fewer vertices → cleaner, more iconic shapes; still varied (4–8)
  const numVerts = 4 + Math.floor(rng(0) * 5);
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < numVerts; i++) {
    const y = 1 - (i / (numVerts - 1)) * 2;
    const ry = Math.sqrt(1 - y * y);
    const theta = (2 * Math.PI * i) / 1.618033988749895 + rng(i + 20) * 1.0;
    const r = radius * (0.5 + rng(i + 50) * 0.7);
    verts.push(new THREE.Vector3(
      Math.cos(theta) * ry * r, y * r * (0.5 + rng(i + 70) * 0.7), Math.sin(theta) * ry * r
    ));
  }
  const geo = new ConvexGeometry(verts);
  // Varied proportions: some flat, some elongated, some compact
  geo.scale(0.7 + rng(100) * 0.6, 0.4 + rng(101) * 0.6, 0.7 + rng(102) * 0.6);
  geo.computeVertexNormals();
  const edgesGeo = new THREE.EdgesGeometry(geo, 1);
  const arr = new Float32Array(edgesGeo.attributes.position.array);
  edgesGeo.dispose();
  return { geo, edges: arr };
}
