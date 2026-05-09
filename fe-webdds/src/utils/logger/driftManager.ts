/**
 * @file driftManager.ts (CLEANED)
 * @description Mengelola sinkronisasi waktu dan RTT antara Frontend (Windows) dan Backend (WSL).
 */

import { clockSyncResult } from './clockDriftData';

class DriftManager {
  private hasReported = false;

  /**
   * RTT/2: One-way latency Gateway→Browser, diukur via WebSocket ping/pong.
   * Ini akurat karena diukur dari satu clock (FE) saja.
   */
  private rttOneWay: number | null = null;

  // Referensi waktu stabil (monotonic wall-clock)
  private wallBase = Date.now();
  private monoBase = performance.now();
  private lastReanchor = Date.now();

  /**
   * Mengambil waktu sekarang yang stabil (monotonik) dalam skala wall-clock.
   * Re-anchor setiap 30 detik untuk mencegah drift performance.now() vs Date.now().
   */
  public now(): number {
    const nowWall = Date.now();
    if (nowWall - this.lastReanchor > 30000) {
      this.wallBase = nowWall;
      this.monoBase = performance.now();
      this.lastReanchor = nowWall;
    }
    return this.wallBase + (performance.now() - this.monoBase);
  }

  public setReported(val: boolean): void {
    this.hasReported = val;
  }

  public isReported(): boolean {
    return this.hasReported;
  }

  public reset(): void {
    this.rttOneWay = null;
    this.hasReported = false;
  }

  /**
   * Update RTT dari WebSocket ping/pong probe.
   * @param rttMs Round-trip time mentah (dalam ms), dari performance.now() delta.
   */
  public updateRtt(rttMs: number): void {
    if (rttMs < 0 || rttMs > 5000) return;
    const oneWay = rttMs / 2;

    if (this.rttOneWay === null) {
      this.rttOneWay = oneWay;
      return;
    }

    if (oneWay < this.rttOneWay) {
      this.rttOneWay = this.rttOneWay * 0.5 + oneWay * 0.5;
    } else {
      this.rttOneWay = this.rttOneWay * 0.95 + oneWay * 0.05;
    }
  }

  /**
   * One-way latency Gateway→Browser (diukur via RTT/2).
   * Akurat karena hanya menggunakan satu clock (FE performance.now).
   */
  public getRtt(): number {
    return this.rttOneWay ?? 0;
  }

  /** Debug info lengkap untuk console */
  public debugInfo(): object {
    return {
      rttOneWay_ms: this.rttOneWay?.toFixed(2) ?? 'belum ada probe',
      wslDiffMs: clockSyncResult.diffMs,
    };
  }
}

export const driftManager = new DriftManager();