import * as THREE from 'three';

export function createImpeller(): THREE.Group {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2f78b7, roughness: 0.28, metalness: 0.65 });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.5, 32), metal);
  hub.rotation.z = Math.PI / 2;
  group.add(hub);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 24), new THREE.MeshStandardMaterial({ color: 0x6f7378, roughness: 0.35, metalness: 0.85 }));
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);
  for (let i = 0; i < 8; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.18), metal);
    blade.position.set(0, Math.sin(i * Math.PI / 4) * 0.42, Math.cos(i * Math.PI / 4) * 0.42);
    blade.rotation.x = i * Math.PI / 4 + 0.7;
    blade.rotation.z = 0.45;
    group.add(blade);
  }
  return group;
}
