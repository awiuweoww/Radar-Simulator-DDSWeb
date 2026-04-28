/**
 * Created Date       : 11-04-2026
 * Description        : Hook untuk mengelola interaksi pada peta OpenLayers.
 *                      Bertanggung jawab atas deteksi fitur (kapal), manajemen state transien Tooltip/Popup,
 
 */
import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { TrackData } from '../types/RadarTrack';

import { useSimulationStore } from '../store/useSimulationStore';

/**
 * Hook untuk mengelola interaksi pada peta OpenLayers.
 * Bertanggung jawab atas deteksi fitur (kapal), manajemen state transien Tooltip/Popup,
 * sinkronisasi posisi overlay terhadap koordinat dinamis, serta manajemen state kursor untuk UX yang responsif.
 * 
 * @param mapInstanceRef Referensi ke instance peta OpenLayers.
 * @param overlayElement Referensi ke elemen overlay (tooltip/popup).
 * @returns Objek yang berisi data popup, setter data popup, referensi ID track yang dipilih, dan referensi instance popup.
 */
export function useMapInteractions(
  mapInstanceRef: React.MutableRefObject<Map | null>, 
  overlayElement: React.RefObject<HTMLDivElement>
) {
  const popupData = useSimulationStore(state => state.selectedTrack);
  const setPopupData = useSimulationStore(state => state.setSelectedTrack);
  const selectedTrackId = useRef<number | null>(null);
  const popupInstanceRef = useRef<Overlay | null>(null);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !overlayElement.current) return;

    const popup = new Overlay({
      element: overlayElement.current,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -15],
    });
    map.addOverlay(popup);
    popupInstanceRef.current = popup;

    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature && feature.get('trackData')) {
        const data = feature.get('trackData') as TrackData;
        selectedTrackId.current = data.trackId; // number
        setPopupData(data);
        popup.setPosition(fromLonLat([data.lon, data.lat]));
      } else {
        selectedTrackId.current = null;
        setPopupData(null);
        popup.setPosition(undefined);
      }
    });

    return () => {
      map.removeOverlay(popup);
      popupInstanceRef.current = null;
    };
  }, [mapInstanceRef.current]);

  return {
    popupData,
    setPopupData,
    selectedTrackId,
    popupInstanceRef
  };
}
