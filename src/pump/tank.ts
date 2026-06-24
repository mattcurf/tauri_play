// SPDX-License-Identifier: Apache-2.0

import * as THREE from 'three';
import type { TankControls, TankTelemetry } from '../sim/tank';

const TANK_R = 1.6;
const TANK_H = 3.2;
const TANK_BASE_Y = 0;

export interface TankModel {
  group: THREE.Group;
  update(telemetry: TankTelemetry, controls: TankControls): void;
}

export function createTankModel(): TankModel {
  const group = new THREE.Group();

  const padMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a9a92,
    roughness: 0.95,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 0.15, 48),
    padMaterial
  );
  pad.position.y = TANK_BASE_Y - 0.075;
  pad.renderOrder = 1;
  group.add(pad);

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(TANK_R, TANK_R, TANK_H, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xdddee2,
      roughness: 0.35,
      metalness: 0.85,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  shell.position.y = TANK_BASE_Y + TANK_H / 2;
  shell.renderOrder = 1;
  group.add(shell);

  const bottomMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8babf,
    roughness: 0.5,
    metalness: 0.7,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(TANK_R, TANK_R, 0.05, 48),
    bottomMaterial
  );
  bottom.position.y = TANK_BASE_Y + 0.025;
  bottom.renderOrder = 1;
  group.add(bottom);

  const roof = new THREE.Mesh(
    new THREE.SphereGeometry(TANK_R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.4),
    new THREE.MeshStandardMaterial({ color: 0xc8cace, roughness: 0.4, metalness: 0.8 })
  );
  roof.position.y = TANK_BASE_Y + TANK_H;
  roof.scale.y = 0.45;
  group.add(roof);

  const vent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.35, 16),
    new THREE.MeshStandardMaterial({ color: 0x707075, roughness: 0.6, metalness: 0.7 })
  );
  vent.position.y = TANK_BASE_Y + TANK_H + 0.55;
  group.add(vent);

  const ventCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x707075, roughness: 0.6, metalness: 0.7 })
  );
  ventCap.position.y = TANK_BASE_Y + TANK_H + 0.78;
  group.add(ventCap);

  const hatch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.08, 24),
    new THREE.MeshStandardMaterial({ color: 0x5a5a5e, roughness: 0.5, metalness: 0.7 })
  );
  hatch.position.set(0.7, TANK_BASE_Y + TANK_H + 0.35, 0.3);
  group.add(hatch);

  for (let i = 1; i <= 3; i += 1) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(TANK_R + 0.005, 0.025, 8, 48),
      new THREE.MeshStandardMaterial({ color: 0x6e7075, roughness: 0.5, metalness: 0.7 })
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = TANK_BASE_Y + (TANK_H * i) / 4;
    group.add(band);
  }

  const liquidMaterial = new THREE.MeshStandardMaterial({
    color: 0x378add,
    roughness: 0.25,
    metalness: 0.1,
    transparent: true,
    opacity: 0.84,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(TANK_R - 0.04, TANK_R - 0.04, 1, 48),
    liquidMaterial
  );
  liquid.renderOrder = 2;
  group.add(liquid);

  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x4a90c2, roughness: 0.4, metalness: 0.7 });

  const inletVertical = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1.2, 16),
    pipeMat
  );
  inletVertical.position.set(-TANK_R - 0.6, TANK_BASE_Y + TANK_H + 0.4, 0);
  group.add(inletVertical);

  const inletHeaderY = TANK_BASE_Y + TANK_H + 0.95;
  const inletHeaderStartX = -TANK_R - 0.6;
  const inletHeaderLength = 0.7 * 1.25;
  const inletTankX = inletHeaderStartX + inletHeaderLength;
  const inletHoriz = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, inletHeaderLength, 16),
    pipeMat
  );
  inletHoriz.rotation.z = Math.PI / 2;
  inletHoriz.position.set((inletHeaderStartX + inletTankX) / 2, inletHeaderY, 0);
  group.add(inletHoriz);

  const inletRoofY = TANK_BASE_Y + TANK_H + 0.33;
  const inletDrop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, inletHeaderY - inletRoofY, 16),
    pipeMat
  );
  inletDrop.position.set(inletTankX, (inletHeaderY + inletRoofY) / 2, 0);
  group.add(inletDrop);

  const inletElbow = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 16),
    pipeMat
  );
  inletElbow.position.set(inletTankX, inletHeaderY, 0);
  group.add(inletElbow);

  const inletRoofCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.035, 10, 32),
    new THREE.MeshStandardMaterial({ color: 0x4a90c2, roughness: 0.42, metalness: 0.72 })
  );
  inletRoofCollar.rotation.x = Math.PI / 2;
  inletRoofCollar.position.set(inletTankX, inletRoofY, 0);
  group.add(inletRoofCollar);

  const inletInsideY = TANK_BASE_Y + TANK_H * 0.54;
  const inletInsideDrop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, inletRoofY - inletInsideY, 16),
    pipeMat
  );
  inletInsideDrop.position.set(inletTankX, (inletRoofY + inletInsideY) / 2, 0);
  group.add(inletInsideDrop);

  const inletInsideElbow = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 24, 16),
    pipeMat
  );
  inletInsideElbow.position.set(inletTankX, inletInsideY, 0);
  group.add(inletInsideElbow);

  const inletValveBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.32, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.6 })
  );
  inletValveBody.position.set(-TANK_R - 0.6, TANK_BASE_Y + TANK_H + 1.15, 0);
  group.add(inletValveBody);

  const inletHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x639922, roughness: 0.4 })
  );
  inletHandle.position.set(-TANK_R - 0.6, TANK_BASE_Y + TANK_H + 1.4, 0);
  group.add(inletHandle);

  const outletHoriz = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 1.2, 16),
    pipeMat
  );
  outletHoriz.rotation.z = Math.PI / 2;
  outletHoriz.position.set(TANK_R + 0.6, TANK_BASE_Y + 0.2, 0);
  group.add(outletHoriz);

  const outletValveBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.32, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.6 })
  );
  outletValveBody.position.set(TANK_R + 0.95, TANK_BASE_Y + 0.2, 0);
  group.add(outletValveBody);

  const outletHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x639922, roughness: 0.4 })
  );
  outletHandle.position.set(TANK_R + 0.95, TANK_BASE_Y + 0.45, 0);
  group.add(outletHandle);

  const ltBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.5, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 })
  );
  ltBracket.position.set(0, TANK_BASE_Y + TANK_H + 0.1, TANK_R + 0.1);
  group.add(ltBracket);

  const ltBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.22, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xe8a317, roughness: 0.6 })
  );
  ltBox.position.set(0, TANK_BASE_Y + TANK_H + 0.35, TANK_R + 0.18);
  group.add(ltBox);

  const conduit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, TANK_H, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 })
  );
  conduit.position.set(0.15, TANK_BASE_Y + TANK_H / 2, TANK_R + 0.05);
  group.add(conduit);

  const ladderMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.6, metalness: 0.5 });
  for (const x of [-0.2, 0.2]) {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, TANK_H, 8),
      ladderMat
    );
    rail.position.set(x, TANK_BASE_Y + TANK_H / 2, -TANK_R - 0.08);
    group.add(rail);
  }
  for (let i = 0; i < 10; i += 1) {
    const rung = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.4, 8),
      ladderMat
    );
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, TANK_BASE_Y + 0.2 + i * 0.32, -TANK_R - 0.08);
    group.add(rung);
  }

  for (const pct of [90, 10]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(TANK_R + 0.04, 0.012, 6, 48),
      new THREE.MeshBasicMaterial({ color: 0xa32d2d })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = TANK_BASE_Y + pct / 100 * TANK_H;
    group.add(ring);
  }

  function setHandle(handle: THREE.Mesh, open: boolean): void {
    handle.rotation.y = open ? 0 : Math.PI / 2;
    (handle.material as THREE.MeshStandardMaterial).color.set(open ? 0x639922 : 0xa32d2d);
  }

  return {
    group,
    update(telemetry, controls) {
      const h = Math.max(0.001, (telemetry.levelPct / 100) * (TANK_H - 0.1));
      liquid.scale.y = h;
      liquid.position.y = TANK_BASE_Y + 0.05 + h / 2;
      liquidMaterial.opacity = 0.82 + Math.sin(performance.now() / 600) * 0.04;
      setHandle(inletHandle, controls.inletOpen);
      setHandle(outletHandle, controls.outletOpen);
    },
  };
}
