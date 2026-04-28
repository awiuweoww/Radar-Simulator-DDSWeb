/**
 * @file radarApi.ts
 * @description OMG DDS-WEB Standard Radar API.
 * Menghilangkan parsing biner manual karena Standar OMG otomatis mengirimkan JSON.
 */

import { TrackData } from '../../types/RadarTrack';
import { WebDDS, WebDDSParticipant, Topic } from './webdds';
import { radarLogger } from '../logger/radarLogger';

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
  public connect(targetCount: number, callback: RadarUpdateCallback) {
    if (this.participant) return;

    const dds = new WebDDS(this.restUrl, this.wsUrl);
    this.participant = dds.createParticipant(0);

    /**
     * SUBSCRIBE ke data radar
     * 
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
        radarLogger.logIncomingPackets(data, tracks, rawLength);
        callback(tracks);
      }
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
    if (this.commandWriter) {
      this.commandWriter.write({ action: 'START', value: count });
    }
  }
}

/** @const {RadarSubscriber} radarApi - Singleton instance */
export const radarApi = new RadarSubscriber();
