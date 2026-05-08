/**
 * @file radarLogger.ts (v5 — Table-Accurate Metrics)
 * @description Auditor performa Web DDS Radar.
 *
 * v5 Changes (sesuai definisi tabel pengujian):
 *   1. Transmission → Gateway = first track sent → LAST track received at Gateway.
 *      Formula: tLast_gateway_received - t0_be_timestamp (same WSL clock, akurat).
 *   2. Transmission → Browser = txToGateway + RTT/2 (total first sent → last received Browser).
 *      → Browser SELALU >= Gateway karena data melewati gateway dulu.
 *   3. Avg Latency = rata-rata per-track (gatewayReceivedAt - timestamp) + RTT/2.
 *      = average latency setiap track dari BE sampai Browser.
 *   4. Durasi streaming = selisih waktu terima ID terakhir - ID pertama di FE (same-clock).
 */

import { TrackData } from '../../types/RadarTrack';
import { commandLogger } from './commandLogger';
import { driftManager } from './driftManager';
import { formatLoggerTime } from '../formatters';
import { integrityManager } from './integrityManager';
import { LOGGER_STYLES, getTimeHeader } from '../colors';

// Cetak summary setiap N siklus
const SUMMARY_EVERY_N_CYCLES = 5;

class RadarLogger {
  private enabled: boolean = true;

  /**
   * Audit data dari siklus terakhir yang lengkap (ID 0 s/d ID terakhir sudah diterima).
   * Semua timestamp disimpan mentah — konversi dilakukan saat print.
   */
  private audit = {
    t_be_command_received: 0,
    lastCompletedCycle: {
      t0_be_timestamp: 0,        // timestamp burst dari BE (WSL clock)
      t0_gateway_received: 0,    // gateway Date.now() saat terima ID 0 (WSL clock)
      t0_fe_received: 0,         // FE arrival saat terima ID 0 (Windows clock)
      tLast_gateway_received: 0, // gateway Date.now() saat terima ID terakhir
      tLast_fe_received: 0,      // FE arrival saat terima ID terakhir
      isValid: false
    }
  };

  private activeCycle = {
    t0_be_timestamp: 0,
    t0_gateway_received: 0,
    t0_fe_received: 0,
  };

  private stats = {
    count: 0,
    totalBytes: 0,
    totalLatGateway: 0,   // akumulasi latency BE→Gateway (akurat, same clock)
    cycleCount: 0,
    startTime: performance.now(),
  };

  private stressStats = {
    SQUARE: { count: 0, totalBytes: 0, totalLat: 0 },
    CIRCLE: { count: 0, totalBytes: 0, totalLat: 0 },
    TRIANGLE: { count: 0, totalBytes: 0, totalLat: 0 },
    lastPrint: performance.now()
  };

  private receivedIds = new Set<number>();

  public logIncomingPackets(
    data: unknown,
    tracks: TrackData[],
    targetCount: number,
    rawLength?: number
  ): void {
    this.stats.count += tracks.length;
    const byteSize = rawLength ?? (tracks.length * 150);
    this.stats.totalBytes += byteSize;

    const arrivalTime = driftManager.now();

    tracks.forEach(track => {
      // Latency BE→Gateway (same WSL clock — akurat)
      const latGateway = Math.max(0, track.gatewayReceivedAt - track.timestamp);
      this.stats.totalLatGateway += latGateway;

      this.receivedIds.add(track.trackId);

      if (track.trackId === 0) {
        this.activeCycle.t0_be_timestamp = track.timestamp;
        this.activeCycle.t0_gateway_received = track.gatewayReceivedAt;
        this.activeCycle.t0_fe_received = arrivalTime;
        this.audit.t_be_command_received = track.commandReceivedAt;
        this.stats.cycleCount++;

        commandLogger.logCommandArrival(track.commandReceivedAt);
      }

      const lastExpectedId = targetCount - 1;
      if (track.trackId === lastExpectedId && track.trackId !== 0) {
        this.audit.lastCompletedCycle = {
          t0_be_timestamp: this.activeCycle.t0_be_timestamp,
          t0_gateway_received: this.activeCycle.t0_gateway_received,
          t0_fe_received: this.activeCycle.t0_fe_received,
          tLast_gateway_received: track.gatewayReceivedAt,
          tLast_fe_received: arrivalTime,
          isValid: true
        };
      }
    });

    // Cetak per N siklus
    if (this.stats.cycleCount > 0 && this.stats.cycleCount % SUMMARY_EVERY_N_CYCLES === 0) {
      this.printSummary(targetCount);
      this.resetStats(performance.now());
    }
  }

