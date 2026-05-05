/**
 * @file commandLogger.ts
 * @description Auditor performa pengiriman command dari Frontend (Windows) ke Backend (WSL).
 * Fokus pada aliran [ Fe > gateway > BE ].
 */


import { driftManager } from './driftManager';
import { formatLoggerTime } from '../formatters';
import { LOGGER_STYLES, getTimeHeader } from '../colors';

class CommandLogger {
  private enabled: boolean = true;

  private audit = {
    feSendTime: 0,
    beReceiveTime: 0,
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
   * Mencatat waktu saat BE menerima command (data dari track pertama).
   * @param beTime Waktu mentah dari sistem WSL/Backend
   */
  public logCommandArrival(beTime: number): void {
    if (!this.audit.isPendingReport || beTime <= 0) return;

    this.audit.beReceiveTime = beTime;
    this.printReport();
    this.audit.isPendingReport = false;
  }

  private printReport(): void {
    if (!this.enabled) return;
    const { feSendTime, beReceiveTime, payloadSize, targetCount } = this.audit;
    
    const normalizedBeTime = driftManager.normalize(beReceiveTime);
    const latency = normalizedBeTime - feSendTime;
 
    console.group(`%c Command Performance [Fe > gateway > BE] (${getTimeHeader()})`, LOGGER_STYLES.commandHeader);
    console.log(`%c=========================`, LOGGER_STYLES.separator);
    console.log(`%cTarget Objects    : %c${targetCount}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cPayload Size      : %c${payloadSize} bytes`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cThroughput (Est)  : %c${(payloadSize / Math.max(1, latency)).toFixed(2)} KB/s`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    console.log(`%cWaktu Kirim FE    : %c${formatLoggerTime(feSendTime)}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cWaktu Terima BE   : %c${formatLoggerTime(normalizedBeTime)}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    console.log(`%cDurasi Pengiriman : %c${latency.toFixed(2)} ms`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%c(Latency)         : %c${latency.toFixed(2)} ms`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    
    if (latency < 0) {
      console.warn('%c Latensi negatif terdeteksi! Periksa sinkronisasi jam WSL (npm run sync-clock).', 'color: #ef4444');
    }
    
    console.groupEnd();
  }
}

export const commandLogger = new CommandLogger();
