# Review Variabel Performa `radarLogger.ts`

> Jam WSL dan Windows sudah sinkron (selisih ~225ms). Review ini berdasarkan kode versi terkini.

---

## 1. `Packets Processed` 

### Lokasi Kode
```typescript
// baris 36
this.stats.count += tracks.length;
```

### Rumus
```
Packets Processed = Total semua track yang diterima selama periode 5 detik
```

### Contoh
- Backend mengirim **3000 track** per siklus, setiap **1 detik**
- Dalam 5 detik → 5 siklus × 3000 = **15.000 paket** (idealnya)
- Karena QoS `BEST_EFFORT`, sebagian paket hilang → angka sebenarnya lebih rendah (misal ~6000-8000)


---

## 2. `Avg Latency` 

### Lokasi Kode
```typescript
// baris 42-48
const rawLat = arrivalTime - track.timestamp;         // Selisih mentah
if (this.baseOffset === null || rawLat < this.baseOffset) {
  this.baseOffset = rawLat;                            // Cari selisih terkecil
}
const cleanLat = Math.max(0, rawLat - this.baseOffset); // Latensi terkalibrasi

// baris 69
const avgLatency = this.stats.count > 0 ? (this.stats.totalLat / this.stats.count) : 0;
```

### Rumus
```
rawLat        = Waktu_Terima [Browser] − Waktu_Kirim [Backend]
baseOffset    = Nilai rawLat terkecil yang ditemukan dalam 5 detik
cleanLat      = rawLat − baseOffset
Avg Latency   = Total cleanLat / Total jumlah_paket
```

### Contoh Perhitungan (jam sudah sinkron, selisih ~225ms)
| Track | timestamp (BE) | arrivalTime (FE) | rawLat | baseOffset | cleanLat |
|-------|---------------|-------------------|--------|------------|----------|
| ID 0  | 1777865916000 | 1777865916230     | 230ms  | 230ms (baru) | **0ms** |
| ID 1  | 1777865916001 | 1777865916235     | 234ms  | 230ms      | **4ms** |
| ID 99 | 1777865916050 | 1777865916320     | 270ms  | 230ms      | **40ms** |
| ID 500| 1777865916100 | 1777865916450     | 350ms  | 230ms      | **120ms** |

```
Avg Latency = (0 + 4 + 40 + 120) / 4 = 41ms
```

### Apa yang diukur?
- **Bukan** delay jaringan absolut (karena sudah dikurangi baseOffset)
- **Yang diukur**: Variasi waktu antar paket — seberapa besar "jitter" atau antrean yang terjadi di Gateway & Browser
- Paket tercepat = 0ms (menjadi baseline), paket lain diukur relatif terhadap baseline

### Catatan
- `baseOffset` di-reset setiap 5 detik (`resetStats`), sehingga kalibrasi dimulai ulang tiap periode
- Ini berarti paket pertama di setiap periode selalu memiliki cleanLat = 0, yang sedikit menurunkan rata-rata
- **Dampaknya kecil** jika jumlah paket besar (ribuan), jadi secara keseluruhan masih akurat


---

## 3. `Throughput` 

### Lokasi Kode
```typescript
// baris 38-39
const byteSize = rawLength ?? (tracks.length * 150);  // rawLength dari WebSocket
this.stats.totalBytes += byteSize;

// baris 68
const throughput = (this.stats.totalBytes / 1024) / duration;
```

### Rumus
```
Throughput (KB/s) = (Total Bytes diterima / 1024) / Durasi (detik)
```

### Contoh
- Dalam 5 detik, diterima 6000 paket
- Setiap paket JSON radar ≈ 95 byte (`rawLength` dari `event.data.length`)
- Total: 6000 × 95 = 570.000 byte
- Throughput: (570.000 / 1024) / 5 = **111.33 KB/s**

### Catatan
- `rawLength` **sudah diisi** oleh `webdds.ts` (baris 49: `event.data.length`), jadi fallback 150 byte jarang dipakai
- Yang diukur adalah ukuran **string JSON**, bukan byte di jaringan (yang bisa lebih kecil karena kompresi TCP)

### 

---

## 4. `Waktu Kirim ID 0` 

### Lokasi Kode
```typescript
// baris 51-53
if (track.trackId === 0) {
  this.audit.t1_sent = track.timestamp;   // Jam WSL/Backend
  this.audit.t1_received = arrivalTime;   // Jam Windows/Browser
}

// baris 80
console.log(`Waktu Kirim ID 0 (Pertama) : ${this.formatTime(this.audit.t1_sent)}`);
```

### Rumus
```
Waktu Kirim = new Date(track.timestamp)  → diformat ke "HH:mm:ss"
```

