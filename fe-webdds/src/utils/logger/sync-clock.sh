#!/bin/bash

# ==============================================================================
# SCRIPT: sync-clock.sh
# DESCRIPTION: Menyelaraskan jam antara WSL2 dan Windows dengan presisi tinggi.
# ==============================================================================

# Ambil waktu secara sekuensial untuk meminimalkan jitter startup powershell
# Kita ambil Windows dulu karena startup-nya paling lama
win_time_base=$(powershell.exe -NoProfile -Command "Get-Date -Format 'HH:mm:ss.fff'" 2>/dev/null | tr -d '\r')
wsl_time=$(date +"%T.%3N")

# Jika powershell gagal, gunakan fallback tanpa milidetik
if [ -z "$win_time_base" ]; then
    win_time_base=$(powershell.exe -NoProfile -Command "Get-Date -Format 'HH:mm:ss'" 2>/dev/null | tr -d '\r')
    win_time="${win_time_base}.000"
else
    win_time=$win_time_base
fi

# Konversi ke MS
wsl_ms=$(echo "$wsl_time" | awk -F'[:.]' '{print ($1 * 3600000) + ($2 * 60000) + ($3 * 1000) + $4}')
win_ms=$(echo "$win_time" | awk -F'[:.]' '{print ($1 * 3600000) + ($2 * 60000) + ($3 * 1000) + $4}')

diff=$((wsl_ms - win_ms))

# Logika Snap-to-Sync yang lebih ketat (hanya jika di bawah 5ms)
abs_diff=${diff#-}
if [ "$abs_diff" -le 5 ]; then
    diff=0
fi

echo "-------------------------------------------"
echo "   CLOCK SYNC REPORT (Precision Sync)"
echo "wsl2:    $wsl_time"
echo "windows: $win_time"
echo ""
echo "selisih waktu: ${diff} ms"
echo "-------------------------------------------"

OUTPUT_FILE="$(dirname "$0")/clockDriftData.ts"

cat <<EOF > "$OUTPUT_FILE"
/**
 * @file clockDriftData.ts
 * GENERATED AUTOMATICALLY BY sync-clock.sh
 * DO NOT EDIT MANUALLY.
 */
export const clockSyncResult = {
  wslTime: "$wsl_time",
  windowsTime: "$win_time",
  diffMs: $diff,
  timestamp: "$(date +'%Y-%m-%dT%H:%M:%S')"
};
EOF