  public logStressPacket(data: {
    trackId: number,
    shape: 'SQUARE' | 'CIRCLE' | 'TRIANGLE',
    timestamp: number,
    gatewayReceivedAt: number
  }): void {
    if (!this.enabled) return;

    const stats = this.stressStats[data.shape];
    stats.count++;
    stats.totalBytes += 100;

    // Stress: latency BE→Gateway (same clock, akurat)
    const cleanLat = Math.max(0, data.gatewayReceivedAt - data.timestamp);
    stats.totalLat += cleanLat;

    const now = performance.now();
    if (now - this.stressStats.lastPrint > 5000) {
      this.printStressSummary();
      this.resetStressStats(now);
    }
  }

  private printStressSummary(): void {
    console.groupCollapsed(`%c Stress Test Report (${getTimeHeader()})`, 'color: #f472b6; font-weight: bold;');
    (['SQUARE', 'CIRCLE', 'TRIANGLE'] as const).forEach(shape => {
      const stats = this.stressStats[shape];
      if (stats.count === 0) return;
      const duration = (performance.now() - this.stressStats.lastPrint) / 1000;
      const throughput = (stats.totalBytes / 1024) / duration;
      const avgLat = stats.totalLat / stats.count;
      console.log(
        `%c[${shape}] %cPackets: %c${stats.count} %c| Throughput: %c${throughput.toFixed(2)} KB/s %c| Avg Lat: %c${avgLat.toFixed(2)}ms`,
        'color: #f472b6; font-weight: bold;',
        'color: #9ca3af;', 'color: #fff;',
        'color: #9ca3af;', 'color: #fff;',
        'color: #9ca3af;', 'color: #fff;'
      );
    });
    console.groupEnd();
  }

  private resetStressStats(now: number): void {
    this.stressStats.SQUARE = { count: 0, totalBytes: 0, totalLat: 0 };
    this.stressStats.CIRCLE = { count: 0, totalBytes: 0, totalLat: 0 };
    this.stressStats.TRIANGLE = { count: 0, totalBytes: 0, totalLat: 0 };
    this.stressStats.lastPrint = now;
  }

  public logFeToBeSend(targetCount: number): void {
    commandLogger.logCommandSend(targetCount);
  }

