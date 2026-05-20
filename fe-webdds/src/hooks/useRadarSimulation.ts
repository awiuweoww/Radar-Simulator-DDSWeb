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
import { Style, Fill, Stroke, RegularShape, Icon } from 'ol/style';
import { useSimulationStore } from '../store/useSimulationStore';
import { TrackData } from '../types/RadarTrack';
import { CENTER_COORD } from './useMapInstance';
import { radarApi, RadarUpdateCallback } from '../utils/api/radarApi';
import { radarLogger } from '../utils/logger/radarLogger';
//@ts-ignore
import imgSquare from '../assets/images/square.png';
//@ts-ignore
import imgCircle from '../assets/images/circle.png';
//@ts-ignore
import imgTriangle from '../assets/images/triangle.png';
//@ts-ignore
import imgParallelogram from '../assets/images/parallelogram.png';
//@ts-ignore
import imgTrapezoid from '../assets/images/trapezoid.png';
//@ts-ignore
import imgRhombus from '../assets/images/rhombus.png';
//@ts-ignore
import imgEllipse from '../assets/images/ellipse.png';
//@ts-ignore
import imgPentagon from '../assets/images/pentagon.png';
//@ts-ignore
import imgHexagon from '../assets/images/hexagon.png';

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


const SQUARE_STYLE = new Style({
  image: new Icon({
    src: imgSquare,
    scale: 0.12,
    anchor: [0.5, 0.5],
  }),
});

const CIRCLE_STYLE = new Style({
  image: new Icon({
    src: imgCircle,
    scale: 0.09,
    anchor: [0.5, 0.5],
  }),
});

const TRIANGLE_STYLE = new Style({
  image: new Icon({
    src: imgTriangle,
    scale: 0.095,
    anchor: [0.5, 0.5],
  }),
});

const PARALLELOGRAM_STYLE = new Style({
  image: new Icon({
    src: imgParallelogram,
    scale: 0.32,
    anchor: [0.5, 0.5],
  }),
});

const TRAPEZOID_STYLE = new Style({
  image: new Icon({
    src: imgTrapezoid,
    scale: 0.20,
    anchor: [0.5, 0.5],
  }),
});

const RHOMBUS_STYLE = new Style({
  image: new Icon({
    src: imgRhombus,
    scale: 0.27,
    anchor: [0.5, 0.5],
  }),
});

const ELLIPSE_STYLE = new Style({
  image: new Icon({
    src: imgEllipse,
    scale: 0.31,
    anchor: [0.5, 0.5],
  }),
});

const PENTAGON_STYLE = new Style({
  image: new Icon({
    src: imgPentagon,
    scale: 0.35,
    anchor: [0.5, 0.5],
  }),
});

const HEXAGON_STYLE = new Style({
  image: new Icon({
    src: imgHexagon,
    scale: 0.37,
    anchor: [0.5, 0.5],
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

  const livePoolRef = useRef<Map<string, TrackData>>(new Map());
  const featureMap = useRef<Map<string, Feature<Point>>>(new Map());
  const lastUpdateMap = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const pointsLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: (feature) => {
        const shape = feature.get('shape') as string;
        if (shape === 'SQUARE') return SQUARE_STYLE;
        if (shape === 'CIRCLE') return CIRCLE_STYLE;
        if (shape === 'TRIANGLE') return TRIANGLE_STYLE;
        if (shape === 'PARALLELOGRAM') return PARALLELOGRAM_STYLE;
        if (shape === 'TRAPEZOID') return TRAPEZOID_STYLE;
        if (shape === 'RHOMBUS') return RHOMBUS_STYLE;
        if (shape === 'ELLIPSE') return ELLIPSE_STYLE;
        if (shape === 'PENTAGON') return PENTAGON_STYLE;
        if (shape === 'HEXAGON') return HEXAGON_STYLE;

        const type = feature.get('classification') as number;
        return type === 1 ? HOSTILE_STYLE : FRIEND_STYLE;
      },
      zIndex: 999,
      updateWhileAnimating: true,
      updateWhileInteracting: true,
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
      lastUpdateMap.current.clear();

      const dataHandler: RadarUpdateCallback = (data) => {
        if (currentSessionId.current !== sessionId) return;

        const pool = livePoolRef.current;
        const features = featureMap.current;
        const source = vectorSourceRef.current;
        const newFeatures: Feature<Point>[] = [];

        data.forEach(t => {
          const shapeKey = t.shape || 'RADAR';
          const uniqueKey = `${shapeKey}_${t.trackId}`;

          // FILTER: Jika stress test (bukan RADAR) dan ID bukan 0, jangan buat feature-nya
          // Tapi data tetap masuk ke pool untuk kebutuhan statistik jika diperlukan
          const isStress = !!t.shape;
          const shouldRender = !isStress || (isStress && t.trackId === 0);

          if (shapeKey === 'RADAR' && t.trackId >= targetCount) return;

          pool.set(uniqueKey, t);
          lastUpdateMap.current.set(uniqueKey, Date.now());

          if (!shouldRender) return; // Stop di sini jika tidak perlu dirender

          let feature = features.get(uniqueKey);
          const coords = fromLonLat([t.lon, t.lat]);

          if (!feature) {
            feature = new Feature({ geometry: new Point(coords) });
            feature.set('classification', t.classification);
            feature.set('shape', t.shape);
            feature.set('trackData', t);
            features.set(uniqueKey, feature);
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
        if (pool.size > (targetCount + 10000)) { // Cleanup jika terlalu banyak (untuk stress test)
          pool.forEach((_, key) => {
            if (key.startsWith('RADAR_')) {
              const id = parseInt(key.split('_')[1]);
              if (id >= targetCount) {
                pool.delete(key);
                const f = features.get(key);
                if (f) {
                  source.removeFeature(f);
                  features.delete(key);
                }
              }
            }
          });
        }
      };

      radarApi.connect(targetCount, dataHandler);
      radarApi.updateTargetCount(targetCount);
    } else {
      currentSessionId.current = 0;
      radarApi.stop();
      radarApi.disconnect();
      livePoolRef.current.clear();
      vectorSourceRef.current.clear();
      featureMap.current.clear();
      lastUpdateMap.current.clear();
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

          // Global BE Death Detection
          const now = Date.now();
          const GLOBAL_TIMEOUT_MS = 5000;
          const lastGlobalUpdate = Array.from(lastUpdateMap.current.values())
            .reduce((max, val) => Math.max(max, val), 0);

          const isBeAlive = lastGlobalUpdate > 0 && (now - lastGlobalUpdate <= GLOBAL_TIMEOUT_MS);
          const displayedFps = isBeAlive ? finalFps : 0;

          setStats(displayedFps, currentTotal);

          if (lastGlobalUpdate > 0 && !isBeAlive) {
            console.warn("[OMG WebDDS] BE detected DEAD. Clearing UI...");
            livePoolRef.current.clear();
            lastUpdateMap.current.clear();
            vectorSourceRef.current.clear();
            featureMap.current.clear();
          }

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
