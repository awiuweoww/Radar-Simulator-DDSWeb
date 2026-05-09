/**
 * @file clockDriftData.ts
 * GENERATED AUTOMATICALLY BY sync-clock.sh v2 (Race-Corrected)
 * DO NOT EDIT MANUALLY.
 *
 * Metode: 5 sampel → median, dengan koreksi setengah overhead powershell.
 * diffMs > 0 : WSL lebih cepat dari Windows (timestamp WSL > Windows)
 * diffMs < 0 : WSL lebih lambat dari Windows (timestamp WSL < Windows)
 */
export const clockSyncResult = {
  wslTime: "14:25:17.300",
  windowsTime: "14:25:17.993",
  diffMs: -330,
  sampleCount: 5,
  allSamples: [-368,-330,-331,-321,-317],
  timestamp: "2026-05-09T14:25:18"
};
