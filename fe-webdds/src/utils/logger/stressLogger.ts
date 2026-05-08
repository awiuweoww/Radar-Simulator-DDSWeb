/**
 * @file stressLogger.ts
 * @description Auditor performa khusus untuk data Stress Test (Square, Circle, Triangle).
 * Menghitung latensi transmisi dan verifikasi kelengkapan data beban tinggi.
 */

import { driftManager } from './driftManager';
import { LOGGER_STYLES, getTimeHeader } from '../colors';

interface StressData {
  trackId: number;
  shape: 'SQUARE' | 'CIRCLE' | 'TRIANGLE';
  timestamp: number;
  gatewayReceivedAt: number;
}

class StressLogger {
  private enabled: boolean = false;

  private stats = {
    SQUARE: { count: 0, totalLat: 0, totalBytes: 0, receivedIds: new Set<number>(), lastCycle: { txGateway: 0, txBrowser: 0, avgLat: 0, isComplete: false } },
    CIRCLE: { count: 0, totalLat: 0, totalBytes: 0, receivedIds: new Set<number>(), lastCycle: { txGateway: 0, txBrowser: 0, avgLat: 0, isComplete: false } },
    TRIANGLE: { count: 0, totalLat: 0, totalBytes: 0, receivedIds: new Set<number>(), lastCycle: { txGateway: 0, txBrowser: 0, avgLat: 0, isComplete: false } }
  };
  private lastPrint = performance.now();

  public logStressPacket(data: StressData, targetCount: number): void {
    if (!this.enabled) return;

    const shapeStats = this.stats[data.shape];
    shapeStats.count++;
    shapeStats.totalBytes += 100; // Estimasi ukuran paket stress
    shapeStats.receivedIds.add(data.trackId);

    const arrivalTime = driftManager.now();
    const cleanLat = arrivalTime - (data.timestamp + driftManager.getStaticOffset());
    shapeStats.totalLat += Math.max(0, cleanLat);

    // Hitung transmisi saat mencapai ID terakhir dalam satu burst
    if (data.trackId === targetCount - 1) {
      const txToGateway = data.gatewayReceivedAt - data.timestamp;
      const t0_sent_windows = data.timestamp + driftManager.getStaticOffset();
      const txToBrowser = arrivalTime - t0_sent_windows;
      const avgLat = shapeStats.totalLat / shapeStats.count;
      const isComplete = shapeStats.receivedIds.size === targetCount;

      shapeStats.lastCycle = {
        txGateway: txToGateway,
        txBrowser: txToBrowser,
        avgLat: avgLat,
        isComplete: isComplete
      };

      // Cetak laporan setiap burst selesai untuk topik ini (atau interval tertentu)
      this.printCycleReport(data.shape, targetCount);
      this.resetCycle(data.shape);
    }
  }

  private printCycleReport(shape: keyof typeof this.stats, targetCount: number): void {
    const shapeStats = this.stats[shape];
    const cycle = shapeStats.lastCycle;
    
    // Deteksi ID yang hilang
    const missingIds: number[] = [];
    for (let i = 0; i < targetCount; i++) {
      if (!shapeStats.receivedIds.has(i)) missingIds.push(i);
    }
    const isComplete = missingIds.length === 0;

    console.groupCollapsed(`%c [STRESS] ${shape} Cycle Report (${getTimeHeader()})`, "color: #f472b6; font-weight: bold;");
    console.log(`%c=========================`, LOGGER_STYLES.separator);
    
    console.groupCollapsed(`%cID Verification   : %c${isComplete ? 'LENGKAP' : missingIds.length + ' MISSING'}`, 
      LOGGER_STYLES.label, isComplete ? LOGGER_STYLES.value : 'color: #ef4444');
    
    if (!isComplete) {
      console.log(`%cMissing IDs: %c${missingIds.length > 20 ? missingIds.slice(0, 20).join(', ') + '... (total ' + missingIds.length + ')' : missingIds.join(', ')}`, 
        'color: #fca5a5', 'color: #ef4444; font-family: monospace');
    } else {
      console.log('%cSemua ID (0 s/d ' + (targetCount - 1) + ') diterima tanpa celah.', 'color: #34d399');
    }
    
    const idsArray = Array.from(shapeStats.receivedIds).sort((a, b) => a - b);
    console.log('%cFull Received ID List:', 'color: #9ca3af', idsArray);
    console.groupEnd();

    console.log(`%c---------------------------`, LOGGER_STYLES.separator);
    console.log(`%cTransmission Time to Gateway : %c${cycle.txGateway.toFixed(2)}ms`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%cTransmission Time to Browser : %c${cycle.txBrowser.toFixed(2)}ms`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%cAvg Latency (End-to-End)      : %c${cycle.avgLat.toFixed(2)}ms`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%c=========================`, LOGGER_STYLES.separator);
    console.groupEnd();
  }

  private resetCycle(shape: keyof typeof this.stats): void {
    const s = this.stats[shape];
    if (typeof s === 'object' && 'receivedIds' in s) {
        s.count = 0;
        s.totalLat = 0;
        s.totalBytes = 0;
        s.receivedIds.clear();
    }
  }
}

export const stressLogger = new StressLogger();
