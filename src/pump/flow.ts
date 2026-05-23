import * as THREE from 'three';

export class FlowParticles {
  readonly points: THREE.Points;
  private positions: Float32Array;
  private phase = 0;
  constructor() {
    const count = 120;
    this.positions = new Float32Array(count * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.points = new THREE.Points(geom, new THREE.PointsMaterial({ color: 0x54b7ff, size: 0.055, transparent: true, opacity: 0.85 }));
  }
  update(dt: number, flow01: number): void {
    this.phase = (this.phase + dt * (0.15 + flow01 * 1.8)) % 1;
    const count = this.positions.length / 3;
    for (let i = 0; i < count; i++) {
      const t = (i / count + this.phase) % 1;
      if (i < count / 2) {
        this.positions[i * 3] = -3.0 + t * 2.2;
        this.positions[i * 3 + 1] = 0;
      } else {
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = 0.4 + t * 2.5;
      }
      this.positions[i * 3 + 2] = Math.sin(t * 31) * 0.04;
    }
    this.points.visible = flow01 > 0.02;
    (this.points.material as THREE.PointsMaterial).opacity = Math.max(0.12, flow01);
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}

export class CavitationBubbles {
  readonly points: THREE.Points;
  private positions: Float32Array;
  constructor() {
    const count = 42;
    this.positions = new Float32Array(count * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.points = new THREE.Points(geom, new THREE.PointsMaterial({ color: 0xe9fbff, size: 0.075, transparent: true, opacity: 0 }));
  }
  update(dt: number, intensity: number): void {
    for (let i = 0; i < this.positions.length / 3; i++) {
      const a = i * 1.7 + performance.now() * 0.003 + dt;
      const r = 0.18 + (i % 7) * 0.055;
      this.positions[i * 3] = Math.sin(a) * r;
      this.positions[i * 3 + 1] = Math.cos(a * 1.3) * r;
      this.positions[i * 3 + 2] = Math.sin(a * 0.7) * r;
    }
    this.points.visible = intensity > 0.01;
    (this.points.material as THREE.PointsMaterial).opacity = intensity * 0.85;
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
