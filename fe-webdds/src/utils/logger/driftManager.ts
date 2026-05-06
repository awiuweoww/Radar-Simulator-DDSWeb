/**
 * @file driftManager.ts
 * @description Mengelola sinkronisasi waktu adaptif antara Frontend (Windows) dan Backend (WSL).
 * Menggunakan kombinasi High-Resolution Monotonic Clock dan algoritma "Minimum Delay".
 */

import { clockSyncResult } from './clockDriftData';

class DriftManager {
  private adaptiveDrift: number | null = null;
  private hasReported = false;

  // Referensi waktu stabil
  private wallBase = Date.now();
  private monoBase = performance.now();
  private lastReanchor = Date.now();

  /**
   * Mengambil waktu sekarang yang stabil (monotonik) tetapi dalam skala wall-clock.
   * Melakukan re-anchoring setiap 30 detik untuk mencegah drift antara
   * performance.now() dan Date.now() di beberapa lingkungan browser.
   */
  public now(): number {
    const nowWall = Date.now();
    // Re-anchor jika sudah > 30 detik untuk akurasi jangka panjang
    if (nowWall - this.lastReanchor > 30000) {
      this.wallBase = nowWall;
      this.monoBase = performance.now();
      this.lastReanchor = nowWall;
    }
    return this.wallBase + (performance.now() - this.monoBase);
  }

  /**
   * Update drift berdasarkan sampel latensi baru.
   * Menggunakan prinsip "Floor Tracking" (Minimum Delay).
   * 
   * @param rawLat Selisih waktu mentah (ArrivalTime_FE - SentTime_BE)
   */
  public updateDrift(rawLat: number): void {
    if (this.adaptiveDrift === null) {
      this.adaptiveDrift = rawLat;
      return;
    }
    if (rawLat < this.adaptiveDrift) {
      this.adaptiveDrift = this.adaptiveDrift * 0.7 + rawLat * 0.3;
    } else {
      this.adaptiveDrift = this.adaptiveDrift * 0.9995 + rawLat * 0.0005;
    }
  }


  /**
   * Mengambil nilai drift saat ini. 
   */
  public getDrift(): number {
    if (this.adaptiveDrift !== null) {
      return this.adaptiveDrift;
    }
    return -clockSyncResult.diffMs;
  }

  /**
   * Normalisasi timestamp Backend ke Timeline Frontend.
   * @param beTimestamp Timestamp dari sistem Backend
   */
  public normalize(beTimestamp: number): number {
    // Hasil: beTimestamp + (WindowsClock - WSLClock)
    return beTimestamp + this.getDrift();
  }

  public setReported(val: boolean): void {
    this.hasReported = val;
  }

  public isReported(): boolean {
    return this.hasReported;
  }

  public reset(): void {
    this.adaptiveDrift = null;
    this.hasReported = false;
  }
}

export const driftManager = new DriftManager();
