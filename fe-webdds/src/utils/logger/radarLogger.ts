/**
 * @file radarLogger.ts
 * @description Auditor performa radar dengan akurasi tinggi.
 * Menghitung latensi end-to-end (Backend-to-Frontend) secara real-time.
 */

import { TrackData } from '../../types/RadarTrack';

class RadarLogger {
  private baseOffset: number | null = null;
  private audit = {
    t1_sent: 0,
    t100_received: 0,
    t1_received: 0
  };

  private stats = {
    count: 0,
    totalBytes: 0,
    totalLat: 0,
    startTime: performance.now(),
  };

  private integrity = {
    targetReached: false,
    maxObserved: 0,
    lastDropLog: 0,
    lastTargetCount: 0
  };

  /**
   * Mencatat paket masuk dengan perhitungan latensi yang disinkronisasi. 
   */
  public logIncomingPackets(data: unknown, tracks: TrackData[], rawLength?: number): void {
    const arrivalTime = Date.now();
    this.stats.count += tracks.length;

    const byteSize = rawLength ?? (tracks.length * 150);
    this.stats.totalBytes += byteSize;

    tracks.forEach(track => {
      const rawLat = arrivalTime - track.timestamp;
      if (this.baseOffset === null || rawLat < this.baseOffset) {
        this.baseOffset = rawLat;
      }

      const cleanLat = Math.max(0, rawLat - this.baseOffset);
      this.stats.totalLat += cleanLat;

      // Logika Audit: Cek ID 0 (Data ke-1) dan ID 99 (Data ke-100)
      if (track.trackId === 0) {
        this.audit.t1_sent = track.timestamp;
        this.audit.t1_received = arrivalTime;
      }
      if (track.trackId === 99) {
        this.audit.t100_received = arrivalTime;
      }
    });
    const now = performance.now();
    if (now - this.stats.startTime > 5000) {
      this.printSummary();
      this.resetStats(now);
    }
  }

  private printSummary(): void {
    const duration = (performance.now() - this.stats.startTime) / 1000;
    const throughput = (this.stats.totalBytes / 1024) / duration;
    const avgLatency = this.stats.count > 0 ? (this.stats.totalLat / this.stats.count) : 0;

    const burstDuration = this.audit.t100_received > 0 && this.audit.t1_sent > 0
      ? Math.max(10, this.audit.t100_received - this.audit.t1_sent - (this.baseOffset || 0))
      : 0;

    console.groupCollapsed(`%c  Radar Performance Report (${new Date().toLocaleTimeString()})`, 'color: #3b82f6; font-weight: bold');
    console.log(`Packets Processed : ${this.stats.count}`);
    console.log(`Avg Latency      : %c${avgLatency.toFixed(2)}ms`, 'color: #22c55e; font-weight: bold');
    console.log(`Throughput       : ${throughput.toFixed(2)} KB/s`);
    console.log(`-------------------------------------------`);
    console.log(`Waktu Kirim ID 0 (Pertama) : ${this.formatTime(this.audit.t1_sent)}`);
    console.log(`Waktu Terima ID 99 (ke-100): ${this.formatTime(this.audit.t100_received)}`);
    console.log(`%cDurasi Streaming ID 0 s/d 99: ${burstDuration.toFixed(2)}ms`, 'color: #f59e0b; font-weight: bold');
    console.groupEnd();
  }

  private formatTime(ts: number): string {
    if (!ts) return "N/A";
    const d = new Date(ts);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }

  private resetStats(now: number): void {
    this.stats.count = 0;
    this.stats.totalBytes = 0;
    this.stats.totalLat = 0;
    this.stats.startTime = now;
    this.baseOffset = null;

    this.audit.t1_sent = 0;
    this.audit.t100_received = 0;
    this.audit.t1_received = 0;
  }

  /**
   * Mencatat bukti jika data hilang setelah mencapai target.
   */
  public logDataDrop(currentCount: number, targetCount: number): void {
    if (targetCount <= 0) return;
    if (this.integrity.lastTargetCount !== targetCount) {
      this.integrity.targetReached = false;
      this.integrity.maxObserved = 0;
      this.integrity.lastTargetCount = targetCount;
    }

    if (!this.integrity.targetReached) {
      if (currentCount >= targetCount) {
        this.integrity.targetReached = true;
        this.integrity.maxObserved = currentCount;
        console.log(`%c Target ${targetCount} tercapai. Monitoring drop diaktifkan.`, 'color: #22c55e; font-weight: bold');
      }
      return;
    }

    if (currentCount === 0) {
      // Jika data benar-benar kosong, anggap simulasi berhenti/reset
      this.integrity.targetReached = false;
      return;
    }

    if (currentCount < targetCount) {
      const now = Date.now();
      if (now - this.integrity.lastDropLog > 1000) {
        console.warn(
          `%c  DATA DROP DETECTED! %c Bukti: Data turun menjadi ${currentCount}/${targetCount} (Missing: ${targetCount - currentCount})`,
          'color: #ffffff; background: #ef4444; padding: 2px 5px; border-radius: 3px;',
          'color: #ef4444; font-weight: bold'
        );
        this.integrity.lastDropLog = now;
      }
    } else {
      this.integrity.maxObserved = Math.max(this.integrity.maxObserved, currentCount);
    }
  }

  public logError(ctx: string, err: any) {
    console.error(`[Error] ${ctx}:`, err);
  }

  public logConnection(status: string, url: string) {
    console.log(`[Connection] ${status}: ${url}`);
  }
}

export const radarLogger = new RadarLogger();
