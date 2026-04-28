/**
 * Created Date       : 11-04-2026
 * Description        : File konfigurasi Token Warna (Design System) pusat.
 *                      Fokus utama: Menstandarkan palet UI komponen dan dikonsumsi langsung oleh konfigurasi Tailwind.
 *
 * Arsitektur:
 *   Desainer ──► colors.js ──► tailwind.config.js & Komponen TSX
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Penyesuaian palet neon (Cyan) dan sentralisasi token surface gelap.
 */
/** @type {Record<string, string | Record<string, string>>} */

module.exports = {
	
	surface: {
		50: "#f2f4f6",
		100: "#d9dde3",
		200: "#bfc6cf",
		300: "#a5afbc",
		400: "#8b98a8",
		500: "#718195",
		600: "#576677",
		700: "#3d4c59",
		800: "#23323b",
		900: "#131c23",
		950: "#0b1117",
		DEFAULT: "#131c23"
	},
	
	danger: "#ff4444",
	success: "#00cc66",
	cyan: {
		100: "#ccf7ff",
		200: "#99efff",
		300: "#66e7ff",
		400: "#00d8ff",
		500: "#00b2cc",
		DEFAULT: "#00d8ff"
	}
};
