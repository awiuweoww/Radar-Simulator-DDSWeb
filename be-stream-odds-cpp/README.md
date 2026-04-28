# Panduan Instalasi OpenDDS (ACE/TAO)

Dokumen ini menjelaskan langkah-langkah untuk menginstal dan memastikan OpenDDS beserta framework pendukungnya (ACE/TAO) siap digunakan untuk pengembangan di folder `be-stream-odds-cpp`.

---

## 1. Persiapan Sistem (Ubuntu/Linux)

Sebelum menginstal OpenDDS, pastikan dependensi berikut sudah terpasang di sistem Anda:

```bash
sudo apt-get update -y && \
sudo apt-get install -y --no-install-recommends \
    autoconf \
    bison \
    build-essential \
    ca-certificates \
    curl \
    flex \
    g++ \
    gcc \
    git \
    libssl-dev \
    pkg-config \
    python3 \
    tar \
    unzip \
    wget \
    zip \
    zlib1g-dev
```

---

## 2. Instalasi OpenDDS (Versi 3.29.1)

Anda dapat menggunakan paket pre-built yang tersedia atau mengunduhnya secara manual:

1. **Unduh Paket**:
   ```bash
   wget https://docs.len-iot.id/s/xm9zTrTASaBxd8p/download/OpenDDS-3.29.1.zip
   ```

2. **Ekstrak ke direktori `/opt`**:
   ```bash
   unzip OpenDDS-3.29.1.zip
   sudo mv OpenDDS-3.29.1 /opt/OpenDDS
   rm OpenDDS-3.29.1.zip
   ```

---

## 3. Konfigurasi Environment Variables

Agar sistem mengenali perintah OpenDDS, Anda wajib menambahkan variabel berikut ke dalam profile shell Anda (`~/.bashrc` atau `~/.zshrc`):

```bash
# Path Ke Root OpenDDS & ACE/TAO
export DDS_ROOT="/opt/OpenDDS"
export ACE_ROOT="/opt/OpenDDS/ACE_wrappers"
export MPC_ROOT="/opt/OpenDDS/ACE_wrappers/MPC"

# Library Path (Penting untuk Runtime)
export LD_LIBRARY_PATH="/opt/OpenDDS/ACE_wrappers/lib:/opt/OpenDDS/lib:${LD_LIBRARY_PATH}"

# Path Perintah (Binary)
export PATH="/opt/OpenDDS/ACE_wrappers/bin:/opt/OpenDDS/bin:${PATH}"
```

**Setelah ditambahkan, terapkan perubahan**:
```bash
source ~/.bashrc
```

---

## 4. Cara Memastikan Instalasi (Verifikasi)

Lakukan pengecekan berikut untuk memastikan OpenDDS telah terinstal dengan benar:

1. **Cek Versi OpenDDS**:
   ```bash
   opendds_idl --version
   ```
   *Output yang diharapkan: Menampilkan informasi versi 3.29.1.*

2. **Cek Binary ACE/TAO**:
   ```bash
   which DCPSInfoRepo
   ```
   *Output yang diharapkan: Menampilkan path arah /opt/OpenDDS/bin/DCPSInfoRepo.*

3. **Cek environment variable**:
   ```bash
   echo $DDS_ROOT
   ```
   *Output yang diharapkan: `/opt/OpenDDS`.*

---

## 5. Cara Membangun Project (Build)

Setelah OpenDDS terinstal dan environment variables sudah dikonfigurasi, Anda dapat membangun project backend dengan langkah-langkah berikut:

### a. Install Dependensi (Conan)
Gunakan Conan untuk mengunduh library pendukung seperti `spdlog` dan `fmt`:
```bash
conan install . --output-folder=build --build=missing
```

### b. Konfigurasi CMake
Gunakan preset dari Conan untuk konfigurasi build:
```bash
cmake --preset conan-release
```

### c. Kompilasi Project
Jalankan proses build menggunakan CMake:
```bash
cmake --build build --config Release --target all -j$(nproc)
```

Setelah berhasil, file executable `be-stream-odds-cpp` akan tersedia di dalam folder `build/`.

---

## Catatan Tambahan
Jika Anda membangun dari source code (bukan pre-built), Anda perlu menjalankan:
```bash
cd $DDS_ROOT
./configure
make
```
Namun, untuk lingkungan proyek ini, disarankan menggunakan paket yang sudah disediakan di atas.
