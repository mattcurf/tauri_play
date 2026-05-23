import * as THREE from 'three';
import type { TankControls, TankTelemetry } from '../sim/tank';
import { createTankModel } from './tank';

export interface TankScene {
  update(telemetry: TankTelemetry, controls: TankControls): void;
  render(): void;
  resize(): void;
  dispose(): void;
}

export function createTankScene(container: HTMLElement): TankScene {
  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(7, 5, 9);

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

  const tank = createTankModel();
  scene.add(tank.group);

  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  const target = new THREE.Vector3(0, 1.5, 0);
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
    update(telemetry, controls) {
      tank.update(telemetry, controls);
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
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
