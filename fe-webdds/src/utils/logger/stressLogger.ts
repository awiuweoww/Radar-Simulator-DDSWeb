import { radarLogger } from './radarLogger';
import { raceLogger } from './raceLogger';
import { getTimeHeader, LOGGER_STYLES } from '../colors';

interface StressData {
  shape: string;
  trackId: number;
  timestamp: number;
  gatewayReceivedAt: number;
}

interface TopicStats {
  receivedIds: Set<number>;
  lastBurstTimestamp: number;
  targetCount: number;
}

class StressLogger {
  private enabled: boolean = true;

  // Map untuk menyimpan history stats per timestamp agar tidak tertimpa data baru
  // Key: SourceTimestamp, Value: Map<Shape, TopicStats>
  private historyStats = new Map<number, Map<string, TopicStats>>();
  private activeTopics = new Set<string>(['RADAR', 'SQUARE', 'CIRCLE', 'TRIANGLE', 'PARALLELOGRAM', 'TRAPEZOID', 'RHOMBUS', 'ELLIPSE', 'PENTAGON', 'HEXAGON']);
  private isReportPending: boolean = false;
  private reportTimeout: any = null;

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public logStressPacket(data: StressData, targetCount: number): void {
    if (!this.enabled) return;

    const shape = data.shape || 'RADAR';
    const ts = data.timestamp;
    this.activeTopics.add(shape);

    // Inisialisasi map untuk timestamp ini jika belum ada
    if (!this.historyStats.has(ts)) {
      this.historyStats.set(ts, new Map());

      // Bersihkan history lama (simpan maksimal 10 timestamp terakhir)
      if (this.historyStats.size > 10) {
        const oldestKey = this.historyStats.keys().next().value;
        if (oldestKey !== undefined) this.historyStats.delete(oldestKey);
      }
    }

    const timestampMap = this.historyStats.get(ts)!;

    if (!timestampMap.has(shape)) {
      timestampMap.set(shape, {
        receivedIds: new Set<number>(),
        lastBurstTimestamp: ts,
        targetCount: targetCount
      });
    }

    const s = timestampMap.get(shape)!;

    // Auto-adjust targetCount: Jika kita menerima ID lebih besar dari targetCount saat ini, 
    // berarti targetCount yang di-hardcode di FE salah. Kita ikuti data dari BE.
    if (data.trackId >= s.targetCount) {
      s.targetCount = data.trackId + 1;
    }

    s.receivedIds.add(data.trackId);
  }

  /**
   * Dipanggil oleh RadarLogger untuk mensinkronkan siklus laporan
   */
  public triggerSyncReport(targetTimestamp: number): void {
    if (this.isReportPending) return;
    this.isReportPending = true;

    if (this.reportTimeout) clearTimeout(this.reportTimeout);

    // Jeda 1200ms agar data topik lain di timestamp yang sama pasti sudah sampai
    this.reportTimeout = setTimeout(() => {
      this.printMultiTopicReport(targetTimestamp);
      this.isReportPending = false;
    }, 1200);
  }

  private printMultiTopicReport(targetTimestamp: number): void {
    if (!this.enabled) return;

    const topicsToDisplay = ['RADAR', 'SQUARE', 'CIRCLE', 'TRIANGLE', 'PARALLELOGRAM', 'TRAPEZOID', 'RHOMBUS', 'ELLIPSE', 'PENTAGON', 'HEXAGON'];
    const timestampMap = this.historyStats.get(targetTimestamp);

    console.groupCollapsed(`%c [ MultiTopic RACE REPORT ] (${getTimeHeader()})`, "color: #f472b6; font-weight: bold; font-size: 14px;");


    topicsToDisplay.forEach(shape => {
      console.log(`%c---------------------------------`, LOGGER_STYLES.separator);
      console.log(`%c[Topic ${shape}]`, "color: #60a5fa; font-weight: bold;");

      let receivedCount = 0;
      let tCount = 0;
      let missingIds: number[] = [];
      let isComplete = false;
      let statusWaiting = false;
      let idsArray: number[] = [];

      if (shape === 'RADAR') {
        const radarStatus = radarLogger.getLatestIntegrity();
        if (radarStatus.timestamp === targetTimestamp) {
          receivedCount = radarStatus.receivedCount;
          tCount = radarStatus.targetCount;
          missingIds = radarStatus.missingIds || [];
          isComplete = radarStatus.isComplete;
        } else {
          statusWaiting = true;
        }
      } else {
        const s = timestampMap ? timestampMap.get(shape) : null;
        if (!s) {
          statusWaiting = true;
        } else {
          receivedCount = s.receivedIds.size;
          tCount = s.targetCount;
          idsArray = Array.from(s.receivedIds).sort((a, b) => a - b);

          for (let i = 0; i < tCount; i++) {
            if (!s.receivedIds.has(i)) missingIds.push(i);
          }
          isComplete = missingIds.length === 0;
        }
      }

      if (statusWaiting) {
        console.log(`%cStatus: %cWAITING / NO DATA IN THIS CYCLE`, LOGGER_STYLES.label, "color: #9ca3af; font-style: italic;");
      } else {
        console.log(`%cTotal Track Diterima (per siklus): %c${receivedCount}`, LOGGER_STYLES.label, LOGGER_STYLES.value);

        console.groupCollapsed(`%cID Verification   : %c${isComplete ? 'LENGKAP' : missingIds.length + ' MISSING'}`, LOGGER_STYLES.label, isComplete ? LOGGER_STYLES.value : 'color: #ef4444');

        if (isComplete) {
          console.log(`%cSemua ID (0 s/d ${tCount - 1}) diterima tanpa celah.`, 'color: #34d399');
        } else {
          console.log(`%cMissing IDs: %c${missingIds.join(', ')}`, 'color: #fca5a5');
        }

        if (idsArray.length > 0) {
          console.log('%cFull Received ID List:', 'color: #9ca3af', idsArray);
        }
        console.groupEnd();
      }
    });

    console.log(`%c==============================================`, LOGGER_STYLES.separator);
    console.groupEnd();
  }
}

export const stressLogger = new StressLogger();
