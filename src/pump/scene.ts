// SPDX-License-Identifier: Apache-2.0

import * as THREE from 'three';
import type { PumpControls, PumpTelemetry } from '../sim/process';
import type { TankControls, TankTelemetry } from '../sim/tank';
import { applyAlarmColor, createTripRings } from './alarms';
import { createCasing } from './casing';
import { CavitationBubbles, FlowParticles } from './flow';
import { createImpeller } from './impeller';
import { createMotor } from './motor';
import { createPiping, setHandle } from './piping';
import { createTankModel } from './tank';

export interface VisualizationScene<TTelemetry, TControls> {
  update(telemetry: TTelemetry, controls: TControls, dtSeconds: number): void;
  render(): void;
  resize(): void;
  dispose(): void;
}

interface SceneModel<TTelemetry, TControls> {
  group: THREE.Group;
  update(telemetry: TTelemetry, controls: TControls, dtSeconds: number): void;
}

function createSceneView<TTelemetry, TControls>(
  container: HTMLElement,
  model: SceneModel<TTelemetry, TControls>,
  cameraStart: THREE.Vector3,
  cameraTarget: THREE.Vector3,
): VisualizationScene<TTelemetry, TControls> {
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.copy(cameraStart);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(8, 12, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.25);
  rim.position.set(-6, 4, -4);
  scene.add(rim);

  scene.add(model.group);

  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  const target = cameraTarget.clone();
  let azimuth = Math.atan2(camera.position.x, camera.position.z);
  let elevation = Math.atan2(camera.position.y - target.y, Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2));
  let radius = camera.position.distanceTo(target);

  function updateCamera(): void {
    camera.position.x = target.x + radius * Math.cos(elevation) * Math.sin(azimuth);
    camera.position.y = target.y + radius * Math.sin(elevation);
    camera.position.z = target.z + radius * Math.cos(elevation) * Math.cos(azimuth);
    camera.lookAt(target);
  }
  updateCamera();

  const onMouseDown = (e: MouseEvent) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  };
  const onMouseUp = () => { isDragging = false; };
  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    azimuth -= (e.clientX - prevX) * 0.008;
    elevation = Math.max(-0.3, Math.min(1.2, elevation + (e.clientY - prevY) * 0.008));
    prevX = e.clientX;
    prevY = e.clientY;
    updateCamera();
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    radius = Math.max(5, Math.min(20, radius + e.deltaY * 0.01));
    updateCamera();
  };
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging = true;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    azimuth -= (e.touches[0].clientX - prevX) * 0.008;
    elevation = Math.max(-0.3, Math.min(1.2, elevation + (e.touches[0].clientY - prevY) * 0.008));
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
    updateCamera();
  };
  const onTouchEnd = () => { isDragging = false; };

  renderer.domElement.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  renderer.domElement.addEventListener('touchstart', onTouchStart);
  renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
  renderer.domElement.addEventListener('touchend', onTouchEnd);

  return {
    update(telemetry, controls, dtSeconds) {
      model.update(telemetry, controls, dtSeconds);
    },
    render() { renderer.render(scene, camera); },
    resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    dispose() {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      disposeSceneGraph(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function disposeSceneGraph(root: THREE.Object3D): void {
  root.traverse((object) => {
    const renderable = object as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
    if (renderable.geometry) {
      renderable.geometry.dispose();
    }

    const material = renderable.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}

export function createTankScene(container: HTMLElement): VisualizationScene<TankTelemetry, TankControls> {
  const tank = createTankModel();
  return createSceneView(
    container,
    {
      group: tank.group,
      update: (telemetry, controls) => tank.update(telemetry, controls),
    },
    new THREE.Vector3(7, 5, 9),
    new THREE.Vector3(0, 1.5, 0),
  );
}

export function createPumpScene(container: HTMLElement): VisualizationScene<PumpTelemetry, PumpControls> {
  return createSceneView(
    container,
    createPumpModel(),
    new THREE.Vector3(5.9, 3.6, 6.4),
    new THREE.Vector3(0, 0.95, 0),
  );
}

function createPumpModel(): SceneModel<PumpTelemetry, PumpControls> {
  const group = new THREE.Group();
  group.position.y = 0.35;

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x252b31, roughness: 0.56, metalness: 0.65 });
  const padMat = new THREE.MeshStandardMaterial({ color: 0x8f928d, roughness: 0.9, transparent: true, opacity: 0.36, depthWrite: false });
  const flangeMat = new THREE.MeshStandardMaterial({ color: 0x6f7378, roughness: 0.42, metalness: 0.82 });
  const boltMat = new THREE.MeshStandardMaterial({ color: 0x1e2225, roughness: 0.34, metalness: 0.86 });

  const pad = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.16, 2.2), padMat);
  pad.position.set(-0.1, -0.52, 0);
  group.add(pad);

  for (const z of [-0.7, 0.7]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.18, 0.18), baseMat);
    rail.position.set(0.1, -0.34, z);
    group.add(rail);
  }
  for (const x of [-1.55, -0.15, 1.25, 2.55]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.62), baseMat);
    cross.position.set(x, -0.26, 0);
    group.add(cross);
  }

  const machine = new THREE.Group();
  group.add(machine);

  const piping = createPiping();
  group.add(piping.group);

  const casing = createCasing();
  const casingMaterials: THREE.MeshStandardMaterial[] = [];
  casing.traverse((object) => {
    const material = (object as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>).material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    for (const entry of materials) {
      if (entry instanceof THREE.MeshStandardMaterial) {
        casingMaterials.push(entry);
      }
    }
  });
  machine.add(casing);

  const impeller = createImpeller();
  machine.add(impeller);

  const blurMaterial = new THREE.MeshBasicMaterial({
    color: 0x64c7ff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const impellerBlur = new THREE.Mesh(new THREE.CircleGeometry(0.78, 80), blurMaterial);
  impellerBlur.rotation.y = Math.PI / 2;
  impellerBlur.renderOrder = 3;
  machine.add(impellerBlur);

  const motor = createMotor();
  machine.add(motor);

  const suctionFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 32), flangeMat);
  suctionFlange.rotation.z = Math.PI / 2;
  suctionFlange.position.set(-0.72, 0, 0);
  machine.add(suctionFlange);

  const dischargeFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 32), flangeMat);
  dischargeFlange.position.set(0, 0.78, 0);
  machine.add(dischargeFlange);

  for (const [x, z] of [[-0.42, -0.42], [-0.42, 0.42], [1.38, -0.42], [1.38, 0.42], [2.38, -0.42], [2.38, 0.42]] as const) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.34), baseMat);
    foot.position.set(x, -0.16, z);
    machine.add(foot);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 12), boltMat);
    bolt.position.set(x, -0.04, z);
    machine.add(bolt);
  }

  const flow = new FlowParticles();
  group.add(flow.points);

  const bubbles = new CavitationBubbles();
  machine.add(bubbles.points);

  const tripRings = createTripRings();
  tripRings.visible = false;
  group.add(tripRings);

  const suctionNeedle = createGaugeNeedle(-1.25, 0.55, 0x2f78b7);
  const dischargeNeedle = createGaugeNeedle(0.55, 2.55, 0xa32d2d);
  group.add(suctionNeedle, dischargeNeedle);

  const beaconMaterial = new THREE.MeshStandardMaterial({ color: 0x639922, roughness: 0.35, metalness: 0.25, emissive: 0x163400, emissiveIntensity: 0.7 });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), beaconMaterial);
  beacon.position.set(1.8, 0.72, 0);
  machine.add(beacon);

  function gaugeAngle(value: number, min: number, max: number): number {
    const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
    return THREE.MathUtils.lerp(Math.PI * 0.78, -Math.PI * 0.78, pct);
  }

  return {
    group,
    update(telemetry, controls, dtSeconds) {
      const dt = Math.min(0.05, Math.max(0, dtSeconds));
      const t = performance.now() / 1000;
      impeller.rotation.x = (impeller.rotation.x + (telemetry.rpm / 60) * Math.PI * 2 * dt) % (Math.PI * 2);
      impellerBlur.rotation.x = -impeller.rotation.x * 0.3;
      blurMaterial.opacity = telemetry.rpm > 120 ? 0.04 + Math.min(0.2, telemetry.rpm / 3600 * 0.2) : 0;

      flow.update(dt, telemetry.flow01);
      bubbles.update(dt, telemetry.cavitation01);
      setHandle(piping.handles.suction, controls.suctionOpen);
      setHandle(piping.handles.discharge, controls.dischargeOpen);

      suctionNeedle.rotation.z = gaugeAngle(telemetry.suctionPsi, -12, 18);
      dischargeNeedle.rotation.z = gaugeAngle(telemetry.dischargePsi, 0, 135);

      machine.position.z = Math.sin(t * 92) * telemetry.cavitation01 * 0.025;
      machine.rotation.x = Math.sin(t * 44) * Math.min(1, telemetry.load01) * telemetry.cavitation01 * 0.012;
      tripRings.visible = telemetry.status !== 'NORMAL';
      tripRings.rotation.z += dt * (1.5 + telemetry.load01);

      for (const material of casingMaterials) {
        applyAlarmColor(material, telemetry.status, t);
      }

      const beaconColor = telemetry.status === 'OVERLOAD'
        ? 0xa32d2d
        : telemetry.status === 'DEADHEAD'
          ? 0xe8a317
          : telemetry.status === 'CAVITATION'
            ? 0x2f78b7
            : 0x639922;
      beaconMaterial.color.setHex(beaconColor);
      beaconMaterial.emissive.setHex(telemetry.status === 'NORMAL' ? 0x163400 : beaconColor);
      beaconMaterial.emissiveIntensity = telemetry.status === 'OVERLOAD' && t % 0.5 < 0.25 ? 1.6 : 0.7;
    },
  };
}

function createGaugeNeedle(x: number, y: number, color: number): THREE.Group {
  const needleGroup = new THREE.Group();
  needleGroup.position.set(x, y, 0.205);

  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.2, 0.012),
    new THREE.MeshBasicMaterial({ color }),
  );
  needle.position.y = 0.07;
  needleGroup.add(needle);

  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.014, 16),
    new THREE.MeshBasicMaterial({ color: 0x222222 }),
  );
  pin.rotation.x = Math.PI / 2;
  needleGroup.add(pin);

  return needleGroup;
}
