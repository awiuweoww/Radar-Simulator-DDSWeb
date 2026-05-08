# Stream Radar WebDDS v2

Proyek ini adalah implementasi sistem **Radar Simulator** berbasis arsitektur *Pub/Sub* menggunakan standar **OMG DDS-WEB**. Sistem ini menggabungkan keandalan *middleware* OpenDDS (C++) tingkat militer dengan ekosistem aplikasi antarmuka web modern untuk mensimulasikan dan me-render ribuan objek radar secara *real-time*.

## Struktur Monorepo

Proyek ini terstruktur dalam desain *Monorepo* yang dibagi menjadi beberapa layanan utama:

1. **[be-stream-odds-cpp](./be-stream-odds-cpp)** (Backend)
   *   Engine simulator radar berkinerja tinggi yang ditulis dalam bahasa C++.
   *   Berperan sebagai *DataWriter* (Publisher) untuk koordinat target objek, dan sebagai *DataReader* (Subscriber) untuk menangkap perintah kontrol pengguna.
   *   Mengandalkan protokol bawaan OpenDDS (RTPS/UDP) untuk distribusi data berkecepatan tinggi.

2. **[gateway-ddsweb](./gateway-ddsweb)** (Gateway/Bridge)
   *   Layanan Node.js yang bertugas menjembatani ekosistem tertutup C++ DDS agar terbuka bagi Web.
   *   Menggunakan *C++ Node.js binding* (`opendds`) untuk membaca biner C++ dan menserialisasikannya menjadi *JSON string* (*fastJson*).
   *   Menyediakan fasilitas REST API untuk menginjeksi perintah Web ke C++, dan soket WebSocket untuk mengalirkan paket C++ ke Web.

3. **[fe-webdds](./fe-webdds)** (Frontend)
   *   Aplikasi antarmuka pemantauan radar berbasis React & Rspack.
   *   Bertugas menangkap aliran WebSocket dan me-render puluhan ribu pergerakan objek secara halus di atas kanvas peta (OpenLayers/Mapbox).
   *   Memberikan kontrol kepada operator untuk merubah pengaturan simulasi (misal: mengatur total target simulasi ke 5000 objek).

4. **[radarsimulator-dokumentasi](./radarsimulator-dokumentasi)** (Dokumentasi)
   *   Buku panduan ensiklopedi teoretis, struktur arsitektur (QoS), dan *troubleshooting* daftar pesan *error* (Segfault).

## Panduan Menjalankan Sistem (*Quick Start*)

Sistem dipecah menjadi tiga bagian yang harus dijalankan di terminal yang terpisah (*split-terminal*). 
**Perhatian:** Untuk Gateway dan Backend, Anda wajib mengeksekusi `source` pada lingkungan OpenDDS terlebih dahulu di masing-masing tab terminal tersebut.

### 1. Eksekusi Backend (Terminal 1)
```bash
cd be-stream-odds-cpp/build
source /opt/OpenDDS/setenv.sh
./be-stream-odds-cpp -DCPSConfigFile ../rtps.ini
```
*(Catatan: Jika folder `build` belum ada, jalankan `cmake ..` dan `make` terlebih dahulu).*

### 2. Eksekusi Gateway Node.js (Terminal 2)
```bash
cd gateway-ddsweb
source /opt/OpenDDS/setenv.sh
node server.js -DCPSConfigFile ./rtps.ini

```
*(Catatan: Anda harus menunjuk ke `rtps.ini` yang sama, agar Gateway dapat masuk ke jaringan DDS Domain yang identik dengan Backend).*

### 3. Eksekusi Frontend Web (Terminal 3)
```bash
cd fe-webdds
pnpm install
pnpm dev
```
Setelah berjalan, buka browser di port Rspack (misalnya `http://localhost:3000` atau `http://localhost:8080`) untuk melihat kanvas radar yang sedang aktif.

---
*Dokumen ini diperbarui secara otomatis selaras dengan arsitektur WebDDS.*

Batas maksimal jumlah topik yang bisa ditangani oleh Gateway secara teknis dipengaruhi oleh beberapa faktor, namun angkanya cukup besar. Berikut adalah rinciannya:

1. Batas Sistem Operasi (File Descriptors)
Setiap koneksi WebSocket dan setiap reader DDS dianggap sebagai "file descriptor" oleh Linux.

Secara default, Linux biasanya mengizinkan 1.024 hingga 4.096 file descriptor per proses (bisa ditingkatkan hingga 65.535 dengan ulimit -n).
Jadi, secara teori, Anda bisa memiliki ratusan hingga ribuan topik sekaligus.
2. Batas Resource (Memory & CPU)
Ini adalah batas yang akan Anda rasakan terlebih dahulu sebelum mencapai batas jumlah topik:

Memory: Setiap topik yang didaftarkan di OpenDDS membutuhkan alokasi memori untuk Discovery dan Buffer.
CPU: Semakin banyak topik, semakin banyak "konteks" yang harus dipantau oleh Node.js. Jika ada 1.000 topik yang semuanya aktif mengirim data, CPU akan sibuk melakukan context switching.
3. Batas Throughput (Total Paket per Detik)
Ini adalah "batas nyata" bagi Gateway berbasis Node.js:

Bukan jumlah topiknya yang masalah, tapi total paket per detik dari semua topik tersebut.
Node.js (Single Threaded) harus melakukan serialisasi JSON untuk setiap paket. Jika total paket dari semua topik melebihi 20.000 - 30.000 paket per detik, Gateway biasanya mulai mengalami delay (latency meningkat).
Estimasi untuk Proyek Anda:
Untuk simulator radar ini, dengan spesifikasi komputer standar:

Jumlah Topik: Anda sangat aman hingga 50 - 100 topik.
Jumlah Data: Batasnya adalah ketika total objek (Radar + Square + Circle + Triangle) mencapai sekitar 10.000 - 15.000 objek per detik. Di atas itu, Anda mungkin butuh optimasi lebih lanjut (seperti menggunakan format binary daripada JSON).
Saran Pengujian: Jika Anda ingin mengetes batas ini, kita bisa menduplikasi topik SquareTrackTopic menjadi Square1, Square2, Square3, dst. dan melihat kapan Gateway Anda mulai "menyerah" (ditandai dengan kenaikan latency yang drastis).

Apakah Anda ingin mencoba menambah beban dengan meningkatkan jumlah objek di satu topik (misal 10.000 Square objects), atau menambah jumlah topiknya?