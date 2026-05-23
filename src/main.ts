import './styles.css';
import { createHmiPanel } from './hmi/panel';
import { createTankScene, type TankScene } from './pump/scene';
import { TankProcess } from './sim/tank';

const viewport = document.querySelector<HTMLElement>('#tank-viewport');
const controlsRoot = document.querySelector<HTMLElement>('#controls-root');

if (!viewport || !controlsRoot) {
  throw new Error('Tank demo root elements were not found');
}

const tank = new TankProcess();
const hmi = createHmiPanel({
  viewport,
  controlsRoot,
  initialControls: tank.getControls(),
  onControlsChange: (partial) => tank.setControls(partial),
});
hmi.update(tank.getTelemetry(), tank.getControls());

let scene: TankScene;
try {
  scene = createTankScene(viewport);
} catch (error) {
  console.error('Unable to initialize WebGL tank scene', error);
  scene = {
    update: () => undefined,
    render: () => undefined,
    resize: () => undefined,
    dispose: () => undefined,
  };
}

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const telemetry = tank.step(dt);
  const controls = tank.getControls();
  hmi.update(telemetry, controls);
  scene.update(telemetry, controls);
  scene.render();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => scene.resize());
requestAnimationFrame(frame);
