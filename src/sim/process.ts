// SPDX-License-Identifier: Apache-2.0

export type PumpStatus = 'NORMAL' | 'CAVITATION' | 'DEADHEAD' | 'OVERLOAD';

export interface PumpControls {
  rpmSetpoint: number;
  suctionOpen: boolean;
  dischargeOpen: boolean;
  autoMode: boolean;
  pressureSetpointPsi: number;
}

export interface PumpTelemetry {
  rpm: number;
  flowGpm: number;
  suctionPsi: number;
  dischargePsi: number;
  bearingTempF: number;
  motorKw: number;
  status: PumpStatus;
  flow01: number;
  load01: number;
  cavitation01: number;
}

const RATED_RPM = 3600;
const RATED_FLOW_GPM = 850;
const RATED_HEAD_PSI = 92;
const RATED_KW = 75;
const AMBIENT_F = 72;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class PumpProcess {
  private controls: PumpControls = {
    rpmSetpoint: 2450,
    suctionOpen: true,
    dischargeOpen: true,
    autoMode: false,
    pressureSetpointPsi: 82,
  };

  private rpm = this.controls.rpmSetpoint;
  private bearingTempF = 96;
  private integral = 0;
  private telemetry: PumpTelemetry = this.calculateTelemetry();

  setControls(partial: Partial<PumpControls>): void {
    this.controls = {
      ...this.controls,
      ...partial,
      rpmSetpoint: clamp(partial.rpmSetpoint ?? this.controls.rpmSetpoint, 0, RATED_RPM),
      pressureSetpointPsi: clamp(partial.pressureSetpointPsi ?? this.controls.pressureSetpointPsi, 20, 130),
    };
  }

  getControls(): PumpControls {
    return { ...this.controls };
  }

  getTelemetry(): PumpTelemetry {
    return { ...this.telemetry };
  }

  step(dtSeconds: number): PumpTelemetry {
    const dt = clamp(dtSeconds, 0, 0.05);
    const current = this.calculateTelemetry();

    if (this.controls.autoMode) {
      const error = this.controls.pressureSetpointPsi - current.dischargePsi;
      if (Math.abs(error) > 1) {
        this.integral = clamp(this.integral + error * dt, -600, 600);
        const target = this.rpm + error * 28 + this.integral * 3.5;
        this.controls.rpmSetpoint = clamp(target, 0, RATED_RPM);
      }
    } else {
      this.integral *= Math.max(0, 1 - dt * 3);
    }

    const accelRate = this.controls.autoMode ? 1800 : 2400;
    const delta = clamp(this.controls.rpmSetpoint - this.rpm, -accelRate * dt, accelRate * dt);
    this.rpm = clamp(this.rpm + delta, 0, RATED_RPM);

    const next = this.calculateTelemetry();
    const tempTarget = AMBIENT_F + 18 + next.load01 * 78 + (next.status === 'DEADHEAD' ? 70 : 0) + (next.status === 'OVERLOAD' ? 45 : 0);
    const tempTau = next.status === 'DEADHEAD' ? 0.11 : 0.045;
    this.bearingTempF += (tempTarget - this.bearingTempF) * clamp(dt * tempTau, 0, 1);
    this.telemetry = this.calculateTelemetry();
    return this.getTelemetry();
  }

  private calculateTelemetry(): PumpTelemetry {
    const n = clamp(this.rpm / RATED_RPM, 0, 1);
    const dischargeRestriction = this.controls.dischargeOpen ? 1 : 90;
    const suctionFactor = this.controls.suctionOpen ? 1 : 0.08;
    const systemK = 0.00013 * dischargeRestriction;
    const pumpHead = RATED_HEAD_PSI * n * n;
    const staticHead = 8;
    const available = Math.max(0, pumpHead - staticHead);
    let flowGpm = Math.sqrt(available / (systemK + 0.000055)) * suctionFactor;
    flowGpm = clamp(flowGpm, 0, RATED_FLOW_GPM * 1.22 * n);

    const deadhead = !this.controls.dischargeOpen && this.rpm > 80;
    if (deadhead) flowGpm = Math.min(flowGpm, 14 * n);

    const npshRequired = 5 + 18 * n * n + flowGpm / 140;
    const suctionPsi = this.controls.suctionOpen ? 9 - flowGpm / 260 : -4 - 6 * n;
    const npshAvailable = this.controls.suctionOpen ? 20 + suctionPsi : 3 + suctionPsi;
    const cavitation = this.rpm > 120 && (!this.controls.suctionOpen || npshAvailable < npshRequired);

    const dischargePsi = clamp(suctionPsi + pumpHead - flowGpm * flowGpm * systemK, 0, 145);
    const hydraulicLoad = n > 0 ? (flowGpm / RATED_FLOW_GPM) * (dischargePsi / RATED_HEAD_PSI) : 0;
    let motorKw = RATED_KW * (0.1 * n + 0.9 * Math.pow(n, 3)) * (0.65 + hydraulicLoad);
    if (deadhead) motorKw += 32 * n;
    if (!this.controls.dischargeOpen && n > 0.88) motorKw += 28 * n;
    motorKw = clamp(motorKw, 0, 130);

    const overload = motorKw > RATED_KW * 1.1;
    const status: PumpStatus = overload ? 'OVERLOAD' : deadhead ? 'DEADHEAD' : cavitation ? 'CAVITATION' : 'NORMAL';

    return {
      rpm: this.rpm,
      flowGpm,
      suctionPsi,
      dischargePsi,
      bearingTempF: this.bearingTempF,
      motorKw,
      status,
      flow01: clamp(flowGpm / RATED_FLOW_GPM, 0, 1),
      load01: clamp(motorKw / RATED_KW, 0, 1.4),
      cavitation01: cavitation ? clamp((npshRequired - npshAvailable + 2) / 10, 0.25, 1) : 0,
    };
  }
}
