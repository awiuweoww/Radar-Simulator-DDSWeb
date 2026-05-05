/**
 * Created Date       : 11-04-2026
 * Description        : Utilitas untuk dekoding dan pemformatan output antarmuka Radar.
 *                      Fokus utama: Meringankan komponen TSX dari operasi ternary dan konversi matematis spasial.
 */

/**
 * Format Latitude float ke format string DMM (Derajat)
 * @param {number} lat - Nilai latitude float
 * @returns {string} - Nilai latitude dalam format string DMM
 */
export function formatLatitude(lat: number): string {
  return `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? 'N' : 'S'}`;
}


/**
 * Format Longitude float ke format string DMM (Derajat)
 *
 * @param {number} lon - Nilai longitude float
 * @returns {string} - Nilai longitude dalam format string DMM
 */
export function formatLongitude(lon: number): string {
  return `${Math.abs(lon).toFixed(5)}° ${lon >= 0 ? 'E' : 'W'}`;
}

/**
 * Resolusi Tailwind Class berdasarkan Klasifikasi Kapal
 * @param classification clas
 * @returns clas
 */
export function getClassificationTailwindClass(classification: number): string {
  switch (classification) {
    case 0: 
      return 'bg-success';
    case 1: 
      return 'bg-danger';
    case 3: 
      return 'bg-yellow-400';
    default:
      return 'bg-cyan-400';
  }
}

/**
 * Format timestamp milidetik ke string waktu dengan milidetik (HH:mm:ss.SSS)
 * Khusus digunakan untuk logging performa.
 */
export function formatLoggerTime(ts: number): string {
  if (!ts) return "N/A";
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}
