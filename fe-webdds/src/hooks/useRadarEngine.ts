/**
 * Created Date       : 11-04-2026
 * Description        : Hooks untuk menggabungkan semua hooks yang ada, berfungsi sebagai gerbang tunggal (Gateway) yang menyatukan sub-hook infrastruktur, 
 
 * 
 * Arsitektur:
 *   useRadarEngine (Facade) --+-- useMapInstance (Infrastructure Layer: Map & Layers)
 *                             |
 *                             +-- useMapInteractions (Interaction Layer: Click & Popups)
 *                             |
 *                             +-- useRadarSimulation (Engine Layer: Animation & Math)
 *
 * Changelog:
 *   - 0.2.0 (11-04-2026): Refaktor modularitas total menggunakan pola sub-system hooks.
 */
import { useMapInstance } from './useMapInstance';
import { useMapInteractions } from './useMapInteractions';
import { useRadarSimulation } from './useRadarSimulation';

/**
 * Hook yang menggabungkan semua hooks yang ada, berfungsi sebagai gerbang tunggal (Gateway) yang menyatukan sub-hook infrastruktur.
 * 
 * @returns Objek yang berisi data popup, setter data popup, referensi ID track yang dipilih, dan referensi instance popup.
 */
export function useRadarEngine() {
  const mapControl = useMapInstance();

  const mapInteraction = useMapInteractions(
    mapControl.mapInstanceRef, 
    mapControl.overlayElement
  );

  useRadarSimulation(
    mapControl.mapInstanceRef,
    mapInteraction.selectedTrackId,
    mapInteraction.popupInstanceRef
  );

  return {
    ...mapControl,
    popupData: mapInteraction.popupData,
  };
}
