import * as THREE from 'three';
import type { PumpStatus } from '../sim/process';

export function createTripRings(): THREE.Group {
  const group = new THREE.Group();
  for (const [r, color] of [[0.26, 0xa32d2d], [0.18, 0xe8a317]] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.009, 6, 32), new THREE.MeshBasicMaterial({ color }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0.55, 2.55, 0.19);
    group.add(ring);
  }
  return group;
}

export function applyAlarmColor(material: THREE.MeshStandardMaterial, status: PumpStatus, t: number): void {
  if (status === 'OVERLOAD') material.emissive.setHex(t % 0.6 < 0.3 ? 0x7a160e : 0x250000);
  else if (status === 'DEADHEAD') material.emissive.setHex(0x3a1d00);
  else if (status === 'CAVITATION') material.emissive.setHex(0x003450);
  else material.emissive.setHex(0x000000);
}
