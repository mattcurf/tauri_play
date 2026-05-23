import * as THREE from 'three';

export function createMotor(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b7f79, roughness: 0.48, metalness: 0.55 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.7, 32), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.x = 1.75;
  group.add(body);
  for (let i = 0; i < 9; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.08, 0.08), bodyMat);
    fin.position.set(1.02 + i * 0.18, 0, 0.5);
    group.add(fin);
  }
  const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.35, 24), new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.35, metalness: 0.8 }));
  coupling.rotation.z = Math.PI / 2;
  coupling.position.x = 0.76;
  group.add(coupling);
  return group;
}
