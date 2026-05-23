import * as THREE from 'three';

export function createCasing(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xd7d9dd, roughness: 0.38, metalness: 0.78, transparent: true, opacity: 0.62, side: THREE.DoubleSide });
  const volute = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.24, 18, 56, Math.PI * 1.55), mat);
  volute.rotation.y = Math.PI / 2;
  volute.rotation.z = -0.55;
  group.add(volute);
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.16, 48, 1, false, Math.PI * 0.18, Math.PI * 1.55), mat);
  cover.rotation.z = Math.PI / 2;
  group.add(cover);
  const discharge = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 1.0, 24), mat);
  discharge.position.set(0, 1.0, 0);
  group.add(discharge);
  const suction = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 24), mat);
  suction.rotation.z = Math.PI / 2;
  suction.position.set(-0.72, 0, 0);
  group.add(suction);
  return group;
}
