/**
 * @file raceLogger.ts
 * @description Auditor urutan kedatangan topik (Race Condition Monitor).
 * Mencatat topik mana yang sampai duluan di FE untuk satu siklus timestamp yang sama.
 */

import { getTimeHeader, LOGGER_STYLES } from '../colors';
import { formatLoggerTime } from '../formatters';

interface ArrivalRecord {
  topic: string;
  feTime: number;
  feAbsTime: number;
}

class RaceLogger {
  private batchMap = new Map<number, ArrivalRecord[]>();
  private processedBatches = new Set<number>();
  private hasPrintedFirst: boolean = false;

  public reset(): void {
    this.hasPrintedFirst = false;
    this.batchMap.clear();
    this.processedBatches.clear();
  }

  /**
   * Mencatat kedatangan paket pertama dari suatu topik dalam satu siklus.
   */
  public logArrival(topic: string, sourceTimestamp: number): void {
    if (this.hasPrintedFirst || this.processedBatches.has(sourceTimestamp)) return;

    if (!this.batchMap.has(sourceTimestamp)) {
      this.batchMap.set(sourceTimestamp, []);
      setTimeout(() => this.printRaceReport(sourceTimestamp), 5000);
    }

    const records = this.batchMap.get(sourceTimestamp)!;

    if (!records.find(r => r.topic === topic)) {
      records.push({
        topic,
        feTime: performance.now(),
        feAbsTime: Date.now()
      });
      console.debug(`[RaceLogger] Batch ${sourceTimestamp} updated: ${topic} arrived. Total: ${records.length}`);
    }

    if (topic === "RADAR" && !this.hasPrintedFirst) {
      setTimeout(() => this.printRaceReport(sourceTimestamp), 5000);
    }
    
    if (records.length >= 4 && !this.hasPrintedFirst) {
      this.printRaceReport(sourceTimestamp);
    }
  }

  private printRaceReport(sourceTimestamp: number): void {
    const records = this.batchMap.get(sourceTimestamp);
    if (!records || this.hasPrintedFirst) return;

    const hasRadar = records.some(r => r.topic === "RADAR");
    
    const isComplete = records.length >= 4;
    
    if (hasRadar && isComplete) {
      this.hasPrintedFirst = true;
      this.processedBatches.add(sourceTimestamp);

      const sorted = [...records].sort((a, b) => a.feTime - b.feTime);

      console.log(`%c[ MultiTopic RACE CONDITION ] (${getTimeHeader()})`, "color: #f472b6; font-weight: bold;");
      console.log(`%cUrutan kedatangan paket pertama di FE (Initial Burst - LENGKAP):`, "color: #9ca3af; font-style: italic;");

      sorted.forEach((r, i) => {
        const isWinner = i === 0;
        const topicLabel = `%c[${i + 1}.] topic ${r.topic.padEnd(10)} %c| `;
        if (isWinner) {
          console.log(`${topicLabel}%c${formatLoggerTime(r.feAbsTime)}`, "color: #fff;", "color: #9ca3af;", "color: #34d399; font-weight: bold;");
        } else {
          const delay = r.feTime - sorted[0].feTime;
          console.log(`${topicLabel}%cDelay: +${delay.toFixed(2)}ms`, "color: #fff;", "color: #9ca3af;", "color: #fca5a5;");
        }
      });
      console.log(`%c----------------------------------------------`, LOGGER_STYLES.separator);

      setTimeout(() => this.batchMap.delete(sourceTimestamp), 5000);
    }
  }

  public getRaceData(sourceTimestamp: number): { topic: string, delay: number, firstTime?: string }[] | null {
    const records = this.batchMap.get(sourceTimestamp);
    if (!records || records.length < 1) return null;

    const sorted = [...records].sort((a, b) => a.feTime - b.feTime);
    return sorted.map((r, i) => ({
      topic: r.topic,
      delay: i === 0 ? 0 : (r.feTime - sorted[0].feTime),
      firstTime: i === 0 ? formatLoggerTime(r.feAbsTime) : undefined
    }));
  }
}

export const raceLogger = new RaceLogger();
