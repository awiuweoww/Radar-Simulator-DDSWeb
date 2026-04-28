/**
 * Created Date       : 11-04-2026
 * Description        : Komponen Layout/Wadah utama dari antarmuka WebDDS.
 *                      Fokus utama: Menjaga konsistensi lebar halaman dan struktur Header/Footer.
 *
 * Arsitektur:
 *   Header ──► Main Content (Children) ──► Footer
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Implementasi awal struktur layout responsif skala besar.
 */
import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Komponen Layout utama yang membungkus seluruh halaman aplikasi.
 * 
 * @param props - Properti komponen yang berisi elemen children.
 * @param "props.children" - Komponen-komponen anak yang akan ditampilkan di dalam layout. 
 * @returns Elemen JSX Layout.
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-montserrat flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-6 lg:px-10 py-8 flex flex-col gap-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};
