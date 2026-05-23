import type { TankControls, TankTelemetry, TankStatus } from '../sim/tank';

export interface HmiPanel {
  update(telemetry: TankTelemetry, controls: TankControls): void;
}

interface Options {
  viewport: HTMLElement;
  controlsRoot: HTMLElement;
  initialControls: TankControls;
  onControlsChange: (partial: Partial<TankControls>) => void;
};

const statusClass: Record<TankStatus, string> = {
  NORMAL: 'normal',
  'HI ALARM': 'warning',
  'HI-HI ALARM': 'alarm',
  'LO ALARM': 'warning',
  'LO-LO ALARM': 'alarm',
};

export function createHmiPanel({ viewport, controlsRoot, initialControls, onControlsChange }: Options): HmiPanel {
  let latestControls = { ...initialControls };

  viewport.insertAdjacentHTML('beforeend', `
    <div class="hmi-overlay">
      <div class="title">TK-101 / FINISHED WATER</div>
      <div>TAG: LIT-101&nbsp;&nbsp;&nbsp;<span class="val" data-tag="level">--</span> %</div>
      <div>TAG: LT-101&nbsp;&nbsp;&nbsp;&nbsp;<span class="val" data-tag="volume">--</span> gal</div>
      <div>TAG: PT-101&nbsp;&nbsp;&nbsp;&nbsp;<span class="val" data-tag="pressure">--</span> psi</div>
      <div>TAG: TT-101&nbsp;&nbsp;&nbsp;&nbsp;<span class="val" data-tag="temp">--</span> °F</div>
    </div>
    <div class="hmi-status">
      <div id="status-pill" class="normal">NORMAL</div>
      <div>SCAN: 0.5s</div>
      <div>PLC-01 ONLINE</div>
    </div>
    <div class="hmi-foot">Drag to rotate · scroll to zoom</div>
  `);

  controlsRoot.innerHTML = `
    <div>
      <div class="ctrl-label"><span>Level setpoint</span><span class="out" data-out="level">${initialControls.levelSetpointPct}%</span></div>
      <input type="range" min="0" max="100" value="${initialControls.levelSetpointPct}" step="1" data-control="level" />
    </div>
    <div><div class="ctrl-label">Inlet valve XV-101</div><button data-control="inlet"></button></div>
    <div><div class="ctrl-label">Outlet valve XV-102</div><button data-control="outlet"></button></div>
    <div><div class="ctrl-label">Auto control</div><button data-control="auto"></button></div>
    <div class="alarms">Hi-Hi: 90% &nbsp; Hi: 80%<br>Lo: 20% &nbsp; Lo-Lo: 10%</div>
  `;

  const values = {
    level: viewport.querySelector<HTMLElement>('[data-tag="level"]')!,
    volume: viewport.querySelector<HTMLElement>('[data-tag="volume"]')!,
    pressure: viewport.querySelector<HTMLElement>('[data-tag="pressure"]')!,
    temp: viewport.querySelector<HTMLElement>('[data-tag="temp"]')!,
  };
  const status = viewport.querySelector<HTMLElement>('#status-pill')!;
  const levelOut = controlsRoot.querySelector<HTMLElement>('[data-out="level"]')!;
  const level = controlsRoot.querySelector<HTMLInputElement>('[data-control="level"]')!;
  const inlet = controlsRoot.querySelector<HTMLButtonElement>('[data-control="inlet"]')!;
  const outlet = controlsRoot.querySelector<HTMLButtonElement>('[data-control="outlet"]')!;
  const auto = controlsRoot.querySelector<HTMLButtonElement>('[data-control="auto"]')!;

  function setText(element: HTMLElement, text: string): void {
    if (element.textContent !== text) {
      element.textContent = text;
    }
  }

  function emitControlChange(partial: Partial<TankControls>): void {
    latestControls = {
      ...latestControls,
      ...partial,
    };
    onControlsChange(partial);
  }

  function bindControlButton(button: HTMLButtonElement, onPress: () => void): void {
    let suppressClick = false;
    let suppressTimer = 0;

    button.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      event.preventDefault();
      button.focus();
      onPress();
      suppressClick = true;
      window.clearTimeout(suppressTimer);
      suppressTimer = window.setTimeout(() => {
        suppressClick = false;
      }, 750);
    });

    button.addEventListener('click', (event) => {
      if (suppressClick) {
        event.preventDefault();
        suppressClick = false;
        window.clearTimeout(suppressTimer);
        return;
      }

      onPress();
    });
  }

  level.addEventListener('input', () => emitControlChange({ levelSetpointPct: Number(level.value) }));
  bindControlButton(inlet, () => emitControlChange({ inletOpen: !latestControls.inletOpen, autoMode: false }));
  bindControlButton(outlet, () => emitControlChange({ outletOpen: !latestControls.outletOpen, autoMode: false }));
  bindControlButton(auto, () => emitControlChange({ autoMode: !latestControls.autoMode }));

  return {
    update(telemetry, controls) {
      latestControls = { ...controls };

      setText(values.level, telemetry.levelPct.toFixed(1));
      setText(values.volume, Math.round(telemetry.volumeGal).toLocaleString());
      setText(values.pressure, telemetry.pressurePsi.toFixed(1));
      setText(values.temp, telemetry.temperatureF.toFixed(1));
      setText(status, telemetry.status);
      status.className = statusClass[telemetry.status];

      const levelSetpoint = String(Math.round(controls.levelSetpointPct));
      if (level.value !== levelSetpoint) {
        level.value = levelSetpoint;
      }
      setText(levelOut, `${levelSetpoint}%`);
      setText(inlet, controls.inletOpen ? 'OPEN' : 'CLOSED');
      setText(outlet, controls.outletOpen ? 'OPEN' : 'CLOSED');
      setText(auto, controls.autoMode ? 'AUTO' : 'MANUAL');
      inlet.classList.toggle('open', controls.inletOpen);
      inlet.classList.toggle('closed', !controls.inletOpen);
      outlet.classList.toggle('open', controls.outletOpen);
      outlet.classList.toggle('closed', !controls.outletOpen);
      auto.classList.toggle('active', controls.autoMode);
    },
  };
}
