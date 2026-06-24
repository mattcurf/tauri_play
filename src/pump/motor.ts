// SPDX-License-Identifier: Apache-2.0

import * as THREE from 'three';

export function createMotor(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b7f79, roughness: 0.48, metalness: 0.55 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.7, 32), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.x = 1.75;
  group.add(body);

  const endBellMat = new THREE.MeshStandardMaterial({ color: 0x2c5f5b, roughness: 0.44, metalness: 0.62 });
  for (const x of [0.9, 2.6]) {
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.18, 32), endBellMat);
    bell.rotation.z = Math.PI / 2;
    bell.position.x = x;
    group.add(bell);
  }

  for (let i = 0; i < 9; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.08, 0.08), bodyMat);
    fin.position.set(1.02 + i * 0.18, 0, 0.5);
    group.add(fin);
  }

  const terminalBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.26, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x2e6863, roughness: 0.52, metalness: 0.48 }),
  );
  terminalBox.position.set(1.65, 0.53, 0.08);
  group.add(terminalBox);

  const nameplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.02, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xd6c46d, roughness: 0.28, metalness: 0.7 }),
  );
  nameplate.position.set(1.65, -0.49, 0.12);
  group.add(nameplate);

  const fanCover = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.08, 32),
    new THREE.MeshStandardMaterial({ color: 0x233f42, roughness: 0.5, metalness: 0.7, transparent: true, opacity: 0.72 }),
  );
  fanCover.rotation.z = Math.PI / 2;
  fanCover.position.x = 2.76;
  group.add(fanCover);

  for (let i = 0; i < 8; i += 1) {
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.82, 0.018), new THREE.MeshStandardMaterial({ color: 0x1d3033, roughness: 0.45, metalness: 0.7 }));
    grille.rotation.x = i * Math.PI / 8;
    grille.position.x = 2.82;
    group.add(grille);
  }

  const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.35, 24), new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.35, metalness: 0.8 }));
  coupling.rotation.z = Math.PI / 2;
  coupling.position.x = 0.76;
  group.add(coupling);
  return group;
}
