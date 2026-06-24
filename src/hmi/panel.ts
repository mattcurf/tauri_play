// SPDX-License-Identifier: Apache-2.0

import type { PumpControls, PumpTelemetry, PumpStatus } from '../sim/process';
import type { TankControls, TankTelemetry, TankStatus } from '../sim/tank';

export interface HmiPanel<TTelemetry, TControls> {
  update(telemetry: TTelemetry, controls: TControls): void;
}

interface Options<TControls> {
  viewport: HTMLElement;
  controlsRoot: HTMLElement;
  initialControls: TControls;
  onControlsChange: (partial: Partial<TControls>) => void;
};

const tankStatusClass: Record<TankStatus, string> = {
  NORMAL: 'normal',
  'HI ALARM': 'warning',
  'HI-HI ALARM': 'alarm',
  'LO ALARM': 'warning',
  'LO-LO ALARM': 'alarm',
};

const pumpStatusClass: Record<PumpStatus, string> = {
  NORMAL: 'normal',
  CAVITATION: 'warning',
  DEADHEAD: 'warning',
  OVERLOAD: 'alarm',
};

function setText(element: HTMLElement, text: string): void {
  if (element.textContent !== text) {
    element.textContent = text;
  }
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

export function createTankHmiPanel({ viewport, controlsRoot, initialControls, onControlsChange }: Options<TankControls>): HmiPanel<TankTelemetry, TankControls> {
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
    <div class="controls-heading">Tank controls</div>
    <div class="control-section">
      <div class="ctrl-label"><span>Level setpoint</span><span class="out" data-out="level">${initialControls.levelSetpointPct}%</span></div>
      <input type="range" min="0" max="100" value="${initialControls.levelSetpointPct}" step="1" data-control="level" />
    </div>
    <div class="control-section"><div class="ctrl-label">Inlet valve XV-101</div><button data-control="inlet"></button></div>
    <div class="control-section"><div class="ctrl-label">Outlet valve XV-102</div><button data-control="outlet"></button></div>
    <div class="control-section"><div class="ctrl-label">Auto control</div><button data-control="auto"></button></div>
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

  function emitControlChange(partial: Partial<TankControls>): void {
    latestControls = {
      ...latestControls,
      ...partial,
    };
    onControlsChange(partial);
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
      status.className = tankStatusClass[telemetry.status];

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

export function createPumpHmiPanel({ viewport, controlsRoot, initialControls, onControlsChange }: Options<PumpControls>): HmiPanel<PumpTelemetry, PumpControls> {
  let latestControls = { ...initialControls };

  viewport.insertAdjacentHTML('beforeend', `
    <div class="hmi-overlay">
      <div class="title">P-201 / COOLING WATER PUMP</div>
      <div>TAG: ST-201&nbsp;&nbsp;&nbsp;<span class="val" data-tag="rpm">--</span> rpm</div>
      <div>TAG: FT-201&nbsp;&nbsp;&nbsp;<span class="val" data-tag="flow">--</span> gpm</div>
      <div>TAG: PIT-201&nbsp;&nbsp;<span class="val" data-tag="suction">--</span> psi suction</div>
      <div>TAG: PIT-202&nbsp;&nbsp;<span class="val" data-tag="discharge">--</span> psi discharge</div>
      <div>TAG: TT-201&nbsp;&nbsp;&nbsp;<span class="val" data-tag="bearing">--</span> °F bearing</div>
      <div>TAG: KW-201&nbsp;&nbsp;&nbsp;<span class="val" data-tag="kw">--</span> kW</div>
    </div>
    <div class="hmi-status">
      <div id="status-pill" class="normal">NORMAL</div>
      <div>SCAN: 0.25s</div>
      <div>VFD-201 ONLINE</div>
    </div>
    <div class="hmi-foot">Drag to rotate · scroll to zoom · impeller follows RPM</div>
  `);

  controlsRoot.innerHTML = `
    <div class="controls-heading">Pump controls</div>
    <div class="control-section">
      <div class="ctrl-label"><span>Speed setpoint VFD-201</span><span class="out" data-out="rpm">${Math.round(initialControls.rpmSetpoint)} rpm</span></div>
      <input type="range" min="0" max="3600" value="${Math.round(initialControls.rpmSetpoint)}" step="25" data-control="rpm" />
    </div>
    <div class="control-section">
      <div class="ctrl-label"><span>Pressure setpoint</span><span class="out" data-out="pressure">${Math.round(initialControls.pressureSetpointPsi)} psi</span></div>
      <input type="range" min="20" max="130" value="${Math.round(initialControls.pressureSetpointPsi)}" step="1" data-control="pressure" />
    </div>
    <div class="control-section"><div class="ctrl-label">Suction valve XV-202</div><button data-control="suction"></button></div>
    <div class="control-section"><div class="ctrl-label">Discharge valve XV-201</div><button data-control="discharge"></button></div>
    <div class="control-section"><div class="ctrl-label">Auto pressure control</div><button data-control="auto"></button></div>
    <div class="alarms">Cavitation: low NPSH / suction closed<br>Deadhead: discharge closed<br>Overload: motor load above rating</div>
  `;

  const values = {
    rpm: viewport.querySelector<HTMLElement>('[data-tag="rpm"]')!,
    flow: viewport.querySelector<HTMLElement>('[data-tag="flow"]')!,
    suction: viewport.querySelector<HTMLElement>('[data-tag="suction"]')!,
    discharge: viewport.querySelector<HTMLElement>('[data-tag="discharge"]')!,
    bearing: viewport.querySelector<HTMLElement>('[data-tag="bearing"]')!,
    kw: viewport.querySelector<HTMLElement>('[data-tag="kw"]')!,
  };
  const status = viewport.querySelector<HTMLElement>('#status-pill')!;
  const rpmOut = controlsRoot.querySelector<HTMLElement>('[data-out="rpm"]')!;
  const pressureOut = controlsRoot.querySelector<HTMLElement>('[data-out="pressure"]')!;
  const rpm = controlsRoot.querySelector<HTMLInputElement>('[data-control="rpm"]')!;
  const pressure = controlsRoot.querySelector<HTMLInputElement>('[data-control="pressure"]')!;
  const suction = controlsRoot.querySelector<HTMLButtonElement>('[data-control="suction"]')!;
  const discharge = controlsRoot.querySelector<HTMLButtonElement>('[data-control="discharge"]')!;
  const auto = controlsRoot.querySelector<HTMLButtonElement>('[data-control="auto"]')!;

  function emitControlChange(partial: Partial<PumpControls>): void {
    latestControls = {
      ...latestControls,
      ...partial,
    };
    onControlsChange(partial);
  }

  rpm.addEventListener('input', () => emitControlChange({ rpmSetpoint: Number(rpm.value), autoMode: false }));
  pressure.addEventListener('input', () => emitControlChange({ pressureSetpointPsi: Number(pressure.value) }));
  bindControlButton(suction, () => emitControlChange({ suctionOpen: !latestControls.suctionOpen, autoMode: false }));
  bindControlButton(discharge, () => emitControlChange({ dischargeOpen: !latestControls.dischargeOpen, autoMode: false }));
  bindControlButton(auto, () => emitControlChange({ autoMode: !latestControls.autoMode }));

  return {
    update(telemetry, controls) {
      latestControls = { ...controls };

      setText(values.rpm, Math.round(telemetry.rpm).toLocaleString());
      setText(values.flow, Math.round(telemetry.flowGpm).toLocaleString());
      setText(values.suction, telemetry.suctionPsi.toFixed(1));
      setText(values.discharge, telemetry.dischargePsi.toFixed(1));
      setText(values.bearing, telemetry.bearingTempF.toFixed(1));
      setText(values.kw, telemetry.motorKw.toFixed(1));
      setText(status, telemetry.status);
      status.className = pumpStatusClass[telemetry.status];

      const rpmSetpoint = String(Math.round(controls.rpmSetpoint));
      const pressureSetpoint = String(Math.round(controls.pressureSetpointPsi));
      if (rpm.value !== rpmSetpoint) {
        rpm.value = rpmSetpoint;
      }
      if (pressure.value !== pressureSetpoint) {
        pressure.value = pressureSetpoint;
      }

      setText(rpmOut, `${Number(rpmSetpoint).toLocaleString()} rpm`);
      setText(pressureOut, `${pressureSetpoint} psi`);
      setText(suction, controls.suctionOpen ? 'OPEN' : 'CLOSED');
      setText(discharge, controls.dischargeOpen ? 'OPEN' : 'CLOSED');
      setText(auto, controls.autoMode ? 'AUTO' : 'MANUAL');
      suction.classList.toggle('open', controls.suctionOpen);
      suction.classList.toggle('closed', !controls.suctionOpen);
      discharge.classList.toggle('open', controls.dischargeOpen);
      discharge.classList.toggle('closed', !controls.dischargeOpen);
      auto.classList.toggle('active', controls.autoMode);
    },
  };
}
