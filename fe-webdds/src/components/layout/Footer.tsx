/**
 * Created Date       : 11-04-2026
 * Description        : Komponen Footer aplikasi.
 *                      Fokus utama: Menampilkan informasi copyright dan sistem stasioner di bagian bawah layar.
 *
 * Arsitektur:
 *   Layout ──► Footer
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Implementasi awal styling UI Footer standar.
 */
import React from 'react';

/**
 * Komponen Footer .
 * @returns Elemen JSX Footer.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="flex items-center justify-between px-8 py-6 text-xs text-surface-400 uppercase tracking-wide border-t border-surface-200 mt-10">
      <p>&copy; 2026 PERFORMANCETEST_WEBDDS. ALL RIGHTS RESERVED.</p>
      <div className="flex gap-6">
        <a href="#" className="hover:text-surface-700 transition-colors border-b border-surface-300">Privacy Policy</a>
        <a href="#" className="hover:text-surface-700 transition-colors border-b border-surface-300">Terms of Service</a>
        <a href="#" className="hover:text-surface-700 transition-colors border-b border-surface-300">Compliance</a>
      </div>
    </footer>
  );
};