  /**
   * Print summary sesuai format standar pengujian.
   *
   * Format:
   *   Radar Periodic Report (HH:MM:SS)
   *   =========================
   *   [ Be > gateway > FE ]
   *   =========================
   *   Packets          : N
   *   Avg Latency      : X.XXms  (GW X.XXms + WS X.XXms)   ← per-track avg to Browser
   *   Throughput       : X.XX KB/s
   *   -------------------------------------------
   *   Total Track Diterima : N
   *   ID Verification      : LENGKAP / N MISSING
   *   -------------------------------------------
   *   Transmission → Gateway : X.XXms  (first sent → last received at GW)
   *   Transmission → Browser : X.XXms  (Gateway + WS RTT/2)
   *   -------------------------------------------
   *   Waktu Kirim ID 0   : HH:MM:SS.mmm
   *   Waktu Terima ID 0  : HH:MM:SS.mmm
   *   Latensi ID 0       : X.XXms
   *   -------------------------------------------
   *   Waktu Terima ID N  : HH:MM:SS.mmm
   *   Durasi streaming   : X.XXms
   *   -------------------------------------------
   */
  private printSummary(targetCount: number): void {
    if (!this.enabled) return;

    const duration = (performance.now() - this.stats.startTime) / 1000;
    const throughput = (this.stats.totalBytes / 1024) / duration;

    // Gateway→Browser segment: diukur akurat via WebSocket RTT/2
    const gwToBrowser = driftManager.getRtt();

    // Avg Latency = rata-rata per-track (BE→Gateway) + RTT/2 = per-track BE→Browser
    // Definisi tabel: "averaging measured time when each track data transmitted
    //                  until track data received in Browser"
    const avgLatGateway = this.stats.count > 0
      ? (this.stats.totalLatGateway / this.stats.count)
      : 0;
    const avgLatency = avgLatGateway + gwToBrowser;

    const cycle = this.audit.lastCompletedCycle;

    // === Transmission Times (dari siklus terakhir yang lengkap) ===
    // Definisi tabel: "time when first track data transmitted until
    //                  last track data received in Gateway/Browser"
    // BE→Gateway: first sent (t0_be_timestamp) → last received at GW (tLast_gateway_received)
    const txToGateway = cycle.isValid
      ? Math.max(0, cycle.tLast_gateway_received - cycle.t0_be_timestamp)
      : 0;

    // BE→Browser: txToGateway + RTT/2 (last track masih butuh transit WebSocket)
    const txToBrowser = txToGateway + gwToBrowser;

    // Latensi ID 0: gateway-relative (akurat)
    const latId0_gateway = cycle.isValid
      ? (cycle.t0_gateway_received - cycle.t0_be_timestamp)
      : 0;

    // Durasi streaming: ID terakhir diterima FE - ID pertama diterima FE (same FE clock, akurat)
    const streamingDuration = cycle.isValid
      ? Math.max(0, cycle.tLast_fe_received - cycle.t0_fe_received)
      : 0;

    // ====================== PRINT ======================
    console.groupCollapsed(
      `%c Radar Periodic Report (${getTimeHeader()})`,
      LOGGER_STYLES.header
    );

    console.log(`%c=========================`, LOGGER_STYLES.separator);
    console.log(`%c[ Be > gateway > FE ]`, LOGGER_STYLES.section);
    console.log(`%c=========================`, LOGGER_STYLES.separator);

    console.log(
      `%cPackets          : %c${this.stats.count}`,
      LOGGER_STYLES.label, LOGGER_STYLES.value
    );
    console.log(
      `%cAvg Latency      : %c${avgLatency.toFixed(2)}ms  (GW ${avgLatGateway.toFixed(2)}ms + WS ${gwToBrowser.toFixed(2)}ms)`,
      LOGGER_STYLES.label, LOGGER_STYLES.value
    );
    console.log(
      `%cThroughput       : %c${throughput.toFixed(2)} KB/s`,
      LOGGER_STYLES.label, LOGGER_STYLES.value
    );

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

      console.log(
        `%cTransmission → Gateway : %c${txToGateway.toFixed(2)}ms  (ID 0 sent → ID ${lastId} received at GW)`,
        LOGGER_STYLES.label, LOGGER_STYLES.duration
      );
      console.log(
        `%cTransmission → Browser : %c${txToBrowser.toFixed(2)}ms  (Gateway ${txToGateway.toFixed(2)}ms + WS ${gwToBrowser.toFixed(2)}ms)`,
        LOGGER_STYLES.label, LOGGER_STYLES.duration
      );

      console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);

      // Waktu kirim = BE burst timestamp (WSL clock)
      // Untuk display, kita tampilkan apa adanya — biarkan user tahu ini waktu BE
      console.log(
        `%cWaktu Kirim ID 0   : %c${formatLoggerTime(cycle.t0_be_timestamp)}`,
        LOGGER_STYLES.label, LOGGER_STYLES.value
      );
      console.log(
        `%cWaktu Terima ID 0  : %c${formatLoggerTime(cycle.t0_gateway_received)}`,
        LOGGER_STYLES.label, LOGGER_STYLES.value
      );
      console.log(
        `%cLatensi ID 0 : %c${latId0_gateway.toFixed(2)}ms`,
        LOGGER_STYLES.label,
        latId0_gateway >= 0 && latId0_gateway < 500 ? LOGGER_STYLES.value : 'color: #ef4444'
      );

      console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);

      console.log(
        `%cWaktu Terima ID ${lastId} : %c${formatLoggerTime(cycle.tLast_gateway_received)}`,
        LOGGER_STYLES.label, LOGGER_STYLES.value
      );
      console.log(
        `%cDurasi streaming (id awal kirim di be -> id akhir diterima fe) : %c${streamingDuration.toFixed(2)}ms`,
        LOGGER_STYLES.label, LOGGER_STYLES.duration
      );

      console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    } else {
      console.log(
        '%c[!] Siklus belum lengkap untuk audit presisi.',
        'color: #f59e0b'
      );
    }

    console.groupEnd();
  }

  private resetStats(now: number): void {
    this.stats.count = 0;
    this.stats.totalBytes = 0;
    this.stats.totalLatGateway = 0;
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