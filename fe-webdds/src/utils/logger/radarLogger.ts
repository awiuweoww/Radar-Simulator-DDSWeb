/**
 * @file radarLogger.ts
 * @description Auditor performa Web DDS Radar.
 * Menghitung latensi end-to-end (Backend-to-Frontend) secara real-time.
 */

import { TrackData } from '../../types/RadarTrack';
import { commandLogger } from './commandLogger';
import { driftManager } from './driftManager';
import { formatLoggerTime } from '../formatters';
import { integrityManager } from './integrityManager';
import { LOGGER_STYLES, getTimeHeader } from '../colors';

class RadarLogger {
  private enabled: boolean = true;

  private audit = {
    t_be_command_received: 0,
    // Data dari siklus terakhir yang lengkap (ID 0 s/d ID Terakhir)
    lastCompletedCycle: {
      t0_sent: 0,
      t0_received: 0,
      t0_gateway: 0,
      tLast_received: 0,
      tLast_gateway: 0,
      isValid: false
    }
  };

  private activeCycle = {
    t0_sent: 0,
    t0_received: 0,
    t0_gateway: 0,
  };

  private stats = {
    count: 0,
    totalBytes: 0,
    totalLat: 0,
    cycleCount: 0,
    startTime: performance.now(),
  };

  /** Track IDs yang diterima dalam siklus ini untuk verifikasi */
  private receivedIds = new Set<number>();

  public logIncomingPackets(data: unknown, tracks: TrackData[], targetCount: number, rawLength?: number): void {
    this.stats.count += tracks.length;

    const byteSize = rawLength ?? (tracks.length * 150);
    this.stats.totalBytes += byteSize;

    const arrivalTime = driftManager.now();
    
    // Sinkronisasi Jam (Clock Drift) dilakukan sekali per batch 
    if (tracks.length > 0) {
      const firstRawLat = arrivalTime - tracks[0].timestamp;
      driftManager.updateDrift(firstRawLat);
    }

    tracks.forEach(track => {
      const rawLat = arrivalTime - track.timestamp;
      const cleanLat = rawLat - driftManager.getStaticOffset();
      this.stats.totalLat += Math.max(0, cleanLat);

      /* Berfungsi sebagai pencatat setiap data yang masuk */
      this.receivedIds.add(track.trackId);
      if (track.trackId === 0) {
        this.activeCycle.t0_sent = track.timestamp;
        this.activeCycle.t0_received = arrivalTime;
        this.activeCycle.t0_gateway = track.gatewayReceivedAt;
        this.audit.t_be_command_received = track.commandReceivedAt;
        this.stats.cycleCount++;

        commandLogger.logCommandArrival(track.commandReceivedAt);
      }

      const lastExpectedId = targetCount - 1;
      if (track.trackId === lastExpectedId && track.trackId !== 0) {
        this.audit.lastCompletedCycle = {
          t0_sent: this.activeCycle.t0_sent,
          t0_received: this.activeCycle.t0_received,
          t0_gateway: this.activeCycle.t0_gateway,
          tLast_received: arrivalTime,
          tLast_gateway: track.gatewayReceivedAt,
          isValid: true
        };
      }
    });

    const now = performance.now();
    if (now - this.stats.startTime > 10000) {
      this.printSummary(targetCount);
      this.resetStats(now);
    }
  }

  /**
   * Mencatat waktu pengiriman command dari FE ke BE.
   * Delegasi ke commandLogger.
   */
  public logFeToBeSend(targetCount: number): void {
    commandLogger.logCommandSend(targetCount);
  }

