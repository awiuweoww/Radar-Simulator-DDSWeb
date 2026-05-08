/**
 * @file commandLogger.ts
 * @description Auditor performa pengiriman command dari Frontend ke Backend.
 * Fokus pada aliran [ Fe > gateway > BE ].
 *
 * FIXED: Menggunakan round-trip measurement (same FE clock) untuk akurasi.
 * - RTT = waktu dari FE kirim command sampai FE terima track ID 0 pertama kembali.
 * - One-way estimate = RTT / 2
 * - Semua timestamp dari Clock B (FE) → tidak ada cross-clock error.
 */

import { driftManager } from './driftManager';
import { formatLoggerTime } from '../formatters';
import { LOGGER_STYLES, getTimeHeader } from '../colors';

class CommandLogger {
  private enabled: boolean = true;

  private audit = {
    feSendTime: 0,        // Clock B: saat FE kirim command
    feReceiveTime: 0,     // Clock B: saat FE terima track ID 0 pertama
    targetCount: 0,
    payloadSize: 0,
    isPendingReport: false,
  };

  /**
   * Mencatat waktu saat FE mengirim command (saat user klik Start).
   * @param targetCount Jumlah objek yang diminta
   */
  public logCommandSend(targetCount: number): void {
    this.audit.feSendTime = driftManager.now();
    this.audit.targetCount = targetCount;
    
    const payload = JSON.stringify({ action: 'START', value: targetCount });
    this.audit.payloadSize = payload.length;
    this.audit.isPendingReport = true;
  }

  /**
   * Mencatat waktu saat FE menerima data pertama kembali dari BE (track ID 0).
   * Ini menandakan command sudah sampai ke BE dan BE sudah mulai mengirim data.
   *
   * RTT = feReceiveTime - feSendTime (kedua Clock B, akurat 100%)
   * One-way ≈ RTT / 2
   */
  public logCommandArrival(_beTime: number): void {
    if (!this.audit.isPendingReport || this.audit.feSendTime <= 0) return;

    // Catat waktu FE menerima response (Clock B — same clock dengan feSendTime)
    this.audit.feReceiveTime = driftManager.now();
    this.printReport();
    this.audit.isPendingReport = false;
  }

  private printReport(): void {
    if (!this.enabled) return;
    const { feSendTime, feReceiveTime, payloadSize, targetCount } = this.audit;
    
    // RTT: FE kirim command → FE terima track ID 0 (same Clock B, akurat)
    const rtt = feReceiveTime - feSendTime;
    const oneWay = rtt / 2;
 
    console.group(`%c Command Performance [Fe > gateway > BE] (${getTimeHeader()})`, LOGGER_STYLES.commandHeader);
    console.log(`%c=========================`, LOGGER_STYLES.separator);
    console.log(`%cTarget Objects    : %c${targetCount}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cPayload Size      : %c${payloadSize} bytes`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cThroughput (Est)  : %c${(payloadSize / Math.max(1, rtt)).toFixed(2)} KB/s`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    console.log(`%cWaktu Kirim FE    : %c${formatLoggerTime(feSendTime)}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cWaktu Terima FE   : %c${formatLoggerTime(feReceiveTime)}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    console.log(`%cRound Trip (RTT)  : %c${rtt.toFixed(2)} ms  (FE send → FE receive ID 0)`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%cOne-way (est)     : %c${oneWay.toFixed(2)} ms  (RTT / 2)`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    
    console.groupEnd();
  }
}

export const commandLogger = new CommandLogger();
