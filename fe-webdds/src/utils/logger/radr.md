# Dokumentasi Teknis Performa Radar WebDDS

Dokumen ini menjelaskan sumber data, rumus, dan contoh penghitungan untuk semua log performa yang muncul di Console Browser.

---

## 1. Aliran Kendali [ FE > gateway > BE ]
*Log ini muncul saat Anda menekan tombol "Start" atau mengubah jumlah track.*

### A. Payload Size
- **Asal Data**: Panjang string JSON yang dikirim melalui WebSocket.
- **Rumus**: `JSON.stringify({ action, value }).length` (dalam satuan Bytes).

### B. Throughput (Est)
- **Rumus**: `PayloadSize (Bytes) / Latency (ms)`

### C. Round-Trip Time (RTT) Command
- **Definisi**: Total waktu dari klik tombol di FE sampai FE menerima respons data pertama (ID 0).
- **Rumus**: `T_Receive_ID0_FE - T_Send_Command_FE`.

### D. BE Processing Time (Logic Delay)
- **Definisi**: Jeda waktu internal di C++ saat memproses perintah sebelum burst data pertama dikirim.
- **Rumus**: `T_First_Track_Sent_BE - T_Command_Received_BE` (Menggunakan WSL Clock).

---

## 2. Aliran Data Radar [ BE > gateway > FE ]
*Log ini muncul secara periodik setiap 5 detik (Radar Periodic Report).*

### A. Packets (5s window)
- **Rumus**: `count = count + tracks.length`

### B. Avg Latency (End-to-End)
- **Asal Data**: Rata-rata selisih waktu semua paket setelah dikompensasi **Static Clock Offset**.
- **Rumus**: `Sum(Waktu_Terima_FE - (Waktu_Kirim_BE + StaticOffset)) / Total_Packets`

### C. Throughput (Radar)
- **Rumus**: `Throughput = (Total_Accumulated_Bytes / 1024) / 5 detik`

---

## 3. Audit Siklus (Burst Audit)
*Log ini menggunakan data dari siklus lengkap terakhir (ID 0 s/d ID Terakhir).*

### A. Transmission Time to Gateway
- **Rumus**: `T_Last_Gateway_Received - T_First_BE_Sent` (Keduanya dalam skala waktu WSL).

### B. Transmission Time to Browser
- **Rumus**: `T_Last_FE_Received - (T_First_BE_Sent + StaticOffset)`

### C. Durasi Streaming (Burst Spread)
- **Definisi**: Rentang waktu kedatangan paket di sisi Browser (dari ID 0 sampai ID terakhir).
- **Rumus**: `T_Last_FE_Received - T_First_FE_Received`

---

## 4. MultiTopic & Race Condition Monitoring
*Metrik khusus untuk memantau sinkronisasi antar topik (Radar, Square, Circle, Triangle).*

### A. Race Condition Report (Startup)
- **Fungsi**: Mencatat urutan topik mana yang paling cepat sampai di Browser saat simulasi pertama kali dimulai.
- **Jendela Pengukuran**: Menggunakan timeout **3 detik** untuk mengumpulkan semua topik.
- **Urutan**: Menentukan "Winner" dan menghitung delay topik lainnya relatif terhadap pemenang.

### B. MultiTopic Sync Audit (Periodic)
- **Arsitektur Master-Slave**: `RadarLogger` bertindak sebagai Master yang memicu laporan `StressLogger`.
- **Integritas Data**: Melakukan verifikasi ID (0 s/d N) untuk semua topik secara bersamaan berdasarkan Timestamp Sumber yang sama.

---

## 5. Network Health & RTT Probing
*Metrik tambahan untuk mengukur kualitas koneksi secara real-time antara Gateway dan Browser.*

