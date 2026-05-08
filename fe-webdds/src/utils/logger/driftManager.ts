/**
 * @file driftManager.ts (FIXED v2)
 * @description Mengelola sinkronisasi waktu adaptif antara Frontend (Windows) dan Backend (WSL).
 *
 * FIX v2:
 *   1. adaptiveDrift sekarang hanya menyimpan NETWORK LATENCY MURNI.
 *      Clock offset (staticOffset dari sync-clock.sh) TIDAK ikut masuk ke adaptiveDrift.
 *   2. normalize() hanya pakai staticOffset — bukan getDrift() — agar tidak double-counting.
 *   3. getDrift() hanya untuk monitoring/debug network latency adaptif.
 *   4. Ditambah getNetworkLatency() dan getTotalOffset() untuk transparansi.
 */

import { clockSyncResult } from './clockDriftData';

class DriftManager {
  /**
   * Estimasi minimum network latency (murni jaringan, tanpa clock offset).
   * Diisi oleh updateDrift() setelah staticOffset dikurangkan.
   */
  private adaptiveNetLat: number | null = null;
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

  /**
   * Update estimasi network latency adaptif.
   *
   * PENTING: Parameter rawLat yang masuk ke sini harus sudah DIKURANGKAN staticOffset,
   * sehingga adaptiveNetLat hanya menyimpan latensi jaringan murni.
   *
   * Cara memanggil yang benar (dari radarLogger):
   *   const netLat = arrivalTime - track.timestamp - driftManager.getStaticOffset();
   *   driftManager.updateDrift(netLat);
   *
   * @param netLat Latensi jaringan murni (arrivalTime_FE - timestamp_BE - staticOffset)
   */
  public updateDrift(netLat: number): void {
    // Abaikan nilai negatif atau tidak masuk akal (> 5 detik)
    if (netLat < 0 || netLat > 5000) return;

    if (this.adaptiveNetLat === null) {
      this.adaptiveNetLat = netLat;
      return;
    }

    // Floor tracking: lebih sensitif ke penurunan (minimum delay principle)
    if (netLat < this.adaptiveNetLat) {
      this.adaptiveNetLat = this.adaptiveNetLat * 0.7 + netLat * 0.3;
    } else {
      this.adaptiveNetLat = this.adaptiveNetLat * 0.9995 + netLat * 0.0005;
    }
  }

  /**
   * Selisih jam statis dari sync-clock.sh (WSL vs Windows).
   * diffMs > 0 → WSL lebih cepat → timestamp WSL lebih besar → perlu dikurangi untuk normalisasi
   * diffMs < 0 → WSL lebih lambat → timestamp WSL lebih kecil → perlu ditambah untuk normalisasi
   *
   * Formula: windowsTime = wslTime - diffMs
   * Atau: normalize(beTimestamp) = beTimestamp - diffMs
   */
  public getStaticOffset(): number {
    // negasi: agar normalize() tinggal menjumlahkan
    // Jika WSL 60ms lebih cepat (diffMs=60), maka BE timestamp 60ms lebih besar dari seharusnya
    // normalize: beTimestamp - 60 → setarakan ke Windows timeline
    return -clockSyncResult.diffMs;
  }

  /**
   * Estimasi minimum network latency adaptif (murni jaringan).
   * Tidak mengandung clock offset.
   */
  public getNetworkLatency(): number {
    return this.adaptiveNetLat ?? 0;
  }

  /**
   * Total offset = clock offset + estimasi minimum network latency.
   * Hanya untuk keperluan monitoring/debug, BUKAN untuk normalize().
   */
  public getTotalOffset(): number {
    return this.getStaticOffset() + this.getNetworkLatency();
  }

  /**
   * @deprecated Gunakan getNetworkLatency() atau getTotalOffset() sesuai kebutuhan.
   * Disimpan untuk kompatibilitas mundur.
   */
  public getDrift(): number {
    return this.getNetworkLatency();
  }

  /**
   * Normalisasi timestamp Backend (WSL) ke timeline Frontend (Windows).
   *
   * Hanya menggunakan staticOffset — BUKAN adaptiveNetLat — karena:
   * - staticOffset = konversi timeline antar OS (benar secara matematis)
   * - adaptiveNetLat = estimasi delay jaringan (bukan bagian dari konversi timeline)
   *
   * @param beTimestamp Timestamp millisecond dari sistem Backend (WSL)
   * @returns Timestamp yang setara dalam skala Windows/Frontend
   */
  public normalize(beTimestamp: number): number {
    return beTimestamp + this.getStaticOffset();
  }

  public setReported(val: boolean): void {
    this.hasReported = val;
  }

  public isReported(): boolean {
    return this.hasReported;
  }

  public reset(): void {
    this.adaptiveNetLat = null;
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

    // Floor tracking: sensitif ke penurunan (minimum delay principle)
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
      staticOffset_ms: this.getStaticOffset(),
      adaptiveNetLat_ms: this.adaptiveNetLat?.toFixed(2) ?? 'belum ada data',
      rttOneWay_ms: this.rttOneWay?.toFixed(2) ?? 'belum ada probe',
      totalOffset_ms: this.getTotalOffset().toFixed(2),
      wslDiffMs: clockSyncResult.diffMs,
      wslFasterThanWindows: clockSyncResult.diffMs > 0,
    };
  }
}

export const driftManager = new DriftManager();