/**
 * Created Date       : 11-04-2026
 * Description        : Dasbor statistik metrik untuk memantau performa simulasi Radar (FPS & Jumlah Objek).
 *                      Fokus utama: Membaca status Real-time dari Zustand Store untuk diperlihatkan ke antarmuka pengguna tanpa block/lag.
 *
 * Arsitektur:
 *   Zustand (useSimulationStore) ──► PerformanceStats
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Implementasi visual UI Card statistik performa sinkron dengan global state.
 */
import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';

/**
 * Komponen untuk menampilkan statistik performa radar seperti FPS dan Jumlah Objek.
 * @returns Elemen JSX menampilkan statistik performa radar.
 */
export const PerformanceStats: React.FC = () => {
  const { fps, totalObjects } = useSimulationStore();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-surface-100 flex flex-col justify-center">
        <span className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-2">FPS</span>
        <div className="text-6xl font-extrabold text-surface-900 tracking-tight">{fps.toFixed(1)}</div>
      </div>
      
      <div className="bg-white rounded p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-surface-100 flex flex-col justify-center">
        <span className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-2">Total Objects</span>
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-extrabold text-surface-900 tracking-tight">{totalObjects.toLocaleString()}</span>
          <span className="text-surface-400 font-semibold text-sm uppercase tracking-wider">Active</span>
        </div>
      </div>
    </div>
  );
};
