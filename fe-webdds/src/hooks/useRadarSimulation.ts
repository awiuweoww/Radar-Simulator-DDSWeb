/**
 * Created Date       : 11-04-2026
 * Description        : Engine Radar Real-time berbasis WebDDS teroptimasi.
 *                      Menggunakan Session Tracking untuk mencegah kebocoran data antar sesi.
 */
import { useEffect, useRef } from 'react';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import OLMap from 'ol/Map';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, RegularShape } from 'ol/style';
import { useSimulationStore } from '../store/useSimulationStore';
import { TrackData } from '../types/RadarTrack';
import { CENTER_COORD } from './useMapInstance';
import { radarApi, RadarUpdateCallback } from '../utils/api/radarApi';
import { radarLogger } from '../utils/logger/radarLogger';

// Cache Styles
const FRIEND_STYLE = new Style({
  image: new RegularShape({
    fill: new Fill({ color: '#22c55e' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
    points: 4, radius: 8, angle: Math.PI / 4,
  }),
});

const HOSTILE_STYLE = new Style({
  image: new RegularShape({
    fill: new Fill({ color: '#ef4444' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
    points: 4, radius: 8, angle: Math.PI / 4,
  }),
});

export function useRadarSimulation(
  mapInstanceRef: React.MutableRefObject<OLMap | null>,
  selectedTrackId: React.MutableRefObject<number | null>,
  popupInstanceRef: React.MutableRefObject<Overlay | null>
) {
  const isActive = useSimulationStore(state => state.isActive);
  const targetCount = useSimulationStore(state => state.targetCount);
  const setStats = useSimulationStore(state => state.setStats);
  const setPopupData = useSimulationStore(state => state.setSelectedTrack);
  
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const animationRef = useRef<number>();
  const lastStateUpdateTime = useRef<number>(0);
  const currentSessionId = useRef<number>(0); 
  
  const livePoolRef = useRef<Map<number, TrackData>>(new Map());
  const featureMap = useRef<Map<number, Feature<Point>>>(new Map());

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const pointsLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: (feature) => {
        const type = feature.get('classification') as number;
        return type === 1 ? HOSTILE_STYLE : FRIEND_STYLE;
      },
      zIndex: 999,
    });
    map.addLayer(pointsLayer);

    return () => {
      if (map) map.removeLayer(pointsLayer);
    };
  }, [mapInstanceRef.current]);
 
  /**
   * Manajemen Koneksi dengan Session Guard
   */
  useEffect(() => {
    if (isActive) {
      const sessionId = Date.now();
      currentSessionId.current = sessionId;

      livePoolRef.current.clear();
      vectorSourceRef.current.clear();
      featureMap.current.clear();

      const dataHandler: RadarUpdateCallback = (data) => {
        if (currentSessionId.current !== sessionId) return;

        const pool = livePoolRef.current;
        const features = featureMap.current;
        const source = vectorSourceRef.current;
        const newFeatures: Feature<Point>[] = [];

        data.forEach(t => {
           if (t.trackId >= targetCount) return;
           pool.set(t.trackId, t);
           
           let feature = features.get(t.trackId);
           const coords = fromLonLat([t.lon, t.lat]);

           if (!feature) {
              feature = new Feature({ geometry: new Point(coords) });
              feature.set('classification', t.classification);
              feature.set('trackData', t);
              features.set(t.trackId, feature);
              newFeatures.push(feature);
           } else {
              feature.getGeometry()?.setCoordinates(coords);
              feature.set('trackData', t);
           }

           if (selectedTrackId.current !== null && selectedTrackId.current === t.trackId) {
              setPopupData(t);
              popupInstanceRef.current?.setPosition(coords);
           }
        });

        if (newFeatures.length > 0) {
            source.addFeatures(newFeatures);
        }
        if (pool.size > targetCount) {
            pool.forEach((_, id) => {
                if (id >= targetCount) {
                    pool.delete(id);
                    const f = features.get(id);
                    if (f) {
                        source.removeFeature(f);
                        features.delete(id);
                    }
                }
            });
        }
      };

      radarApi.connect(targetCount, dataHandler);
      radarApi.updateTargetCount(targetCount);
    } else {
      currentSessionId.current = 0; 
      radarApi.disconnect();
      livePoolRef.current.clear();
      vectorSourceRef.current.clear();
      featureMap.current.clear();
    }
    
    return () => {
      currentSessionId.current = 0;
      radarApi.disconnect();
    };
  }, [isActive, targetCount]); 

  /**
   * Fungsi statistik dengan proteksi Jitter
   */
  useEffect(() => {
    if (!isActive) {
       setStats(0, 0);
       return; 
    }

    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (isActive) {
        if (time - lastStateUpdateTime.current > 500) {
            const rawFps = dt > 0 ? 1000 / dt : 60;
            const finalFps = (rawFps > 0 && rawFps < 200) ? rawFps : 60.1;
            
            const currentTotal = livePoolRef.current.size;
            setStats(finalFps, currentTotal);
            
            radarLogger.logDataDrop(currentTotal, targetCount);
            lastStateUpdateTime.current = time;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return vectorSourceRef;
}
