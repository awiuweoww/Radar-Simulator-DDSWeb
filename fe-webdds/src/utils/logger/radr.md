# Dokumentasi Teknis Performa Radar WebDDS

Dokumen ini menjelaskan sumber data, rumus, dan contoh penghitungan untuk semua log performa yang muncul di Console Browser.

---

## 1. Aliran Kendali [ FE > gateway > BE ]
*Log ini muncul saat Anda menekan tombol "Start" atau mengubah jumlah track.*

### A. Payload Size
- **Asal Data**: Panjang string JSON yang dikirim melalui WebSocket.
- **Rumus**: `JSON.stringify({ action, value }).length` (dalam satuan Bytes).
- **Contoh**: Jika mengirim `{"action":"START","value":3000}`, panjangnya adalah **31 bytes**.

### B. Throughput (Est)
- **Asal Data**: Hasil bagi antara ukuran data dan waktu tempuh.
- **Rumus**: `PayloadSize (Bytes) / Latency (ms)`
- **Contoh**: Payload **31 bytes**, Latensi **19.2ms**.
  - Hitung: `31 / 19.2 = 1.61 KB/s`.
  - *(Catatan: Bytes/ms secara matematis sama nilainya dengan KB/s).*

### C. Durasi Pengiriman (Latency)
- **Asal Data**: Selisih antara waktu kirim di FE dan waktu tiba di BE.
- **Rumus**: `(Waktu_Terima_BE + Drift) - Waktu_Kirim_FE`
- **Contoh**:
  - FE Kirim: `17:10:00.000`
  - BE Terima (Normal): `17:10:00.015`
  - Hasil: **15.00 ms**.

---

## 2. Aliran Data Radar [ BE > gateway > FE ]
*Log ini muncul secara periodik setiap 5 detik (Radar Periodic Report).*

### A. Packets (5s window)
- **Asal Data**: Counter internal di `radarLogger.ts` yang bertambah setiap ada track baru masuk.
- **Rumus**: `count = count + tracks.length`
- **Contoh**: Jika interval BE adalah **1000ms** (1 detik) dan mengirim **3000 track** per siklus:
  - Dalam 5 detik akan diterima **5 siklus** data.
  - Total paket: `5 siklus x 3000 track = 15.000 paket`.

### B. Avg Latency (End-to-End)
- **Asal Data**: Rata-rata selisih waktu semua paket setelah dikompensasi **Static Clock Offset**.
- **Rumus**: `Sum(Waktu_Terima_FE - (Waktu_Kirim_BE + StaticOffset)) / Total_Packets`
- **Tujuan**: Mengukur latensi jaringan *rill* dari BE ke FE tanpa terpengaruh perbedaan jam antar OS.

### C. Throughput (Radar)
- **Asal Data**: Ukuran asli string JSON yang diterima melalui WebSocket.
- **Lokasi Pengambilan**: 
  1.  **`src/utils/api/webdds.ts`**: Menangkap event WebSocket mentah (`event.data.length`).
  2.  **`src/utils/api/radarApi.ts`**: Meneruskan ukuran (`rawLength`) ke logger.
- **Rumus**: `Throughput = (Total_Accumulated_Bytes / 1024) / 5 detik`

---

## 3. Audit Siklus (Burst Audit)
*Log ini menggunakan data dari siklus lengkap terakhir (ID 0 s/d ID Terakhir).*

### A. Transmission Time to Gateway
- **Definisi**: Total waktu dari saat BE mengirim track pertama (ID 0) sampai Gateway selesai menerima track terakhir dalam satu burst.
- **Rumus**: `T_Last_Gateway_Received - T_First_BE_Sent` (Keduanya dalam skala waktu WSL).

### B. Transmission Time to Browser
- **Definisi**: Total waktu dari saat BE mengirim track pertama (ID 0) sampai Browser selesai menerima track terakhir.
- **Rumus**: `T_Last_FE_Received - (T_First_BE_Sent + StaticOffset)`
- **Tujuan**: Mengukur waktu penyelesaian pengiriman satu "rombongan" data secara utuh dari hulu ke hilir.

### C. Durasi Streaming (Burst Spread)
- **Definisi**: Lebar atau rentang waktu kedatangan paket di sisi Browser (dari ID 0 sampai ID terakhir).
- **Rumus**: `T_Last_FE_Received - T_First_FE_Received`
- **Analogi**: Jika rombongan dikirim serentak tapi sampai satu-per-satu dengan jeda, maka Durasi Streaming akan bernilai besar.

### D. Latensi Murni ID 0
- **Rumus**: `Waktu_Terima_ID0_FE - (Waktu_Kirim_ID0_BE + StaticOffset)`

---

## 4. Ilustrasi Garis Waktu Performa (Lengkap)

Bayangkan Backend mengirim **30 data** sekaligus dalam satu "rombongan" (Burst):

```text
SKALA WAKTU (ms) --->
0ms          10ms          20ms          30ms          40ms          50ms
|             |             |             |             |             |
[BE KIRIM] (WSL)
|-- ID 0 dikirim (0ms)
|-- ID 1...28
|-- ID 29 dikirim (0.5ms) -> BE mengirim sangat cepat (hampir serentak)
|
|
|         [GATEWAY TERIMA] (WSL)
|         |-- ID 0 tiba (12ms)
|         |-- ID 29 tiba (13ms)
|         |
|         [METRIK GATEWAY]
|         * Transmission Time to Gateway: 13ms - 0ms = 13ms
|
|
|                                [BROWSER TERIMA] (Windows - Normalized)
|                                |-- ID 0 tiba (27ms)
|                                |-- ID 1...28 menyusul
|                                |-- ID 29 tiba (39ms)
|                                |
|                                [METRIK BROWSER / FE]
|                                1. Avg Latency (E2E): Rata-rata dari semua ID.
|                                   Contoh: ~33ms
|
|                                2. Transmission Time to Browser: 39ms - 0ms = 39ms
|                                   (Total waktu dari Hulu ke Hilir)
|
|                                3. Durasi Streaming (Spread): 39ms - 27ms = 12ms
|                                   (Seberapa lebar data berceceran di browser)
```

---

## 5. Ringkasan Tugas Performa

| Pengukuran | Komponen Terlibat | Siapa yang Menghitung? |
| :--- | :--- | :--- |
| **FE > BE** | Browser -> Gateway -> C++ | `commandLogger.ts` |
| **BE > FE** | C++ -> Gateway -> Browser | `radarLogger.ts` |
| **Clock Sync** | Windows Clock & WSL Clock | `driftManager.ts` |

---

## 6. Glosarium Peristilahan

- **Static Clock Offset**: Selisih jam antara WSL dan Windows yang dihitung oleh `sync-clock.sh`. Nilai ini bersifat tetap dan digunakan sebagai baseline sinkronisasi.
- **Adaptive Drift**: Estimasi latensi minimum jaringan yang dipelajari sistem secara real-time. Digunakan untuk menstabilkan visualisasi (menghilangkan jitter).
- **Burst**: Satu kelompok data radar yang dikirimkan secara bersamaan dalam satu siklus frekuensi (misal: 3000 track dikirim sekaligus).

