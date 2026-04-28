/**
 * Created Date       : 11-04-2026
 * Description        : Utilitas penggabungan dinamis Tailwind CSS Classes.
 *                      Fokus utama: Mengeliminasi duplikasi string interpolasi class yang kusut menggunakan `clsx` dan `tailwind-merge` (Meski sementara ini hanya `clsx`).
 *
 * Arsitektur:
 *   Komponen TSX (className) ──► cn() Utils
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Kerangka utilitas dasar dengan fusi clsx & twMerge.
 */
import { clsx, type ClassValue } from "clsx";

/**
 * Menggabungkan beberapa kelas Tailwind CSS menjadi sebuah string.
 * Fungsi ini menggunakan `clsx` dan `tailwind-merge` untuk menggabungkan kelas-kelas
 * yang diinputkan.
 * @param {ClassValue[]} inputs - Kumpulan kelas Tailwind CSS yang ingin digabungkan
 * @returns {string} - String yang berisi kumpulan kelas Tailwind CSS yang telah digabungkan
 */
export function cn(...inputs: ClassValue[]): string {
	return clsx(inputs);
}
