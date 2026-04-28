# OMG DDS-WEB Standard Gateway

Gateway ini berfungsi sebagai jembatan perantara antara jaringan **OpenDDS (C++)** berbasis protokol UDP biner dengan aplikasi **Frontend (Web)**, mengikuti rancangan operasional dari standar **OMG DDS Web Integration Service**.

## Penyiapan & Kompilasi Lingkungan

### 1. Instalasi Dependensi Node.js
Pastikan Anda sedang berada di direktori `gateway-ddsweb`.
```bash
npm install
```
Daftar pustaka (*libraries*) utama yang menggerakkan Gateway ini:
*   `opendds`: Modul inti *binding* C++ API untuk Node.js.
*   `express`: Mengatur *endpoint* pendaftaran dan *routing* REST API (Publish).
*   `ws`: Menangani *streaming data pipeline* lewat soket WebSocket.

### 2. Kompilasi IDL menjadi Shared Library
Beda halnya dengan sistem *broker* JSON biasa, *library* Node.js dari OpenDDS mewajibkan agar struktur data (IDL) dikompilasi menjadi *Shared Library C++* (`.so`) agar Gateway paham cara mendekode paket biner C++.
```bash
source /opt/OpenDDS/setenv.sh
npm run build:idl
```
Proses ini akan mengeksekusi *script wrapper* IDL (di `scripts/idl-compiler.js`) dan menaruh berkas `libRadarTrack.so` dan `libRadarCommand.so` di dalam folder `idl/`.

## Cara Menjalankan Server Gateway

Sebelum menjalankan eksekutor Node, wajib memastikan bahwa sesi *environment variables* OpenDDS (`DDS_ROOT`, dll.) sudah terpasang (*loaded*) di tab terminal:
```bash
source /opt/OpenDDS/setenv.sh
```

Nyalakan server Gateway, sambil merujuk file konfigurasi RTPS yang sama persis dengan yang dipakai oleh *Backend C++* (agar keduanya melebur di Domain DDS P2P yang sama):
```bash
node server.js -DCPSConfigFile ../rtps.ini
```

**Tips Solusi Error: Tabrakan Port (*Address already in use*)**
Seringkali `server.js` yang *crash* masih menyisakan proses yang mengunci port 8080. Cari pelakunya dan matikan paksa:
```bash
lsof -i :8080
kill -9 <PID>
```

## Arsitektur Standar OMG DDS-WEB

Gateway Node.js ini mematuhi pilar utama spesifikasi dari *OMG Web Integration Service*:

1.  **Resource-Based Routing:** Topik DDS dipetakan ke URL HTTP murni: `/domain/{id}/topic/{name}/data`.
2.  **Pemetaan Protokol (Verbs):**
    *   **Publishing (Web ➔ C++):** Menggunakan injeksi metode **HTTP POST** tunggal.
    *   **Subscribing (C++ ➔ Web):** Berlangganan tiada henti via **Native WebSocket (ws)**.
3.  **Representasi Data (JSON):** Paket memori (*Buffer C++*) diserialisasi secara cerdas menjadi struktur objek JavaScript (lalu di-*stringify* jadi `"fastJson"`) pada saat *runtime*, membebaskan memori RAM *Browser* dari siksaan dekode biner mentah.

## Konfigurasi Parameter QoS

Agar C++ dan Gateway saling bertukar paket, parameter kualitas pelayanan (QoS) mereka harus *matching*. Di dalam berkas `server.js`, kami men-<i>hardcode</i> objek QoS sebagai berikut:

| Nama Topic | Reliability | History | Durability |
| :--- | :--- | :--- | :--- |
| **RadarTrackTopic** | `BEST_EFFORT` | `KEEP_LAST` (Depth 1) | `VOLATILE` |
| **CommandTopic** | `RELIABLE` | `KEEP_LAST` (Depth 10) | `TRANSIENT_LOCAL` |

*(Keterbatasan Teknis: Library OpenDDS Node.js hanya sanggup mengekspos ketiga sifat QoS primer di atas. Berusaha menambah matriks QoS Liveliness atau Deadline di dalam `server.js` justru akan menyebabkan error Segfault.)*