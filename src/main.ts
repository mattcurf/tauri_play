import './styles.css';
import { createPumpHmiPanel, createTankHmiPanel } from './hmi/panel';
import { createPumpScene, createTankScene, type VisualizationScene } from './pump/scene';
import { PumpProcess } from './sim/process';
import { TankProcess } from './sim/tank';

const viewport = document.querySelector<HTMLElement>('#tank-viewport');
const controlsRoot = document.querySelector<HTMLElement>('#controls-root');
const visualizationSelect = document.querySelector<HTMLSelectElement>('#visualization-select');
const appTitle = document.querySelector<HTMLElement>('#app-title');

if (!viewport || !controlsRoot || !visualizationSelect || !appTitle) {
  throw new Error('Tank demo root elements were not found');
}

const viewportElement = viewport;
const controlsElement = controlsRoot;
const selectElement = visualizationSelect;
const titleElement = appTitle;

type VisualizationType = 'tank' | 'pump';

interface ActiveVisualization {
  type: VisualizationType;
  tick(dtSeconds: number): void;
  resize(): void;
  dispose(): void;
}

const tank = new TankProcess();
const pump = new PumpProcess();

function createFallbackScene<TTelemetry, TControls>(): VisualizationScene<TTelemetry, TControls> {
  return {
    update: () => undefined,
    render: () => undefined,
    resize: () => undefined,
    dispose: () => undefined,
  };
}

function createSceneSafely<TTelemetry, TControls>(
  label: string,
  factory: () => VisualizationScene<TTelemetry, TControls>,
): VisualizationScene<TTelemetry, TControls> {
  try {
    return factory();
  } catch (error) {
    console.error(`Unable to initialize WebGL ${label} scene`, error);
    return createFallbackScene();
  }
}

function setTitle(type: VisualizationType): void {
  const title = type === 'tank'
    ? 'SCADA Process Visualizer — TK-101 Tank'
    : 'SCADA Process Visualizer — P-201 Pump';
  titleElement.textContent = title;
  document.title = title;
}

function createVisualization(type: VisualizationType): ActiveVisualization {
  viewportElement.replaceChildren();
  controlsElement.replaceChildren();
  setTitle(type);

  if (type === 'pump') {
    const scene = createSceneSafely('pump', () => createPumpScene(viewportElement));
    const hmi = createPumpHmiPanel({
      viewport: viewportElement,
      controlsRoot: controlsElement,
      initialControls: pump.getControls(),
      onControlsChange: (partial) => pump.setControls(partial),
    });
    hmi.update(pump.getTelemetry(), pump.getControls());

    return {
      type,
      tick(dtSeconds) {
        const telemetry = pump.step(dtSeconds);
        const controls = pump.getControls();
        hmi.update(telemetry, controls);
        scene.update(telemetry, controls, dtSeconds);
        scene.render();
      },
      resize: () => scene.resize(),
      dispose: () => scene.dispose(),
    };
  }

  const scene = createSceneSafely('tank', () => createTankScene(viewportElement));
  const hmi = createTankHmiPanel({
    viewport: viewportElement,
    controlsRoot: controlsElement,
    initialControls: tank.getControls(),
    onControlsChange: (partial) => tank.setControls(partial),
  });
  hmi.update(tank.getTelemetry(), tank.getControls());

  return {
    type,
    tick(dtSeconds) {
      const telemetry = tank.step(dtSeconds);
      const controls = tank.getControls();
      hmi.update(telemetry, controls);
      scene.update(telemetry, controls, dtSeconds);
      scene.render();
    },
    resize: () => scene.resize(),
    dispose: () => scene.dispose(),
  };
}

let active = createVisualization('tank');
let last = performance.now();

selectElement.addEventListener('change', () => {
  const nextType: VisualizationType = selectElement.value === 'pump' ? 'pump' : 'tank';
  if (nextType === active.type) return;

  active.dispose();
  active = createVisualization(nextType);
  last = performance.now();
});

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  active.tick(dt);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => active.resize());
requestAnimationFrame(frame);