### A. Mekanisme WebSocket Ping/Pong (Gateway-to-Browser)
Sistem melakukan probing aktif setiap 3 detik untuk mendapatkan angka latensi jaringan yang murni:
1.  **FE (Browser)**: Mengirim paket JSON `{"__ping": timestamp}` melalui WebSocket yang sedang aktif.
2.  **Gateway (Node.js)**: Mendeteksi kunci `__ping`, lalu secara instan memantulkannya kembali (*echo*) dalam format `{"__pong": timestamp}` tanpa melibatkan logika DDS.
3.  **FE (Browser)**: Menghitung selisih waktu saat pong diterima dengan timestamp yang tersimpan di dalam paket tersebut.
    - **Rumus RTT**: `T_Terima_Pong - T_Kirim_Ping`.
    - **One-Way Latency**: `RTT / 2`.

### B. Manfaat Audit RTT
- **Akurasi Latensi**: Digunakan oleh `radarLogger` untuk memecah Avg Latency menjadi: `(BE to Gateway) + (Gateway to Browser)`.
- **Adaptive Sync**: Membantu `driftManager` menentukan seberapa besar kompensasi waktu yang harus diberikan pada visualisasi agar tetap sinkron dengan jam asli.

---

## 6. Ilustrasi Garis Waktu Performa (Lengkap)

Bayangkan Backend mengirim **3000 data Radar** dan **1000 data Square** secara bersamaan:

```text
SKALA WAKTU (ms) --->
0ms          10ms          20ms          30ms          40ms          50ms          60ms          70ms
|             |             |             |             |             |             |             |
[BACKEND C++ (WSL)]
|-- (T: 0ms) RADAR ID 0 dikirim 
|-- (T: 0.01ms) SQUARE ID 0 dikirim (setelah jeda micro-delay 10us)
|-- (T: 30ms) RADAR ID 2999 selesai dikirim (Burst Radar Selesai)
|-- (T: 40ms) SQUARE ID 999 selesai dikirim (Burst Square Selesai)
|
|         [GATEWAY NODEJS (WSL)]
|         |-- (T: 12ms) RADAR ID 0 tiba di Gateway
|         |-- (T: 12.5ms) SQUARE ID 0 tiba di Gateway
|         |-- (T: 45ms) RADAR ID 2999 tiba (Gateway Tx Time: 45ms)
|
|                                [BROWSER / FE (Windows - Normalized)]
|                                |-- (T: 27ms) RADAR ID 0 Tiba (WINNER: Race Logger mencatat 27ms)
|                                |-- (T: 28ms) SQUARE ID 0 Tiba (SQUARE Delay: +1.0ms)
|                                |-- (T: 60ms) RADAR ID 2999 Tiba (Burst Radar Complete)
|                                |-- (T: 72ms) SQUARE ID 999 Tiba (Burst Square Complete)
|
|                                [AUDIT HASIL DI KONSOL BROWSER]
|                                1. Race Monitor: RADAR [1.], SQUARE [2.] Delay +1.0ms
|                                2. Transmission to Browser (Radar): 60ms - 0ms = 60ms
|                                3. Burst Spread (Radar): 60ms - 27ms = 33ms
```

---

## 7. Ringkasan Tugas Performa

| Pengukuran | Komponen Terlibat | Siapa yang Menghitung? |
| :--- | :--- | :--- |
| **FE > BE** | Browser -> Gateway -> C++ | `commandLogger.ts` |
| **BE > FE** | C++ -> Gateway -> Browser | `radarLogger.ts` |
| **MultiTopic** | Sinkronisasi All Topics | `stressLogger.ts` |
| **Race Monitor** | Urutan Kedatangan Awal | `raceLogger.ts` |
| **Clock Sync** | Windows Clock & WSL Clock | `driftManager.ts` |

---

## 8. Glosarium Peristilahan

- **Static Clock Offset (v2)**: Selisih jam WSL-Windows yang dihitung oleh `sync-clock.sh` dengan mengambil median 5 sampel dan koreksi overhead PowerShell.
- **Adaptive Drift**: Estimasi latensi minimum jaringan untuk stabilisasi visualisasi.
- **Burst**: Satu kelompok data radar yang dikirimkan secara bersamaan dalam satu siklus.
- **Master-Slave Reporting**: Mekanisme sinkronisasi log di mana satu logger utama mengontrol kapan logger lain mencetak laporannya.