  private printSummary(targetCount: number): void {
    if (!this.enabled) return;
    const duration = (performance.now() - this.stats.startTime) / 1000;
    const throughput = (this.stats.totalBytes / 1024) / duration;
    const detectedHz = this.stats.cycleCount / duration;
    const avgLatency = this.stats.count > 0 ? (this.stats.totalLat / this.stats.count) : 0;

    const cycle = this.audit.lastCompletedCycle;
    
    const burstDuration = cycle.isValid
      ? Math.max(0, cycle.tLast_received - driftManager.normalize(cycle.t0_sent))
      : 0;

    const realLatId0 = cycle.isValid
      ? (cycle.t0_received - (cycle.t0_sent + driftManager.getStaticOffset()))
      : 0;

    console.groupCollapsed(`%c Radar Periodic Report (${getTimeHeader()})`, LOGGER_STYLES.header);

    console.log(`%c=========================`, LOGGER_STYLES.separator);
    console.log(`%c[ Be > gateway > FE ]`, LOGGER_STYLES.section);
    console.log(`%c=========================`, LOGGER_STYLES.separator);
    console.log(`%cTransmit Frequency : %c${detectedHz.toFixed(1)} Hz`, LOGGER_STYLES.label, detectedHz > 0.5 ? LOGGER_STYLES.value : 'color: #f59e0b');
    console.log(`%cPackets : %c${this.stats.count}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cAvg Latency      : %c${avgLatency.toFixed(2)}ms`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cThroughput       : %c${throughput.toFixed(2)} KB/s`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    console.log(`%cTotal Track Diterima (per siklus): %c${this.receivedIds.size}`, LOGGER_STYLES.label, LOGGER_STYLES.value);

    const missingIds: number[] = [];
    for (let i = 0; i < targetCount; i++) {
      if (!this.receivedIds.has(i)) missingIds.push(i);
    }
    const isComplete = missingIds.length === 0;

    console.groupCollapsed(`%cID Verification   : %c${isComplete ? 'LENGKAP' : missingIds.length + ' MISSING'}`, LOGGER_STYLES.label, isComplete ? LOGGER_STYLES.value : 'color: #ef4444');
    
    const idsArray = Array.from(this.receivedIds).sort((a, b) => a - b);
    
    if (!isComplete) {
      console.log(`%cMissing IDs: %c${missingIds.join(', ')}`, 'color: #fca5a5', 'color: #ef4444; font-family: monospace');
    } else {
      console.log('%cSemua ID (0 s/d ' + (targetCount - 1) + ') diterima tanpa celah.', 'color: #34d399');
    }

    // Selalu tampilkan daftar lengkap agar bisa dicek manual
    console.log('%cFull Received ID List:', 'color: #9ca3af', idsArray);
    
    console.groupEnd();



    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    if (cycle.isValid) {
      const lastId = targetCount - 1;
      
      // Transmission Time to Gateway (ms)
      // Definisi: Waktu dari track pertama dikirim BE sampai track terakhir diterima Gateway
      const txTimeToGateway = Math.max(0, cycle.tLast_gateway - cycle.t0_sent);
      
      // Transmission Time to Browser (ms)
      // Definisi: Waktu dari track pertama dikirim BE sampai track terakhir diterima Browser
      // Kita gunakan Static Offset agar latensi jaringan tetap terhitung (tidak ter-filter oleh adaptive drift)
      const t0_sent_windows = cycle.t0_sent + driftManager.getStaticOffset();
      const txTimeToBrowser = Math.max(0, cycle.tLast_received - t0_sent_windows);

      console.log(`%cTransmission Time to Gateway : %c${txTimeToGateway.toFixed(2)}ms`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
      console.log(`%cTransmission Time to Browser : %c${txTimeToBrowser.toFixed(2)}ms`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
      console.log(`%cAvg Latency (End-to-End)      : %c${avgLatency.toFixed(2)}ms`, LOGGER_STYLES.label, LOGGER_STYLES.value);
      
      console.log(' ');
      console.log(`%cWaktu Kirim ID 0 (Pertama) : %c${formatLoggerTime(cycle.t0_sent + driftManager.getStaticOffset())}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
      console.log(`%cWaktu Terima ID 0 (Pertama): %c${formatLoggerTime(cycle.t0_received)}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
      console.log(`%cLatensi Murni satu ID (ID=0)     : %c${realLatId0.toFixed(2)}ms`, LOGGER_STYLES.label, Math.abs(realLatId0) < 50 ? LOGGER_STYLES.value : 'color: #ef4444');
      
      console.log(' '); // Spasi pemisah

      console.log(`%cWaktu Terima ID ${lastId} (terakhir): %c${formatLoggerTime(cycle.tLast_received)}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
      console.log(`%cDurasi Streaming data pertama ke terahir  : %c${burstDuration.toFixed(2)}ms`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    } else {
      console.log('%c[!] Data siklus belum lengkap untuk audit presisi.', 'color: #f59e0b');
    }
    console.log(`%cClock Drift Adaptif      : %c${driftManager.getDrift().toFixed(2)}ms`, LOGGER_STYLES.label, 'color: #818cf8');
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);

    console.groupEnd();
  }

  private resetStats(now: number): void {
    this.stats.count = 0;
    this.stats.totalBytes = 0;
    this.stats.totalLat = 0;
    this.stats.cycleCount = 0;
    this.stats.startTime = now;
    this.receivedIds.clear();
  }


  public logDataDrop(currentCount: number, targetCount: number): void {
    integrityManager.logDataDrop(currentCount, targetCount);
  }

  public logError(ctx: string, err: any) {
    console.error(`[Error] ${ctx}:`, err);
  }

  public logConnection(status: string, url: string) {
    if (!this.enabled) return;
    console.log(`[Connection] ${status}: ${url}`);
  }


  public getClockDrift(): number {
    return driftManager.getDrift();
  }
}

export const radarLogger = new RadarLogger();
