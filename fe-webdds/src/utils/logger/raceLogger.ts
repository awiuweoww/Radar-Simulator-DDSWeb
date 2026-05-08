/**
 * @file raceLogger.ts
 * @description Auditor urutan kedatangan topik (Race Condition Monitor).
 * Membandingkan topik mana yang sampai duluan di FE untuk satu siklus timestamp yang sama.
 */

import { getTimeHeader } from '../colors';

interface ArrivalRecord {
  topic: string;
  feTime: number;
}

class RaceLogger {
  // Map <SourceTimestamp, ArrivalRecord[]>
  private batchMap = new Map<number, ArrivalRecord[]>();
  private processedBatches = new Set<number>();

  /**
   * Mencatat kedatangan paket pertama dari suatu topik dalam satu siklus.
   */
  public logArrival(topic: string, sourceTimestamp: number): void {
    if (this.processedBatches.has(sourceTimestamp)) return;

    if (!this.batchMap.has(sourceTimestamp)) {
      this.batchMap.set(sourceTimestamp, []);
      
      // Berikan waktu 1 detik untuk mengumpulkan semua topik di siklus ini sebelum di-print
      setTimeout(() => this.printRaceReport(sourceTimestamp), 1000);
    }

    const records = this.batchMap.get(sourceTimestamp)!;
    
    // Kita hanya catat kedatangan PERTAMA dari topik ini untuk siklus ini
    if (!records.find(r => r.topic === topic)) {
      records.push({
        topic,
        feTime: performance.now()
      });
    }
  }

  private printRaceReport(sourceTimestamp: number): void {
    const records = this.batchMap.get(sourceTimestamp);
    if (!records || records.length < 2) {
      this.batchMap.delete(sourceTimestamp);
      return;
    }

    // Urutkan berdasarkan waktu kedatangan di FE
    const sorted = [...records].sort((a, b) => a.feTime - b.feTime);
    this.processedBatches.add(sourceTimestamp);
    this.batchMap.delete(sourceTimestamp);

    // Bersihkan processedBatches agar tidak memory leak (simpan 100 batch terakhir saja)
    if (this.processedBatches.size > 100) {
      const firstKey = this.processedBatches.values().next().value;
      if (firstKey !== undefined) this.processedBatches.delete(firstKey);
    }

    console.groupCollapsed(`%c [RACE CONDITION] Cycle ${sourceTimestamp} (${getTimeHeader()})`, "color: #fbbf24; font-weight: bold;");
    console.log("%cTopik yang sampai duluan ditentukan oleh urutan di bawah ini:", "color: #9ca3af;");
    
    sorted.forEach((record, index) => {
      const diff = index === 0 ? 0 : (record.feTime - sorted[0].feTime);
      const icon = index === 0 ? "🥇" : "🥈";
      const color = index === 0 ? "color: #fcd34d; font-weight: bold;" : "color: #fff;";
      
      console.log(`%c${icon} #${index + 1}: %c${record.topic.padEnd(20)} %c| Delay: %c+${diff.toFixed(3)}ms`,
        "font-size: 14px;",
        color,
        "color: #6b7280;",
        index === 0 ? "color: #34d399;" : "color: #f87171;"
      );
    });

    console.log(`%cTotal "Race Duration": ${(sorted[sorted.length-1].feTime - sorted[0].feTime).toFixed(3)}ms`, "color: #9ca3af; font-style: italic;");
    console.groupEnd();
  }
}

export const raceLogger = new RaceLogger();
