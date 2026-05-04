# OpenDDS Backend Implementation Guide (simple-odds-cpp)

Panduan ini berisi aturan, standar, dan langkah-langkah untuk mengembangkan Backend (BE) menggunakan OpenDDS di dalam project ini. Gunakan dokumen ini sebagai referensi utama saat menambahkan fitur baru atau memodifikasi alur data DDS.

---

## 1. Arsitektur & Struktur Folder

Proyek ini menggunakan pola **Adapter** untuk memisahkan logika OpenDDS dari logika bisnis.

- **`idl/`**: Definisi struktur data DDS (Interface Definition Language).
- **`src/adapters/service_adapters/odds_adapter/`**: Implementasi inti OpenDDS.
    - **`domain_participant/`**: Singleton untuk mengelola DDS Participant.
    - **`publishers/`**: Folder untuk setiap topic publisher.
    - **`subscribers/`**: Folder untuk setiap topic subscriber.
- **`src/globals/data_types/`**: Struct internal C++ yang digunakan oleh aplikasi (sebelum/setelah dikonversi ke tipe DDS).
- **`src/threads/`**: Pengelolaan thread khusus untuk subscriber yang bersifat blocking.

---

## 2. Alur Data & Transport (RTPS)

Proyek ini menggunakan protokol **RTPS (Real-Time Publish-Subscribe)** melalui UDP sebagai transport utama. 

- **Discovery**: Menggunakan `DEFAULT_RTPS`, yang berarti node-node DDS akan saling menemukan (discovery) secara otomatis dalam jaringan tanpa memerlukan broker pusat (seperti InfoRepo), selama berada dalam subnet yang sama.
- **Konfigurasi**: Pengaturan transport didefinisikan dalam `rtps.ini`, yang mengatur penggunaan `rtps_udp`.
- **Peer-to-Peer**: Komunikasi terjadi langsung antar Participant (Publisher ke Subscriber) secara efisien dan low-latency.

---

## 3. Langkah-langkah Membuat Backend OpenDDS dari Nol

Berikut adalah urutan langkah jika ingin membangun service baru seperti `simple-odds-cpp`:

### Langkah 1: Persiapan Lingkungan & Struktur Folder
1. Pastikan **OpenDDS (ACE/TAO)** terinstal.
2. Buat struktur folder mengikuti pola adapter: `idl/`, `src/adapters/`, `src/globals/`, dan `src/threads/`.
3. Siapkan file konfigurasi dasar: `rtps.ini` dan `CMakeLists.txt` yang nge-link ke library OpenDDS (`OpenDDS_Dcps`, `TAO`, `ACE`).

### Langkah 2: Definisi Interface (IDL)
1. Buat file `.idl` untuk mendefinisikan struktur data yang akan dikirim/terima.
2. Gunakan anotasi `@topic` pada struct utama.
3. Jalankan `opendds_idl` (atau script `./generate_idl`) untuk menghasilkan code C++ (TypeSupport, DataWriter, DataReader).

### Langkah 3: Implementasi Domain Participant (Singleton)
1. Buat class `ODDSDomainParticipant` sebagai singleton.
2. Di dalamnya, inisialisasi `DomainParticipantFactory` dengan argumen configurasi (`-DCPSConfigFile rtps.ini`).
3. Create `DomainParticipant` untuk domain ID tertentu (default: 0).

### Langkah 4: Membuat Publisher
1. Buat class yang mewarisi `AbstractODDSPublisher`.
2. Daftarkan TypeSupport yang dihasilkan dari IDL ke Participant.
3. Buat Topic dengan nama yang unik.
4. Buat Publisher dan DataWriter, lalu "narrow" DataWriter ke tipe spesifik IDL Anda.
5. Implementasikan fungsi `send` untuk menulis data menggunakan DataWriter.

### Langkah 5: Membuat Subscriber
1. Buat class yang mewarisi `AbstractODDSSubscriber`.
2. Daftarkan TypeSupport dan buat Topic (harus sama dengan Publisher).
3. Buat Subscriber dan DataReader, lalu "narrow" DataReader ke tipe spesifik IDL Anda.
4. Implementasikan fungsi `start()` dengan loop `take()` untuk mengambil data secara berkala.

### Langkah 6: Manajemen Threading & Observabilitas
1. Buat thread terpisah untuk menjalankan fungsi `start()` Subscriber agar tidak memblokir main loop.
2. Gunakan pola **Observer** untuk mengirimkan data yang diterima dari Subscriber ke bagian aplikasi lain.

