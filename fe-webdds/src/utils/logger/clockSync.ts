import { clockSyncResult } from './clockDriftData';

/**
 * @file clockSync.ts
 * @description Menampilkan hasil sinkronisasi jam di Browser Console.
 * Diimpor di entry point project agar muncul saat awal dijalankan.
 */

export function reportClockSync() {
  const { wslTime, windowsTime, diffMs } = clockSyncResult;

  const styleHdr = 'color: #60a5fa; font-weight: bold; font-size: 11px';
  const styleSuccess = 'color: #34d399; font-weight: bold';
  const styleWarn = 'color: #f59e0b; font-weight: bold';
  const styleLabel = 'color: #d1d5db';
  const styleValue = 'color: #ffffff; background: #374151; padding: 1px 4px; border-radius: 3px';

  console.groupCollapsed('%c System Clock Synchronization Report', styleHdr);
  console.log(`%cwsl2:    %c${wslTime}`, styleLabel, styleValue);
  console.log(`%cwindows: %c${windowsTime}`, styleLabel, styleValue);
  console.log('');
  
  if (diffMs === 0) {
    console.log(`%cselisih waktu: %c${diffMs} ms (SINKRON )`, styleLabel, styleSuccess);
  } else {
    console.log(`%cselisih waktu: %c${diffMs} ms (DRIFT )`, styleLabel, styleWarn);
    console.warn('Deteksi selisih jam antara WSL dan Windows. Harap sinkronkan jika diperlukan.');
  }
  console.groupEnd();
}

// Jalankan otomatis saat file ini di-load
reportClockSync();
