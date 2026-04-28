/**
 * Created Date       : 11-04-2026
 * Description        : Hook untuk mengelola instance peta OpenLayers.
 *                      Bertanggung jawab atas instansiasi objek Map, manajemen resolusi Viewport,
 *                      dan orkestrasi TileLayer (OSM/Satelit) serta VectorLayer statis (Cincin Radar).
 */
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import CircleGeom from 'ol/geom/Circle';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke } from 'ol/style';
import colors from '../utils/colors';

export const CENTER_COORD = fromLonLat([110.5000, -5.5000]);

/**
 * Hook untuk menginisialisasi dan mengelola instance peta OpenLayers.
 * 
 * @returns Objek yang berisi referensi elemen peta, status, dan fungsi kontrol peta.
 */
export function useMapInstance() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const overlayElement = useRef<HTMLDivElement>(null);
  const sweepElement = useRef<HTMLDivElement>(null);
  
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const gridSourceRef = useRef<VectorSource>(new VectorSource());

  useEffect(() => {
    if (!mapElement.current || !overlayElement.current) return;

    const ringsLayer = new VectorLayer({
      source: gridSourceRef.current,
      style: new Style({
        stroke: new Stroke({ color: `${(colors.cyan as Record<number, string>)[400]}66`, width: 2 }), 
      }),
      zIndex: 1,
    });

    for (let i = 1; i <= 3; i++) {
        const ring = new Feature({
            geometry: new CircleGeom(CENTER_COORD, i * 15000),
        });
        gridSourceRef.current.addFeature(ring);
    }

    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({ source: new OSM(), zIndex: 0 }),
        ringsLayer,
      ],
      view: new View({
        center: CENTER_COORD,
        zoom: 9.5,
      }),
      controls: [], 
    });

    const sweepOverlay = new Overlay({
      element: sweepElement.current!,
      position: CENTER_COORD,
      positioning: 'center-center',
      stopEvent: false,
    });
    initialMap.addOverlay(sweepOverlay);

    /**
     * Menyesuaikan ukuran elemen sapuan radar (sweep)
     */
    const syncSweepSize = () => {
      if (sweepElement.current && initialMap) {
        const res = initialMap.getView().getResolution();
        if (res) {
          const diameterPx = (45000 * 2) / res;
          sweepElement.current.style.width = `${diameterPx}px`;
          sweepElement.current.style.height = `${diameterPx}px`;
        }
      }
    };

    initialMap.getView().on('change:resolution', syncSweepSize);
    setTimeout(syncSweepSize, 100); 

    mapInstanceRef.current = initialMap;

    return () => {
      initialMap.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const layers = mapInstanceRef.current.getLayers().getArray();
    const baseLayer = layers[0] as TileLayer<XYZ | OSM>;

    if (mapType === 'satellite') {
      baseLayer.setSource(new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
      }));
    } else {
      baseLayer.setSource(new OSM());
    }
  }, [mapType]);

  /**
   * Memperbesar tampilan peta.
   * @returns zoom in
   */
  const handleZoomIn = () => mapInstanceRef.current?.getView().animate({ zoom: (mapInstanceRef.current?.getView().getZoom() || 0) + 1, duration: 250 });
  
  /**
   * Memperkecil tampilan peta.
   * @returns zoom out
   */
  const handleZoomOut = () => mapInstanceRef.current?.getView().animate({ zoom: (mapInstanceRef.current?.getView().getZoom() || 0) - 1, duration: 250 });
  
  /**
   * Mengembalikan tampilan peta ke titik tengah (pusat radar).
   * @returns center
   */
  const handleCenter = () => mapInstanceRef.current?.getView().animate({ center: CENTER_COORD, zoom: 9.5, duration: 500 });
  
  /**
   * Beralih antara tipe peta standar (OSM) dan satelit.
   * @returns toggle map type
   */
  const toggleMapType = () => setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');

  return {
    mapElement,
    overlayElement,
    sweepElement,
    mapInstanceRef,
    mapType,
    handleZoomIn,
    handleZoomOut,
    handleCenter,
    toggleMapType
  };
}
