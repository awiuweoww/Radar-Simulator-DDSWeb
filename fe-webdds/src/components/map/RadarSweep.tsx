/**
 * Created Date       : 11-04-2026
 * Description        : Komponen overlay efek putaran grafik radar Peta Pengejaran.
 *                      Fokus utama: Menampilkan efek putaran grafik radar.
 *
 * Changelog:
 *   - 0.1.0 (11-04-2026): Implementasi efek putaran grafik radar.
 */
import React, { forwardRef } from 'react';
import colors from '../../utils/colors';

export const RadarSweep = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div 
      ref={ref} 
      className="pointer-events-none rounded-full mix-blend-screen"
      style={{ 
          width: '800px',
          height: '800px', 
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 330deg, ${(colors.success as string)}73 330deg, ${(colors.success as string)}73 360deg)`,
          animation: 'spin 3s linear infinite'
      }} 
    />
  );
});

RadarSweep.displayName = 'RadarSweep';
