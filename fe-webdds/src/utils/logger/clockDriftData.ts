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
  wslTime: "10:55:10.083",
  windowsTime: "10:55:10.356",
  diffMs: -126,
  sampleCount: 5,
  allSamples: [-135,-124,-126,-120,-127],
  timestamp: "2026-05-08T10:55:10"
};
