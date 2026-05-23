import * as THREE from 'three';

export interface ValveHandles { suction: THREE.Mesh; discharge: THREE.Mesh; }

function pipe(length: number, radius = 0.13): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 18), new THREE.MeshStandardMaterial({ color: 0x4a90c2, roughness: 0.42, metalness: 0.7 }));
  return mesh;
}

function valve(position: THREE.Vector3): { group: THREE.Group; handle: THREE.Mesh } {
  const group = new THREE.Group();
  group.position.copy(position);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.6 }));
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x639922, roughness: 0.4 }));
  handle.position.y = 0.3;
  group.add(body, handle);
  return { group, handle };
}

export function createPiping(): { group: THREE.Group; handles: ValveHandles; gauges: THREE.Group } {
  const group = new THREE.Group();
  const suction = pipe(2.1, 0.15);
  suction.rotation.z = Math.PI / 2;
  suction.position.set(-1.95, 0, 0);
  const discharge = pipe(2.1, 0.13);
  discharge.position.set(0, 2.0, 0);
  const elbow = pipe(1.0, 0.13);
  elbow.rotation.z = Math.PI / 2;
  elbow.position.set(0.45, 2.95, 0);
  group.add(suction, discharge, elbow);
  const xv202 = valve(new THREE.Vector3(-2.55, 0, 0));
  const xv201 = valve(new THREE.Vector3(0, 2.55, 0));
  group.add(xv202.group, xv201.group);

  const gauges = new THREE.Group();
  for (const [x, y] of [[-1.25, 0.55], [0.55, 2.55]]) {
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 32), new THREE.MeshStandardMaterial({ color: 0xf7f7ef, roughness: 0.4 }));
    face.rotation.x = Math.PI / 2;
    face.position.set(x, y, 0.16);
    gauges.add(face);
  }
  group.add(gauges);
  return { group, handles: { suction: xv202.handle, discharge: xv201.handle }, gauges };
}

export function setHandle(handle: THREE.Mesh, open: boolean): void {
  handle.rotation.z = open ? 0 : Math.PI / 2;
  (handle.material as THREE.MeshStandardMaterial).color.set(open ? 0x639922 : 0xa32d2d);
}
