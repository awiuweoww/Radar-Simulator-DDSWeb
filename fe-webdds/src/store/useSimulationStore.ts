/**
 * Created Date       : 11-04-2026
 * Description        : Engine Radar Real-time berbasis WebDDS.
 *                      Menerima streaming data biner dari Gateway dan menayangkannya ke OpenLayers 
 *                      secara efisien menggunakan pola sinkronisasi Feature Map.
 *
 * Arsitektur:
 *   radarApi (WS) ──► useRadarSimulation (Hook) ──► Point Features (OL)
 */

import { create } from 'zustand';
import { TrackData } from '../types/RadarTrack';

interface SimulationState {
  isActive: boolean;
  fps: number;
  totalObjects: number;
  targetCount: number;
  selectedTrack: TrackData | null;
  setTargetCount: (count: number) => void;
  startSimulation: () => void;
  endSimulation: () => void;
  setStats: (fps: number, totalObjects: number) => void;
  setSelectedTrack: (track: TrackData | null) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isActive: false,
  fps: 60.1,
  totalObjects: 0,
  targetCount: 3000,
  selectedTrack: null,
  setTargetCount: (count) => set({ targetCount: count }),
  startSimulation: () => set({ isActive: true }),
  endSimulation: () => set({ isActive: false }),
  setStats: (fps, totalObjects) => set({ fps, totalObjects }),
  setSelectedTrack: (track) => set({ selectedTrack: track }),
}));