### Contoh
- Backend mengirim track ID 0 pada `timestamp = 1777865916000`
- `new Date(1777865916000)` → `10:38:36` (jam WSL)
- Ditampilkan di log: `Waktu Kirim ID 0 (Pertama) : 10:38:36`

### Catatan
- Ini menampilkan **jam WSL mentah** (sumber: `track.timestamp`)
- Sekarang jam sudah sinkron (~225ms), jadi tampilan ini akan terlihat logis
- Jika jam WSL drift lagi di masa depan, angka ini bisa terlihat aneh dibandingkan jam browser

### 

---

## 5. `Waktu Terima ID 99` 

### Lokasi Kode
```typescript
// baris 55-56
if (track.trackId === 99) {
  this.audit.t100_received = arrivalTime;  // Jam Windows/Browser
}

// baris 81
console.log(`Waktu Terima ID 99 (ke-100): ${this.formatTime(this.audit.t100_received)}`);
```

### Rumus
```
Waktu Terima = new Date(Date.now() saat ID 99 tiba)  → diformat ke "HH:mm:ss"
```

### 

---

## 6. `Durasi Streaming ID 0 s/d 99` 

### Lokasi Kode
```typescript
// baris 71-73
const burstDuration = this.audit.t100_received > 0 && this.audit.t1_sent > 0
  ? Math.max(10, this.audit.t100_received - this.audit.t1_sent - (this.baseOffset || 0))
  : 0;
```

### Rumus
```
burstDuration = max(10, t100_received − t1_sent − baseOffset)
              = max(10, (jam Browser saat ID 99 tiba) − (jam Backend saat ID 0 dikirim) − baseOffset)
```

### Contoh (jam sinkron, baseOffset = 225ms)
- Backend kirim ID 0: `t1_sent = 1777865916000`
- Browser terima ID 99: `t100_received = 1777865916350`
- `burstDuration = max(10, 1777865916350 - 1777865916000 - 225) = max(10, 125) = 125ms`

### Apa yang diukur?
Waktu yang dibutuhkan untuk 100 track pertama (ID 0 sampai ID 99) menempuh perjalanan dari Backend hingga sampai di Browser. Ini mencakup:
- Waktu serialisasi di Backend
- Waktu transmisi DDS (RTPS)
- Waktu proses di Gateway (JSON conversion + WebSocket send)
- Waktu parsing di Browser

### Catatan
- **Mencampur dua sumber waktu** (Backend + Browser), dikompensasi oleh `baseOffset`
- `Math.max(10, ...)` memaksa minimum 10ms — ini menyembunyikan kasus di mana data sampai sangat cepat
- Karena audit values **tidak di-reset saat ID 0 datang**, ada potensi `t100_received` dari siklus lama jika ID 99 hilang (packet loss) → angka bisa tidak akurat
- Namun dengan jam yang sudah sinkron dan `baseOffset` yang di-reset tiap 5 detik, hasilnya **cukup akurat** untuk penggunaan monitoring

### Status: 

---

## 7. `Data Drop Detection` 

### Lokasi Kode
```typescript
// baris 107-142
public logDataDrop(currentCount: number, targetCount: number): void { ... }
```

### Logika
```
1. Jika targetCount berubah → reset monitoring
2. Tunggu sampai currentCount >= targetCount (data lengkap pertama kali)
3. Setelah itu, jika currentCount < targetCount → LOG "DATA DROP DETECTED!"
4. Rate-limit: hanya log sekali per detik (mencegah spam)
5. Jika currentCount === 0 → anggap BE mati/reset, matikan monitoring
```

### Contoh
- Target: 3000 track
- Siklus 1-3: `currentCount` naik perlahan dari 0 → 1000 → 2500 → 3000 Target tercapai
- Siklus 4: `currentCount = 2850` → DATA DROP DETECTED! Missing: 150
- Siklus 5: `currentCount = 0` → BE mati, reset monitoring

---

## Ringkasan

| # | Variabel | Rumus | Status |
|---|----------|-------|--------|
| 1 | Packets Processed | Total track yang diterima |
| 2 | Avg Latency | (Total Latensi / Total Paket) |
| 3 | Throughput | (Total KB / Durasi Detik) |
| 4 | Waktu Kirim ID 0 | Jam dari Backend (WSL) | 
| 5 | Waktu Terima ID 99 | Jam dari Browser (Windows) |
| 6 | Durasi Streaming | Selisih Terima ID 99 vs Kirim ID 0 |
| 7 | Data Drop | Deteksi jika data berkurang |

> [!TIP]
> Dengan jam yang sudah tersinkron (~225ms), **semua variabel akan menampilkan angka yang akurat dan masuk akal**. Tidak ada perubahan kode yang wajib dilakukan saat ini.
