import * as THREE from 'three';

export function createImpeller(): THREE.Group {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2f78b7, roughness: 0.24, metalness: 0.72 });
  const edgeMetal = new THREE.MeshStandardMaterial({ color: 0x8ed8ff, roughness: 0.18, metalness: 0.66 });

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.35, 0.5, 40), metal);
  hub.rotation.z = Math.PI / 2;
  group.add(hub);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), metal);
  nose.scale.x = 0.72;
  nose.position.x = -0.3;
  group.add(nose);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 24), new THREE.MeshStandardMaterial({ color: 0x6f7378, roughness: 0.35, metalness: 0.85 }));
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);

  for (const x of [-0.08, 0.08]) {
    const shroud = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.026, 12, 72), edgeMetal);
    shroud.rotation.y = Math.PI / 2;
    shroud.position.x = x;
    group.add(shroud);

    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 10, 48), edgeMetal);
    eye.rotation.y = Math.PI / 2;
    eye.position.x = x;
    group.add(eye);
  }

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.18, -0.045);
  bladeShape.bezierCurveTo(0.32, 0.05, 0.5, 0.14, 0.7, 0.1);
  bladeShape.lineTo(0.7, 0.24);
  bladeShape.bezierCurveTo(0.48, 0.31, 0.28, 0.18, 0.15, 0.035);
  bladeShape.lineTo(0.18, -0.045);
  const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 1,
  });

  for (let i = 0; i < 8; i++) {
    const bladeRoot = new THREE.Group();
    bladeRoot.rotation.x = i * Math.PI / 4;

    const blade = new THREE.Mesh(bladeGeometry, metal);
    blade.rotation.y = Math.PI / 2;
    blade.rotation.z = -0.12;
    bladeRoot.add(blade);

    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 8), edgeMetal);
    rib.rotation.z = Math.PI / 2;
    rib.rotation.y = Math.PI / 2;
    rib.position.set(-0.04, 0.11, 0.45);
    bladeRoot.add(rib);

    group.add(bladeRoot);
  }

  return group;
}
