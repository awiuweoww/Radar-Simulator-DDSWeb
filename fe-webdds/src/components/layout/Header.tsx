/**
 * Created Date       : 11-04-2026
 * Description        : Komponen Header Navigasi atas aplikasi.
 *                      Fokus utama: Menampilkan identitas dan logo aplikasi (Stream Radar WebDDS).
 *
 * Arsitektur:
 *   Layout ──► Header 
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Implementasi awal styling UI Header.
 */
import React from 'react';

/**
 * Komponen Header yang menampilkan navigasi utama.
 * @returns Elemen JSX Header.
 */
export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-surface-200">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-surface-900 uppercase">Performancetest_Webdds</h1>
      </div>
      
      <nav className="flex items-center">
        <a href="#" className="uppercase text-cyan-400 font-bold text-sm tracking-wider border-b-2 border-cyan-400 pb-1">
          Dashboard
        </a>
      </nav>

      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full border-2 border-surface-900 flex items-center justify-center">
          <svg className="w-5 h-5 text-surface-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>
    </header>
  );
};
