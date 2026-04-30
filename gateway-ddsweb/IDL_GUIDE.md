# Panduan Pengaturan & Kompilasi IDL - Gateway

Dokumen ini menjelaskan cara mengelola file IDL pada komponen **Gateway (Node.js)** agar sinkron dengan Backend (C++) dan Frontend (Web).

## 1. Struktur Folder IDL
Semua file IDL disimpan di dalam folder `idl/`. Setiap modul IDL memiliki foldernya sendiri:
```text
gateway-ddsweb/idl/
├── RadarTrack/
│   ├── RadarTrack.idl        <-- Definisi Data
│   └── RadarTrack.mpc        <-- Konfigurasi Build (MPC)
├── RadarCommand/
│   ├── RadarCommand.idl
│   └── RadarCommand.mpc
└── gateway_idl.mwc           <-- Workspace Master
```

## 2. Skrip Kompilasi Otomatis
Kami telah menyediakan skrip wrapper Node.js untuk memudahkan proses kompilasi tanpa harus menghafal perintah OpenDDS yang kompleks.

### Cara Menjalankan:
Pastikan Anda berada di folder `gateway-ddsweb`, lalu jalankan:
```bash
npm run build:idl
```

### Apa yang dilakukan skrip ini?
1.  **MPC Generation**: Menghasilkan `Makefile` secara otomatis dari file `.mpc`.
2.  **Compilation**: Menjalankan `make` untuk mengkompilasi IDL menjadi **Shared Library** (`.so`).
3.  **Output**: Menghasilkan file library (misal: `libRadarTrack.so`) yang akan dimuat oleh Gateway saat runtime.

## 3. Cara Menambahkan IDL Baru
Jika Anda ingin menambah tipe data baru:
1.  Buat folder baru di `idl/` (misal: `idl/Weather/`).
2.  Letakkan file `.idl` Anda di sana.
3.  Buat file `.mpc` (copy-paste dari folder lain dan sesuaikan namanya).
4.  Daftarkan folder baru tersebut di `idl/gateway_idl.mwc`. *Jika file gateway_idl.mwc tidak ada, buat file baru dengan isi template dari file existing*
workspace {
  idl/RadarCommand/RadarCommand.mpc
  idl/RadarTrack/RadarTrack.mpc
}
5.  Jalankan `npm run build:idl`.

## 4. Penggunaan di Server Gateway
Setelah dikompilasi, muat library tersebut di `server.js` menggunakan:
```javascript
const opendds = require('opendds');
const path = require('path');

// Muat library hasil kompilasi
opendds.load(path.join(__dirname, 'idl', 'Weather', 'libWeather'));
```

---
> [!IMPORTANT]
> **Penting**: Pastikan Anda sudah menjalankan `source setenv.sh` (atau skrip lingkungan OpenDDS lainnya) sebelum menjalankan perintah kompilasi agar variabel `DDS_ROOT` dan `ACE_ROOT` tersedia.
