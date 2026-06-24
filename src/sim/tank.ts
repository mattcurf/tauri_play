// SPDX-License-Identifier: Apache-2.0

export type TankStatus = 'NORMAL' | 'HI ALARM' | 'HI-HI ALARM' | 'LO ALARM' | 'LO-LO ALARM';

export interface TankTelemetry {
  levelPct: number;
  volumeGal: number;
  pressurePsi: number;
  temperatureF: number;
  status: TankStatus;
}

export interface TankControls {
  levelSetpointPct: number;
  inletOpen: boolean;
  outletOpen: boolean;
  autoMode: boolean;
}

const CAPACITY_GAL = 50_000;
const INLET_RATE_PCT_PER_SEC = 8;
const OUTLET_RATE_PCT_PER_SEC = 6;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class TankProcess {
  private controls: TankControls = {
    levelSetpointPct: 65,
    inletOpen: true,
    outletOpen: false,
    autoMode: false,
  };

  private levelPct = 65;
  private elapsed = 0;
  private telemetry = this.calculateTelemetry();

  setControls(partial: Partial<TankControls>): void {
    this.controls = {
      ...this.controls,
      ...partial,
      levelSetpointPct: clamp(partial.levelSetpointPct ?? this.controls.levelSetpointPct, 0, 100),
    };
  }

  getControls(): TankControls {
    return { ...this.controls };
  }

  step(dtSeconds: number): TankTelemetry {
    const dt = clamp(dtSeconds, 0, 0.05);
    this.elapsed += dt;

    if (this.controls.autoMode) {
      if (this.levelPct < this.controls.levelSetpointPct - 1) {
        this.controls.inletOpen = true;
        this.controls.outletOpen = false;
      } else if (this.levelPct > this.controls.levelSetpointPct + 1) {
        this.controls.inletOpen = false;
        this.controls.outletOpen = true;
      } else {
        this.controls.inletOpen = false;
        this.controls.outletOpen = false;
      }
    }

    const inFlow = this.controls.inletOpen ? INLET_RATE_PCT_PER_SEC : 0;
    const outFlow = this.controls.outletOpen ? OUTLET_RATE_PCT_PER_SEC : 0;
    this.levelPct = clamp(this.levelPct + (inFlow - outFlow) * dt, 0, 100);

    if (!this.controls.autoMode && !this.controls.inletOpen && !this.controls.outletOpen) {
      this.levelPct += (this.controls.levelSetpointPct - this.levelPct) * Math.min(1, dt * 2);
    }

    this.telemetry = this.calculateTelemetry();
    return this.getTelemetry();
  }

  getTelemetry(): TankTelemetry {
    return { ...this.telemetry };
  }

  private calculateTelemetry(): TankTelemetry {
    const status: TankStatus = this.levelPct >= 90
      ? 'HI-HI ALARM'
      : this.levelPct >= 80
        ? 'HI ALARM'
        : this.levelPct <= 10
          ? 'LO-LO ALARM'
          : this.levelPct <= 20
            ? 'LO ALARM'
            : 'NORMAL';

    return {
      levelPct: this.levelPct,
      volumeGal: this.levelPct / 100 * CAPACITY_GAL,
      pressurePsi: this.levelPct / 100 * 26 * 0.433 + 14.7,
      temperatureF: 58 + Math.sin(this.elapsed / 5) * 1.2,
      status,
    };
  }
}
