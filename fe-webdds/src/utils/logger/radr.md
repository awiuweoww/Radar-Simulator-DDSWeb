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

### B. Avg Latency
- **Asal Data**: Rata-rata selisih waktu semua paket setelah dikompensasi Drift.
- **Rumus**: `Sum(Waktu_Terima_FE - (Waktu_Kirim_BE + Drift)) / Total_Packets`
- **Contoh**: Jika total akumulasi latensi adalah `4.135.000 ms` dari `3.917` paket.
  - Hitung: `4.135.000 / 3.917 = 1055.65 ms`.

### C. Throughput (Radar)
- **Asal Data**: Ukuran asli string JSON yang diterima melalui WebSocket.
- **Lokasi Pengambilan**: 
  1.  **`src/utils/api/webdds.ts`**: Di sini sistem menangkap event WebSocket mentah. Ukuran data diambil menggunakan `event.data.length` (jumlah karakter dalam string JSON).
  2.  **`src/utils/api/radarApi.ts`**: Menerima ukuran tersebut (`rawLength`) dan meneruskannya ke fungsi `logIncomingPackets`.
- **Rumus**: `Throughput = (Total_Accumulated_Bytes / 1024) / 5 detik`
- **Contoh**:
  - Diterima 1 siklus data berisi 3000 track.
  - Panjang string JSON gabungan tersebut adalah **450.000 bytes** (sekitar 440 KB).
  - Jika dalam 5 detik ada 5 siklus: `Total = 450.000 x 5 = 2.250.000 bytes`.
  - Hitung: `(2.250.000 / 1024) / 5 = 439.45 KB/s`.

---

## 3. Audit Siklus (Burst Audit)
*Log ini menggunakan data dari siklus lengkap terakhir (ID 0 s/d ID Terakhir).*

### A. Waktu Kirim ID 0 (Pertama)
- **Rumus**: `Normalize(Track0.timestamp)` → `Track0.timestamp + Drift`
- **Contoh**: `17:17:23.680 (Mentah) + 2324.30ms (Drift) = 17:17:26.004`.

### B. Latensi Murni ID 0
- **Rumus**: `Waktu_Terima_ID0_FE - Normalized_Kirim_ID0_BE`
- **Contoh**:
  - Terima: `17:17:25.714`
  - Kirim (Norm): `17:17:26.004`
  - Hitung: `...714 - ...004 = -290.00 ms`.
  - *(Catatan: Jika minus, berarti Drift Adaptif sedang mengejar perubahan jam yang drastis).*

### C. Durasi Streaming (End-to-End)
- **Rumus**: `Waktu_Terima_ID_Terakhir_FE - Normalized_Kirim_ID0_BE`
- **Contoh**:
  - Terima ID 2999: `17:17:25.724`
  - Kirim ID 0 (Norm): `17:17:26.004`
  - Hitung: `...724 - ...004 = -280 ms` (dibulatkan ke `0.00ms` oleh `Math.max(0,...)`).

---

## 4. Simulasi Lengkap Clock Drift (Plus vs Mines)

Asumsi:
- **Interval Pengiriman di BE**: 20ms (Waktu dari ID 0 ke ID terakhir).
- **Latensi Jaringan Asli**: 5ms.

### Skenario A: Drift PLUS (+100ms)
*Artinya: Jam Windows 100ms lebih CEPAT dari jam WSL.*

| Metrik | Proses / Rumus | Hasil Simulasi |
| :--- | :--- | :--- |
| **Waktu Kirim BE (ID 0)** | Data lahir di WSL | `09:00:00.000` |
| **Waktu Kirim BE (ID Akhir)**| Data lahir di WSL | `09:00:00.020` |
| **Waktu Terima FE (ID 0)** | 5ms Jaringan + 100ms Selisih Jam | `09:00:00.105` |
| **Waktu Terima FE (ID Akhir)**| 5ms Jaringan + 100ms Selisih Jam | `09:00:00.125` |
| **Clock Drift Terdeteksi** | `T_terima - T_kirim` (min) | `+100.00 ms` |
| **Normalized Kirim ID 0** | `000 + 100` | `09:00:00.100` |
| **Latensi Murni ID 0** | `105 - 100` | **5.00 ms** |
| **Durasi Streaming** | `125 (Terima Akhir) - 100 (Kirim 0 Norm)` | **25.00 ms** |

---

### Skenario B: Drift MINES (-100ms)
*Artinya: Jam Windows 100ms lebih LAMBAT dari jam WSL.*

| Metrik | Proses / Rumus | Hasil Simulasi |
| :--- | :--- | :--- |
| **Waktu Kirim BE (ID 0)** | Data lahir di WSL | `09:00:00.100` |
| **Waktu Kirim BE (ID Akhir)**| Data lahir di WSL | `09:00:00.120` |
| **Waktu Terima FE (ID 0)** | 5ms Jaringan - 100ms Selisih Jam | `09:00:00.005` |
| **Waktu Terima FE (ID Akhir)**| 5ms Jaringan - 100ms Selisih Jam | `09:00:00.025` |
| **Clock Drift Terdeteksi** | `T_terima - T_kirim` (min) | `-100.00 ms` |
| **Normalized Kirim ID 0** | `100 + (-100)` | `09:00:00.000` |
| **Latensi Murni ID 0** | `005 - 000` | **5.00 ms** |
| **Durasi Streaming** | `025 (Terima Akhir) - 000 (Kirim 0 Norm)` | **25.00 ms** |

---

## 5. Ringkasan Tugas Performa

| Pengukuran | Komponen Terlibat | Siapa yang Menghitung? |
| :--- | :--- | :--- |
| **FE > BE** | Browser -> Gateway -> C++ | `commandLogger.ts` |
| **BE > FE** | C++ -> Gateway -> Browser | `radarLogger.ts` |
| **Clock Sync** | Windows Clock & WSL Clock | `driftManager.ts` |

> [!TIP]
> Jika Anda melihat **Latensi Murni** bernilai minus yang besar (seperti `-289ms`), itu tandanya beban CPU sangat tinggi sehingga jam WSL melambat secara ekstrem. Segera lakukan `wsl --shutdown` untuk mereset kondisi kernel.