# Panduan Pengujian Performa Radar

Untuk mengisi tabel performa yang Anda miliki, kita perlu menangkap metrik dari tiga lapisan: **Backend (BE)**, **Gateway**, dan **Browser (FE)**.

## 1. Status Implementasi Metrik
Saya telah memperbarui kode untuk mengotomatiskan pengukuran beberapa kolom di Browser Console:

| Metrik | Status | Cara Mendapatkan |
| :--- | :--- | :--- |
| **Transmission Time to Gateway** | ✅ Terimplementasi | Lihat di Browser Console (Radar Logger) |
| **Transmission Time to Browser** | ✅ Terimplementasi | Lihat di Browser Console (Radar Logger) |
| **Avg. Latency** | ✅ Terimplementasi | Lihat di Browser Console (Radar Logger) |
| **Memory Usage (MB)** | 🔍 Gunakan Tools | Lihat bagian "Monitoring Resource" |
| **CPU Usage (%)** | 🔍 Gunakan Tools | Lihat bagian "Monitoring Resource" |

---

## 2. Tools Monitoring Resource

Karena penggunaan Memory dan CPU bersifat sistem-level, gunakan tools berikut selama pengujian:

### A. Untuk Backend & Gateway (WSL/Linux)
Gunakan `pidstat` di terminal WSL untuk monitoring presisi per-proses.
1. **Cari PID**:
   ```bash
   # Cari PID BE
   pgrep be-stream
   # Cari PID Gateway
   pgrep node
   ```
2. **Monitor**:
   ```bash
   # Monitor CPU dan Memory setiap 1 detik
   pidstat -u -r 1 -p <PID_BE>,<PID_GATEWAY>
   ```
   * *Catatan:* Ambil nilai rata-rata `%CPU` dan `RSS (MB)` selama burst data berlangsung.

### B. Untuk Browser (Windows/Chrome)
1. Tekan `F12` > Pilih tab **Performance Monitor** (Cari di menu "More tools" atau titik tiga).
2. Tab ini akan menunjukkan **CPU Usage** dan **JS Heap Size** secara real-time.

---

## 3. Skenario Pengujian

Ikuti urutan ini untuk mengisi tabel Anda:

1. **Persiapan**: Jalankan `sync-clock.sh` di folder logger frontend untuk memastikan sinkronisasi waktu WSL-Windows.
2. **Siklus Pengujian**:
   - Tentukan **Number of Tracks** (misal: 100) dan **Frequency** (misal: 10 Hz) di UI Simulator.
   - Klik **Start Streaming**.
   - Tunggu ~10 detik agar statistik di Browser Console stabil.
   - **Catat**:
     - `Transmission Time to Gateway` (dari console)
     - `Transmission Time to Browser` (dari console)
     - `Avg Latency` (dari console)
     - `CPU/Mem` dari `pidstat` (untuk BE/Gateway) dan Chrome (untuk Browser).

---

## 4. Tips Agar Data Akurat
- **Stabilisasi**: Biarkan stream berjalan minimal 5 detik sebelum mencatat data.
- **Environment**: Tutup aplikasi yang tidak perlu (Teams, Slack, dll) agar tidak ada lonjakan CPU yang mengganggu hasil.
- **Restart Gateway**: Karena saya baru saja mengubah `gateway-ddsweb/server.js`, **Anda wajib me-restart proses Gateway** agar logic `gatewayReceivedAt` mulai berjalan.