### Langkah 7: Konfigurasi Runtime
1. Masukkan path `rtps.ini` dan IOR (jika perlu) ke dalam file `.env`.
2. Pastikan environment variables di-load sebelum aplikasi dijalankan.

---

## 4. Aturan & Syarat Pembuatan Backend (OpenDDS)

### A. Penggunaan Singleton Participant
- **Aturan**: Dilarang membuat `DomainParticipant` baru di setiap class.
- **Cara**: Gunakan `ODDSDomainParticipant::get_instance()->get_participant_()`.
- **Alasan**: Efisiensi resource dan sinkronisasi domain DDS.

### B. Alur Kerja IDL (IDL First)
- **Aturan**: Semua perubahan struktur data harus dimulai dari file `.idl`.
- **Langkah**:
    1. Edit `.idl` di folder `idl/[TopicName]/`.
    2. Jalankan script `./generate_idl` untuk memperbarui source code yang dihasilkan secara otomatis.
    3. Gunakan anotasi `@topic` untuk struct yang akan dijadikan Topic utama.

### C. Manajemen Memori & Resource
- **String DDS**: Gunakan `CORBA::string_dup(std::string.c_str())` untuk mengisi field string pada struct DDS.
- **Subscriber**: Wajib memanggil `reader->return_loan()` setelah melakukan `take()` untuk mengembalikan buffer memori ke OpenDDS middle-ware.
- **Handle Check**: Gunakan `odds_operator_.check_handle()` dan `check_status()` untuk memvalidasi setiap pembuatan entitas DDS atau hasil operasi.

### D. Quality of Service (QoS)
- **Real-time Data**: Untuk data stream (seperti radar), gunakan `BEST_EFFORT_RELIABILITY_QOS`.
- **Timeout**: Set parameter `deadline`, `latency_budget`, dan `max_blocking_time` secara eksplisit sesuai kebutuhan latensi sistem.

---

## 5. Panduan Implementasi (Untuk Developer)

### Tahap 1: Definisi Data
1. Buat/Update `.idl` di folder `idl/`.
2. Jalankan `./generate_idl`.

### Tahap 2: Implementasi Publisher
1. Buat folder baru di `src/adapters/service_adapters/odds_adapter/publishers/[nama_topic]/`.
2. Warisi class `AbstractODDSPublisher`.
3. Di Constructor:
    - Registrasi Type Support.
    - Set QoS (Reliability, dll).
    - Panggil `set_topic()`.
    - Narrow `DataWriter` ke tipe data spesifik (contoh: `MessageDataWriter::_narrow(writer)`).
4. Implementasi method untuk mengirim data yang melakukan konversi tipe internal ke tipe DDS.

### Tahap 3: Implementasi Subscriber
1. Buat folder baru di `src/adapters/service_adapters/odds_adapter/subscribers/[nama_topic]/`.
2. Warisi class `AbstractODDSSubscriber`.
3. Di Constructor: Identik dengan Publisher (pastikan QoS kompatibel).
4. Implementasi method `start()`:
    - Jalankan loop `while(!is_stop())`.
    - Panggil `reader->take()`.
    - Iterasi data, panggil `notify_observers()`.
    - Panggil `return_loan()`.

### Tahap 4: Integrasi Threading
1. Tambahkan fungsi thread baru di `src/threads/backend_interface_thread/`.
2. Di `app.cpp`, instansiasi Publisher/Subscriber dan jalankan thread subscriber.

---

## 6. Standar Penamaan (Naming Convention)

| Komponen | Standar | Contoh |
| :--- | :--- | :--- |
| **Publisher Class** | `[TopicName]ODDSPublisher` | `RadarTrackODDSPublisher` |
| **Subscriber Class** | `[TopicName]ODDSSubscriber` | `RadarTrackODDSSubscriber` |
| **Internal Struct** | `[Name]TransmitData / ReceiveData` | `RadarTransmitData` |
| **Log Tag** | `"ODDS Publisher" / "ODDS Subscriber"` | `LOG_INFO("ODDS Publisher", ...)` |
| **Folder Name** | snake_case | `radar_track_publisher` |

---

## 7. Script & Tools Pendukung
- **`./generate_idl`**: Menghasilkan source code C++ dari file IDL.
- **`rtps.ini`**: Konfigurasi transport DDS (pastikan path ini benar di `.env`).
- **`simple.ior`**: File referensi InfoRepo (digunakan jika tidak menggunakan RTPS discovery murni).
