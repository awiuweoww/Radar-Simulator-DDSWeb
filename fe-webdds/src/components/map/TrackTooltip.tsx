/**
 * Created Date       : 11-04-2026
 * Description        : Komponen UI reaktif untuk menayangkan payload identitas lintasan Data Peta (Tooltip).
 *                      Fokus utama: Menyelaraskan kotak status secara visual sesuai kordinat fitur yang disentuh pengguna di OpenLayers.
 *
 * Arsitektur:
 *   RadarMap (Hit Detection) ──► Overlay OpenLayers ──► TrackTooltip
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Merangkai template Tooltip klasifikasi kawan/musuh dan pelacak Latitude/Longitude DMM.
 */
import React, { forwardRef } from 'react';
import { TrackData } from '../../types/RadarTrack';
import { formatLatitude, formatLongitude, getClassificationTailwindClass } from '../../utils/formatters';

export interface TrackTooltipProps {
  data: TrackData | null;
}

export const TrackTooltip = forwardRef<HTMLDivElement, TrackTooltipProps>(({ data }, ref) => {
  return (
    <div 
      ref={ref} 
      className={`bg-surface-950/90 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-xl border border-surface-700 pointer-events-none transition-opacity duration-200 z-50 overflow-hidden min-w-[140px] ${data ? 'opacity-100' : 'opacity-0'}`}
    >
        {data && (
        <>
            <div className="font-bold border-b border-surface-700 pb-1.5 mb-2.5 text-cyan-400 capitalize tracking-wide flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getClassificationTailwindClass(data.classification)}`} />
                {data.trackId}
            </div>
            
            <div className="text-[11px] space-y-1.5 font-mono text-surface-200">
            <div className="flex justify-between gap-4">
                <span className="text-surface-400">LAT</span> <span>{formatLatitude(data.lat)}</span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-surface-400">LON</span> <span>{formatLongitude(data.lon)}</span>
            </div>
            <div className="flex justify-between gap-4 items-center">
                <span className="text-surface-400">SPEED</span> 
                <span className="bg-surface-800 text-cyan-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {data.speed.toFixed(1)} KTS
                </span>
            </div>
            </div>
        </>
        )}
    </div>
  );
});

TrackTooltip.displayName = 'TrackTooltip';
