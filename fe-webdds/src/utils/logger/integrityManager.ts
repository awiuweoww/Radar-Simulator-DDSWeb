/**
 * @file integrityManager.ts
 * @description Mengelola deteksi kehilangan data (data drop) pada streaming radar.
 */

class IntegrityManager {
  private enabled: boolean = false;
  
  private state = {
    targetReached: false,
    maxObserved: 0,
    lastDropLog: 0,
    lastTargetCount: 0
  };

  /**
   * Mendeteksi penurunan jumlah data di bawah target yang diminta.
   * @param currentCount Jumlah objek yang saat ini diterima
   * @param targetCount Jumlah objek yang diminta (target)
   */
  public logDataDrop(currentCount: number, targetCount: number): void {
    if (!this.enabled || targetCount <= 0) return;

    if (this.state.lastTargetCount !== targetCount) {
      this.state.targetReached = false;
      this.state.maxObserved = 0;
      this.state.lastTargetCount = targetCount;
    }

    if (!this.state.targetReached) {
      if (currentCount >= targetCount) {
        this.state.targetReached = true;
        this.state.maxObserved = currentCount;
        console.log(`%c Target ${targetCount} tercapai. Monitoring drop diaktifkan.`, 'color: #22c55e; font-weight: bold');
      }
      return;
    }

    if (currentCount === 0) {
      this.state.targetReached = false;
      return;
    }

    if (currentCount < targetCount) {
      const now = Date.now();
      if (now - this.state.lastDropLog > 1000) {
        console.warn(
          `%c  DATA DROP DETECTED! %c Bukti: Data turun menjadi ${currentCount}/${targetCount} (Missing: ${targetCount - currentCount})`,
          'color: #ffffff; background: #ef4444; padding: 2px 5px; border-radius: 3px;',
          'color: #ef4444; font-weight: bold'
        );
        this.state.lastDropLog = now;
      }
    } else {
      this.state.maxObserved = Math.max(this.state.maxObserved, currentCount);
    }
  }
  
  public reset(): void {
    this.state.targetReached = false;
    this.state.maxObserved = 0;
    this.state.lastDropLog = 0;
  }
}

export const integrityManager = new IntegrityManager();
