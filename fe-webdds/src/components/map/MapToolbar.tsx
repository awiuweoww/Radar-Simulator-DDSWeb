/**
 * Created Date       : 11-04-2026
 * Description        : Komponen antarmuka yang mengambang di pojok layar utama peta (Map HUD).
 *                      Fokus utama: Mendelegasikan aksi view OpenLayers (Zoom In/Out, Topografi, Pusat Koordinat) 
 *                                   melalui callback props ke RadarMap.
 *
 * Arsitektur:
 *   RadarMap (Map Engine) ◄── MapToolbar (Aksi Tombol)
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Implementasi floating toolbar OpenLayers eksternal.
 */
import React from 'react';

export interface MapToolbarProps {
  onCenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleMapType: () => void;
  mapType: 'standard' | 'satellite';
}

/**
 * Komponen Toolbar untuk mengontrol interaksi peta seperti zoom dan tipe peta.
 * 
 * @param props - Properti untuk menangani aksi kontrol peta.
 * @param "props.onCenter" - Fungsi untuk mengatur tampilan peta ke titik tengah.
 * @param "props.onZoomIn" - Fungsi untuk mengatur tampilan peta ke titik tengah.
 * @param "props.onZoomOut" - Fungsi untuk mengatur tampilan peta ke titik tengah.
 * @param "props.onToggleMapType" - Fungsi untuk mengatur tampilan peta ke titik tengah.
 * @param "props.mapType" - Tipe peta yang sedang digunakan.
 * @returns Elemen JSX Toolbar kontrol peta.
 */
export const MapToolbar: React.FC<MapToolbarProps> = ({ 
  onCenter, 
  onZoomIn, 
  onZoomOut, 
  onToggleMapType, 
  mapType 
}) => {
  return (
    <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
      <button onClick={onCenter} className="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur text-surface-900 rounded shadow hover:bg-cyan-50 hover:text-cyan-600 transition-colors group" aria-label="Center Map">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span className="absolute right-full mr-2 px-2 py-1 bg-surface-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Titik Tengah</span>
      </button>
      <button onClick={onZoomIn} className="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur text-surface-900 rounded shadow hover:bg-cyan-50 hover:text-cyan-600 transition-colors group" aria-label="Zoom In">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
        <span className="absolute right-full mr-2 px-2 py-1 bg-surface-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Zoom In</span>
      </button>
      <button onClick={onZoomOut} className="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur text-surface-900 rounded shadow hover:bg-cyan-50 hover:text-cyan-600 transition-colors group" aria-label="Zoom Out">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/></svg>
        <span className="absolute right-full mr-2 px-2 py-1 bg-surface-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Zoom Out</span>
      </button>
      <button onClick={onToggleMapType} className="w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur text-surface-900 rounded shadow hover:bg-cyan-50 hover:text-cyan-600 transition-colors group" aria-label="Ganti Peta">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span className="absolute right-full mr-2 px-2 py-1 bg-surface-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Ganti Layer ({mapType === 'standard' ? 'Satelit' : 'Standar'})</span>
      </button>
    </div>
  );
};
