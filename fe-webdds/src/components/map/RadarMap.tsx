/**
 * Created Date       : 11-04-2026
 * Description        : Antarmuka UI (Presentation Layer) untuk Engine Peta Taktis OpenLayers.
 *                      Fokus utama: Murni meletakkan komponen HTML visual. Logika berat
 *                      telah dipindahkan ke `useRadarEngine` untuk meminimalkan beban re-render.
 *
 * Arsitektur:
 *   useRadarEngine (Logika State & Rekursi WebGL) ──► RadarMap (Pemetaan DOM Element)
 *
 * Changelog:
 *   - 0.2.0 (11-04-2026): Pemisahan penuh fungsionalitas peta ke custom hook (useRadarEngine).
 */
import React from 'react';
import { TrackTooltip } from './TrackTooltip';
import { MapToolbar } from './MapToolbar';
import { RadarSweep } from './RadarSweep';
import { useRadarEngine } from '../../hooks/useRadarEngine';

/**
 * Komponen Peta Radar utama yang mengintegrasikan OpenLayers.
 * Menampilkan posisi target, efek sapuan radar, dan kontrol peta.
 * 
 * @returns Elemen JSX kontainer peta radar.
 */
export const RadarMap: React.FC = () => {
  const {
    mapElement,
    overlayElement,
    sweepElement,
    popupData,
    mapType,
    handleZoomIn,
    handleZoomOut,
    handleCenter,
    toggleMapType
  } = useRadarEngine();

  return (
    <div className="relative w-full h-[65vh] min-h-[600px] bg-surface-900 rounded shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-surface-100 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#00d8ff 1px, transparent 1px), linear-gradient(90deg, #00d8ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <TrackTooltip ref={overlayElement} data={popupData} />

      <RadarSweep ref={sweepElement} />

      <div ref={mapElement} className="absolute inset-0 z-10" />

      <MapToolbar 
        onCenter={handleCenter}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleMapType={toggleMapType}
        mapType={mapType}
      />

      <div className="absolute top-6 left-6 z-20 font-bold uppercase tracking-widest text-[10px] space-y-2 pointer-events-none bg-white/80 backdrop-blur py-2 px-3 rounded shadow-sm">
         <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 bg-success" />
             <span className="text-surface-700">Teman</span>
         </div>
         <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 bg-danger" />
             <span className="text-surface-700">Musuh</span>
         </div>
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 font-bold uppercase text-[10px] text-surface-800 tracking-widest pointer-events-none bg-white/60 backdrop-blur px-2 py-1 rounded">
         NORTH_VECTOR
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 font-bold uppercase text-[10px] text-surface-800 tracking-widest pointer-events-none bg-white/60 backdrop-blur px-2 py-1 rounded">
         SOUTH_VECTOR
      </div>
      
    </div>
  );
};
