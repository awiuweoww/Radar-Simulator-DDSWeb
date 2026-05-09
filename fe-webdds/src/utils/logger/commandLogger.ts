/**
 * @file commandLogger.ts
 * @description Auditor performa pengiriman command dari Frontend ke Backend.
 * Fokus pada aliran [ Fe > gateway > BE ].
 */

import { driftManager } from './driftManager';
import { formatLoggerTime } from '../formatters';
import { LOGGER_STYLES, getTimeHeader } from '../colors';

class CommandLogger {
  private enabled: boolean = true;

  private audit = {
    feSendTime: 0,        
    feReceiveTime: 0,     
    beProcessingTime: 0,  
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
   * 
   * @param beCommandReceivedAt Kapan command sampai di BE (WSL Clock)
   * @param beTrackTimestamp Kapan track ID 0 dikirim oleh BE (WSL Clock)
   */
  public logCommandArrival(beCommandReceivedAt: number, beTrackTimestamp: number): void {
    if (!this.audit.isPendingReport || this.audit.feSendTime <= 0) return;
    
    if (beCommandReceivedAt > 0 && beTrackTimestamp >= beCommandReceivedAt) {
      this.audit.beProcessingTime = beTrackTimestamp - beCommandReceivedAt;
    }
    this.audit.feReceiveTime = driftManager.now();
    this.printReport();
    this.audit.isPendingReport = false;
  }

  private printReport(): void {
    if (!this.enabled) return;
    const { feSendTime, feReceiveTime, beProcessingTime, payloadSize, targetCount } = this.audit;
  
    const rtt = feReceiveTime - feSendTime;
    
    const networkTransit = Math.max(0, rtt - beProcessingTime);
    const oneWayTransit = networkTransit / 2;
 
    console.groupCollapsed(`%c Command Performance [Fe > gateway > BE] (${getTimeHeader()})`, LOGGER_STYLES.commandHeader);
    console.log(`%c=========================`, LOGGER_STYLES.separator);
    console.log(`%cTarget Objects    : %c${targetCount}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cPayload Size      : %c${payloadSize} bytes`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cThroughput (Est)  : %c${(payloadSize / Math.max(1, rtt)).toFixed(2)} KB/s`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    console.log(`%cWaktu Kirim FE    : %c${formatLoggerTime(feSendTime)}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%cWaktu Terima FE   : %c${formatLoggerTime(feReceiveTime)}`, LOGGER_STYLES.label, LOGGER_STYLES.value);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    
    console.log(`%cRound Trip (RTT)  : %c${rtt.toFixed(2)} ms  (Total waktu tunggu)`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%cBE Logic Delay    : %c${beProcessingTime.toFixed(2)} ms  (Waktu BE proses objek)`, LOGGER_STYLES.label, 'color: #f59e0b');
    console.log(`%cNetwork Transit   : %c${networkTransit.toFixed(2)} ms  (Total transit Gateway+WS)`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%cOne-way (est)     : %c${oneWayTransit.toFixed(2)} ms  (Transit searah)`, LOGGER_STYLES.label, LOGGER_STYLES.duration);
    console.log(`%c${LOGGER_STYLES.sepLine}`, LOGGER_STYLES.separator);
    
    console.groupEnd();
  }
}

export const commandLogger = new CommandLogger();
