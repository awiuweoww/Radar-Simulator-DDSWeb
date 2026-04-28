
import { type ComponentPropsWithoutRef, type ReactNode } from "react";

/**
 * InputProps adalah "Kontrak" atau daftar aturan untuk komponen Input.
 * Komponen ini menggunakan `extends ComponentPropsWithoutRef<"input">` agar
 * otomatis mendukung semua atribut standar HTML seperti 'type', 'placeholder', 'value', 'onChange', dll.
 */
export interface InputProps extends ComponentPropsWithoutRef<"input"> {
  /** 
   * Teks judul kecil yang muncul di atas kotak input.
   */
  label?: string;

  /** 
   * Teks informasi tambahan yang muncul di bagian bawah input (misal: "Gunakan format DD.MM").
   */
  helperText?: string;

  /** 
   * Pesan kesalahan. Jika diisi, warna border input dan teks helper akan berubah menjadi merah.
   */
  error?: string;

  /** 
   * Ikon (Lucide icon atau elemen React) yang muncul di sisi kiri dalam kotak input.
   */
  leftIcon?: ReactNode;

  /** 
   * Ikon (Lucide icon atau elemen React) yang muncul di sisi kanan dalam kotak input.
   */
  rightIcon?: ReactNode;

  /** 
   * CSS class tambahan khusus untuk pembungkus terluar (container) input.
   */
  containerClassName?: string;

  /** 
   * Jika true, input akan melebar memenuhi seluruh ruangan yang tersedia (100% width).
   */
  fullWidth?: boolean;
}
