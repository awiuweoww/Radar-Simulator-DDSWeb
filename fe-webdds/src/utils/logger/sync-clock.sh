#!/bin/bash

# ==============================================================================
# SCRIPT: sync-clock.sh (FIXED v2)
# DESCRIPTION: Menyelaraskan jam antara WSL2 dan Windows dengan presisi tinggi.
#
# FIX v2:
#   1. Race condition: WSL diambil SEBELUM dan SESUDAH powershell, lalu
#      diffMs dikoreksi dengan setengah overhead eksekusi powershell.
#   2. Dead zone 5ms dihapus — selisih kecil tetap dicatat apa adanya.
#   3. Pengukuran diulang 5x, lalu diambil median untuk stabilitas.
# ==============================================================================

NUM_SAMPLES=5
SAMPLES=()

for i in $(seq 1 $NUM_SAMPLES); do
    # --- Langkah 1: Catat waktu WSL sebelum powershell dipanggil ---
    wsl_before=$(date +"%T.%3N")

    # --- Langkah 2: Ambil waktu Windows (ini yang makan waktu ~50ms) ---
    win_raw=$(powershell.exe -NoProfile -Command "Get-Date -Format 'HH:mm:ss.fff'" 2>/dev/null | tr -d '\r')

    # --- Langkah 3: Catat waktu WSL setelah powershell selesai ---
    wsl_after=$(date +"%T.%3N")

    # Fallback jika powershell gagal
    if [ -z "$win_raw" ]; then
        win_raw=$(date +"%T.%3N")  # pakai WSL sementara jika powershell mati
    fi

    # --- Konversi semua ke millisecond ---
    to_ms() {
        echo "$1" | awk -F'[:.]' '{print ($1 * 3600000) + ($2 * 60000) + ($3 * 1000) + $4}'
    }

    ms_before=$(to_ms "$wsl_before")
    ms_after=$(to_ms "$wsl_after")
    ms_win=$(to_ms "$win_raw")

    # --- Koreksi Race Condition ---
    # Overhead = waktu yang dihabiskan powershell (ms)
    overhead=$((ms_after - ms_before))

    # Estimasi: Windows diambil di tengah jeda, jadi koreksi setengah overhead
    # wsl_effective = titik tengah antara sebelum dan sesudah
    ms_wsl_effective=$(( (ms_before + ms_after) / 2 ))

    # diff = WSL_efektif - Windows
    diff=$((ms_wsl_effective - ms_win))

    SAMPLES+=($diff)

    # Jeda kecil antar sampel
    sleep 0.1
done

# --- Hitung Median dari 5 sampel ---
sorted=($(printf "%d\n" "${SAMPLES[@]}" | sort -n))
mid=$(( NUM_SAMPLES / 2 ))
MEDIAN=${sorted[$mid]}

# --- Hitung rata-rata overhead powershell (informatif) ---
echo "-------------------------------------------"
echo "   CLOCK SYNC REPORT v2 (Race-Corrected)"
echo "-------------------------------------------"
echo "Sampel diff (ms): ${SAMPLES[@]}"
echo "Median digunakan: ${MEDIAN} ms"
echo ""
echo "selisih waktu (final): ${MEDIAN} ms"
echo "-------------------------------------------"
echo ""
echo "Keterangan:"
echo "  + = WSL lebih cepat dari Windows"
echo "  - = WSL lebih lambat dari Windows"
echo "  0 = sinkron (dalam batas ±1ms)"
echo "-------------------------------------------"

# --- Tulis ke clockDriftData.ts ---
OUTPUT_FILE="$(dirname "$0")/clockDriftData.ts"

cat <<EOF > "$OUTPUT_FILE"
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
  wslTime: "$(date +"%T.%3N")",
  windowsTime: "$(powershell.exe -NoProfile -Command "Get-Date -Format 'HH:mm:ss.fff'" 2>/dev/null | tr -d '\r')",
  diffMs: ${MEDIAN},
  sampleCount: ${NUM_SAMPLES},
  allSamples: [$(IFS=,; echo "${SAMPLES[*]}")],
  timestamp: "$(date +'%Y-%m-%dT%H:%M:%S')"
};
EOF

echo " clockDriftData.ts berhasil diperbarui."