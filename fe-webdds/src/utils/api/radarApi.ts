/**
 * @file radarApi.ts
 * @description Layer API Radar khusus yang dibangun di atas standar OMG DDS-WEB.
 * File ini mengelola langganan ke track radar dan pengiriman perintah kontrol,
 * berfungsi sebagai jembatan antara komponen React dan Gateway DDS-WEB.
 */

import { TrackData } from '../../types/RadarTrack';
import { WebDDS, WebDDSParticipant, Topic } from './webdds';
import { radarLogger } from '../logger/radarLogger';
import { stressLogger } from '../logger/stressLogger';
import { raceLogger } from '../logger/raceLogger';

export type RadarUpdateCallback = (data: TrackData[]) => void;

class RadarSubscriber {
  private participant: WebDDSParticipant | null = null;
  private trackTopic: Topic;
  private commandTopic: Topic;
  private commandWriter: any = null;
  private restUrl: string = '';
  private wsUrl: string = '';

  constructor() {
    try {
      this.restUrl = (import.meta as any).env.VITE_DDS_GATEWAY_REST || 'http://localhost:8080/dds';
      this.wsUrl = (import.meta as any).env.VITE_DDS_GATEWAY_WS || 'ws://localhost:8080/dds';
    } catch (e) {
      this.restUrl = 'http://localhost:8080/dds';
      this.wsUrl = 'ws://localhost:8080/dds';
    }

    /** Inisialisasi Topik sesuai IDL*/
    this.trackTopic = new Topic('RadarTrackTopic', 'RadarTrack::TrackData');
    this.commandTopic = new Topic('CommandTopic', 'RadarCommand::Command');
  }

  /**
   * Semantik WebDDS: Connect & Subscribe
   */
  private currentTargetCount: number = 0;

  public connect(targetCount: number, callback: RadarUpdateCallback) {
    this.currentTargetCount = targetCount;
    if (this.participant) return;

    const dds = new WebDDS(this.restUrl, this.wsUrl);
    this.participant = dds.createParticipant(0);

    /**
     * SUBSCRIBE ke data radar
     */
    this.participant.subscribe(this.trackTopic, (data: any, rawLength?: number) => {
      let tracks: TrackData[] = [];

      if (data && typeof data === 'object' && !Array.isArray(data) && data.trackId !== undefined) {
        tracks = [data as TrackData];
      } else if (data && data.tracks && Array.isArray(data.tracks)) {
        tracks = data.tracks;
      } else if (Array.isArray(data)) {
        tracks = data;
      }

      if (tracks.length > 0) {
        raceLogger.logArrival("RADAR", tracks[0].timestamp);
        radarLogger.logIncomingPackets(data, tracks, this.currentTargetCount, rawLength);

        tracks.forEach(track => {
          stressLogger.logStressPacket({
            trackId: track.trackId,
            shape: 'RADAR',
            timestamp: track.timestamp,
            gatewayReceivedAt: (track as any).gatewayReceivedAt
          }, this.currentTargetCount);
        });

        callback(tracks);
      }
    });

    /** SUBSCRIBE ke Stress Test Topics */
    ['Square', 'Circle', 'Triangle', 'Parallelogram', 'Trapezoid', 'Rhombus', 'Ellipse', 'Pentagon', 'Hexagon'].forEach((shapeName) => {
      const topic = new Topic(`${shapeName}TrackTopic`, `${shapeName}Track::TrackData`);

      this.participant!.subscribe(topic, (data: any) => {
        const samples = Array.isArray(data) ? data : [data];

        if (samples.length > 0) {
          raceLogger.logArrival(shapeName.toUpperCase(), samples[0].timestamp);

          samples.forEach((s: any) => {
            stressLogger.logStressPacket({
              trackId: s.trackId,
              shape: shapeName.toUpperCase(),
              timestamp: s.timestamp,
              gatewayReceivedAt: s.gatewayReceivedAt
            }, 100);
          });

          const stressData = samples.map((d: any) => ({ ...d, shape: shapeName.toUpperCase() }));
          callback(stressData);
        }
      });
    });

    /** Publish Dashboard Command */
    this.commandWriter = this.participant.publish(this.commandTopic);

    console.log(`[OMG WebDDS] API Connected to: ${this.restUrl}`);
    radarLogger.logConnection('CONNECTED', this.restUrl);
  }

  public disconnect(): void {
    if (this.participant) {
      this.participant.disconnect();
      this.participant = null;
      console.log('[OMG WebDDS] Participant disconnected');
    }
  }

  /**
   * Mengirim statistik/perintah ke Simulator C++ 
   */
  public updateTargetCount(count: number): void {
    this.currentTargetCount = count;
    if (this.commandWriter) {
      if (count > 0) {
        raceLogger.reset();
      }
      radarLogger.logFeToBeSend(count);
      const action = count > 0 ? 'START' : 'STOP';
      this.commandWriter.write({ action, value: count });
    }
  }

  public stop(): void {
    if (this.commandWriter) {
      raceLogger.reset();
      this.commandWriter.write({ action: 'STOP', value: 0 });
    }
  }
}

/** @const {RadarSubscriber} radarApi - Singleton instance */
export const radarApi = new RadarSubscriber();
