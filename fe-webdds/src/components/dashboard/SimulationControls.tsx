/**
 * Created Date       : 11-04-2026
 * Description        : Kontrol aksi untuk memanipulasi parameter simulasi penjejakan (Tracking) navigasi laut.
 *                      Fokus utama: Konfigurasi kuantitas objek simulasi, serta Start & Stop pergerakan OpenLayers.
 *
 * Arsitektur:
 *   SimulationControls (Trigger) ──► useSimulationStore ──► useRadarSimulation
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Implementasi tombol simulasi dan integrasi input jumlah max target per sesi.
 */
import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';

/**
 * Komponen yang menyediakan tombol kontrol untuk Start/Stop simulasi radar.
 * @returns Elemen JSX yang berisi tombol kontrol simulasi.
 */
export const SimulationControls: React.FC = () => {
  const isActive = useSimulationStore(state => state.isActive);
  const startSimulation = useSimulationStore(state => state.startSimulation);
  const endSimulation = useSimulationStore(state => state.endSimulation);
  const targetCount = useSimulationStore(state => state.targetCount);
  const setTargetCount = useSimulationStore(state => state.setTargetCount);

  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className={`flex justify-between items-center p-4 rounded border transition-all 
        ${isActive ? 'bg-surface-100 border-surface-200 cursor-not-allowed opacity-70' : 'bg-surface-50 border-surface-200'}`}
      >
        <span className={`font-bold uppercase text-xs tracking-widest flex items-center gap-2 
          ${isActive ? 'text-surface-400' : 'text-surface-700'}`}>
           <svg className={`w-4 h-4 ${isActive ? 'text-surface-300' : 'text-cyan-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
           Target Objek
        </span>
        <input 
            type="number" 
            min={1} 
            max={100000} 
            value={targetCount} 
            onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
            disabled={isActive}
            className={`w-24 bg-white border border-surface-200 text-surface-900 rounded py-1 px-2 text-right font-mono font-bold focus:outline-none focus:border-cyan-400 
              ${isActive ? 'cursor-not-allowed text-surface-400 opacity-50' : ''}`}
         />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={startSimulation}
        disabled={isActive}
        className={`flex items-center justify-center gap-3 py-5 font-bold uppercase tracking-widest text-white transition-all 
          ${isActive ? 'bg-cyan-300 cursor-not-allowed' : 'bg-cyan-400 hover:bg-cyan-500 hover:shadow-lg'}`}
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        Start Simulasi
      </button>

      <button 
        onClick={endSimulation}
        disabled={!isActive}
        className={`flex items-center justify-center gap-3 py-5 font-bold uppercase tracking-widest transition-all
          ${!isActive ? 'bg-surface-100 text-surface-400 cursor-not-allowed' : 'bg-surface-200 text-surface-900 hover:bg-surface-300'}`}
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M6 6h12v12H6z" />
        </svg>
        Stop Simulasi
        </button>
      </div>
    </div>
  );
};
