# Rencana Implementasi: Optimasi Build Docker Offline (Local Cache)

Dokumen ini berisi rencana kerja (*implementation plan*) untuk mengoptimalkan proses build Docker Compose pada sistem Radar Streaming. Fokus utama adalah mengeliminasi pengunduhan berulang file dependensi berukuran besar dari internet saat cache Docker terinvaliasi, sehingga menghemat 100% kuota data dan mempercepat waktu kompilasi.

---

## 1. Tujuan dan Sasaran (*Objectives*)
* **Menghemat Kuota Internet:** Menghindari proses unduh ulang dependensi **OpenDDS** (~ratusan MB) dan **CMake** (~puluhan MB) setiap kali ada perubahan pada layer Dockerfile sebelumnya.
* **Mempercepat Waktu Build:** Mengalihkan proses pengambilan file dari jaringan (network IO) ke pembacaan disk lokal (disk IO) yang jauh lebih cepat.
* **Kestabilan Lingkungan Build:** Menghilangkan kebergantungan pada ketersediaan/uptime server eksternal (`docs.len-iot.id` dan `github.com`) saat melakukan pengembangan secara lokal.

---

## 2. Analisis Struktur dan Batasan Konteks Build
Dalam arsitektur saat ini, setiap service dikonfigurasi dengan *build context* masing-masing pada `docker-compose.yml`:
* `radar-be`: memiliki context `./be-stream-odds-cpp`
* `radar-gateway`: memiliki context `./gateway-ddsweb`

> [!IMPORTANT]
> Aturan keamanan Docker menetapkan bahwa instruksi `COPY` pada `Dockerfile` hanya dapat mengakses file yang berada **di dalam direktori *build context*** masing-masing. Oleh karena itu, file arsip dependensi harus ditempatkan di dalam folder service yang membutuhkannya sebelum di-build.

---

## 3. Langkah-Langkah Implementasi (*Implementation Steps*)

### Tahap 1: Pengunduhan Dependensi ke Lingkungan Lokal
Kita akan mengunduh file arsip yang dibutuhkan dan menempatkannya ke dalam masing-masing folder build context.

| Nama File | URL Sumber | Target Lokasi Penempatan |
| :--- | :--- | :--- |
| **OpenDDS-3.29.1.zip** | [Download URL](https://docs.len-iot.id/s/xm9zTrTASaBxd8p/download/OpenDDS-3.29.1.zip) | • `be-stream-odds-cpp/`<br>• `gateway-ddsweb/` |
| **cmake-3.31.3-linux-x86_64.tar.gz** | [Download URL](https://github.com/Kitware/CMake/releases/download/v3.31.3/cmake-3.31.3-linux-x86_64.tar.gz) | • `be-stream-odds-cpp/` |

> [!TIP]
> Untuk mempermudah dan mengotomatisasi pengunduhan, kita dapat membuat skrip pembantu opsional (`scripts/download_deps.sh`) yang akan otomatis mengunduh file ke lokasi yang tepat.

---

### Tahap 2: Modifikasi `be-stream-odds-cpp/Dockerfile`
Mengganti instruksi `ADD <URL>` menjadi `COPY <File_Lokal>` pada stage build C++.

```diff
 # Install CMake using precompiled binary (v3.31.3)
-ADD https://github.com/Kitware/CMake/releases/download/v3.31.3/cmake-3.31.3-linux-x86_64.tar.gz \
-        cmake-3.31.3-linux-x86_64.tar.gz
+COPY cmake-3.31.3-linux-x86_64.tar.gz cmake-3.31.3-linux-x86_64.tar.gz
 RUN tar -xzf cmake-3.31.3-linux-x86_64.tar.gz && \
     mv cmake-3.31.3-linux-x86_64 /usr/local/cmake && \
     ln -s /usr/local/cmake/bin/* /usr/local/bin && \
     rm cmake-3.31.3-linux-x86_64.tar.gz

 # --- Install OpenDDS (v3.29.1) ---
-ADD https://docs.len-iot.id/s/xm9zTrTASaBxd8p/download/OpenDDS-3.29.1.zip OpenDDS-3.29.1.zip
+COPY OpenDDS-3.29.1.zip OpenDDS-3.29.1.zip
 RUN unzip OpenDDS-3.29.1.zip && \
     mv OpenDDS-3.29.1 /opt/OpenDDS && \
     rm OpenDDS-3.29.1.zip
```

---

### Tahap 3: Modifikasi `gateway-ddsweb/Dockerfile`
Mengganti instruksi `ADD <URL>` pada saat instalasi OpenDDS di base image Gateway.

```diff
 # Install OpenDDS
-ADD https://docs.len-iot.id/s/xm9zTrTASaBxd8p/download/OpenDDS-3.29.1.zip OpenDDS-3.29.1.zip
+COPY OpenDDS-3.29.1.zip OpenDDS-3.29.1.zip
 RUN unzip OpenDDS-3.29.1.zip && \
     mv OpenDDS-3.29.1 /opt/OpenDDS && \
     rm OpenDDS-3.29.1.zip
```

---

### Tahap 4: Verifikasi & Pengujian
Setelah modifikasi diterapkan, kita akan melakukan verifikasi dengan menjalankan build khusus per service untuk memastikan proses berjalan murni dari file lokal:

```bash
# 1. Uji build service Backend secara independen
docker compose up -d --build radar-be

# 2. Uji build service Gateway secara independen
docker compose up -d --build radar-gateway
```

---

## 4. Rencana Cadangan (*Rollback Plan*)
Jika terjadi kendala kompatibilitas atau file arsip lokal korup:
1. Hapus file `.zip` dan `.tar.gz` lokal yang rusak.
2. Kembalikan instruksi `COPY` menjadi instruksi `ADD <URL>` menggunakan `git checkout` pada kedua `Dockerfile`.
3. Jalankan ulang build seperti semula.

---


