#!/usr/bin/env bash
set -e

MASTER_CACHE_DIR="/home/chandreu/master-cache-docker"
CMAKE_FILE="cmake-3.31.3-linux-x86_64.tar.gz"
OPENDDS_FILE="OpenDDS-3.29.1.zip"

CMAKE_URL="https://github.com/Kitware/CMake/releases/download/v3.31.3/cmake-3.31.3-linux-x86_64.tar.gz"
OPENDDS_URL="https://docs.len-iot.id/s/xm9zTrTASaBxd8p/download/OpenDDS-3.29.1.zip"

echo "=== Setup Dependensi Build Offline (Opsi B: Master Cache Terpusat) ==="

# 1. Pastikan folder master cache tersedia
if [ ! -d "$MASTER_CACHE_DIR" ]; then
    echo " Membuat folder master cache di: $MASTER_CACHE_DIR"
    mkdir -p "$MASTER_CACHE_DIR"
else
    echo " Folder master cache ditemukan di: $MASTER_CACHE_DIR"
fi

# 2. Cek dan Unduh CMake ke Master Cache jika belum ada
if [ ! -f "$MASTER_CACHE_DIR/$CMAKE_FILE" ]; then
    echo " Mengunduh CMake ke master cache..."
    curl -L -o "$MASTER_CACHE_DIR/$CMAKE_FILE" "$CMAKE_URL"
else
    echo " CMake sudah tersedia di master cache (melewati proses unduh)."
fi

# 3. Cek dan Unduh OpenDDS ke Master Cache jika belum ada
if [ ! -f "$MASTER_CACHE_DIR/$OPENDDS_FILE" ]; then
    echo " Mengunduh OpenDDS ke master cache..."
    curl -L -o "$MASTER_CACHE_DIR/$OPENDDS_FILE" "$OPENDDS_URL"
else
    echo " OpenDDS sudah tersedia di master cache (melewati proses unduh)."
fi

# 4. Distribusikan file dari Master Cache ke folder project lokal saat ini
echo " Mendistribusikan file dari Master Cache ke direktori service lokal..."

echo "   -> Menyalin $CMAKE_FILE ke ./be-stream-odds-cpp/"
cp "$MASTER_CACHE_DIR/$CMAKE_FILE" ./be-stream-odds-cpp/

echo "   -> Menyalin $OPENDDS_FILE ke ./be-stream-odds-cpp/"
cp "$MASTER_CACHE_DIR/$OPENDDS_FILE" ./be-stream-odds-cpp/

echo "   -> Menyalin $OPENDDS_FILE ke ./gateway-ddsweb/"
cp "$MASTER_CACHE_DIR/$OPENDDS_FILE" ./gateway-ddsweb/

echo "=== Selesai! Lingkungan build lokal siap digunakan secara offline. ==="
