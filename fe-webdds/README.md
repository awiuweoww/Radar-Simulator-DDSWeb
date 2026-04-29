# Frontend WebDDS (React)

Modul antarmuka pengguna (Frontend) yang berfungsi memvisualisasikan aliran data mentah dari *Backend Radar Simulator* menjadi representasi visual interaktif di atas peta geografis. Dibangun menggunakan **React**, di-_build_ cepat dengan **Rspack**, serta menggunakan **Tailwind CSS** untuk antarmuka yang bersih.

## Fitur Teknis Utama

*   **Implementasi Standar WebDDS:** Memiliki modul antarmuka khusus (`src/utils/api/webdds.ts`) yang diprogram untuk patuh pada spesifikasi *Resource-based* OMG DDS-WEB.
*   **Konektivitas WebSocket:** Menggunakan API Native WebSocket (`ws`) tanpa pustaka perantara, untuk menangkap aliran string JSON frekuensi tinggi yang dipancarkan oleh Gateway.
*   **Aksi REST API:** Menerbitkan *command/perintah* simulasi (seperti Start/Stop dan re-kalkulasi jumlah target objek) dengan merutekannya sebagai HTTP POST.
*   **Kanvas Rendeng (*Rendering*):** Menguraikan titik Lintang (*Latitude*) dan Bujur (*Longitude*) untuk diterjemahkan secara langsung ke pustaka Peta (*Map Engine*).

## Kebutuhan Sistem
*   **Node.js**: Versi 18 LTS ke atas.
*   **Package Manager**: `pnpm` (sangat disarankan, hindari penggunaan campuran `npm`/`yarn` karena adanya `pnpm-lock.yaml`).

## Cara Menginstal & Menjalankan

1. Masuk ke direktori Frontend dari *root project*:
   ```bash
   cd fe-webdds
   ```

2. Instalasi seluruh paket dependensi:
   ```bash
   pnpm install
   ```

3. Jalankan server pengembang (*Development Server*):
   ```bash
   pnpm dev
   ```

Aplikasi *Client* akan berjalan di *localhost* sesuai dengan port yang ditunjukkan oleh Rspack di CLI. Buka *browser* untuk memantau radar secara visual.

## Sinkronisasi dengan Gateway
Pastikan *Gateway* (Node.js) sedang aktif dan berjalan di port `8080` (sesuai yang di-<i>hardcode</i> pada properti `wsUrl` dan `restUrl` di inisialisasi *Participant WebDDS*). Jika Gateway mati, aliran *WebSocket* akan terputus dan titik-titik radar di peta akan berhenti merespon.
