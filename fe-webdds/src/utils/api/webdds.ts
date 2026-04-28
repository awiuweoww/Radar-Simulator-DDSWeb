
/**
 * Representasi Topik DDS di sisi Web
 */
export class Topic {
  constructor(public name: string, public type: string) { }
}

export type WebDDSCallback = (data: any, rawLength?: number) => void;

/**
 * Participant WebDDS yang mengelola koneksi ke Gateway 
 */
export class WebDDSParticipant {
  private restUrl: string;
  private wsUrl: string;
  private domainId: number;
  private sockets: Set<WebSocket> = new Set();

  constructor(restUrl: string, wsUrl: string, domainId: number = 0) {
    this.restUrl = restUrl;
    this.wsUrl = wsUrl;
    this.domainId = domainId;
    console.log(`[OMG WebDDS] Participant initialized for Domain ${this.domainId}`);
  }

  /**
   * Semantik: Subscribe (DataReader)
   * Membuka WebSocket ke Resource URI Topik.
   */
  public subscribe(topic: Topic, callback: WebDDSCallback): WebSocket {
    // Pola URL /domain/{id}/topic/{name}/data
    const socketUrl = `${this.wsUrl}/domain/${this.domainId}/topic/${topic.name}/data`;
    const ws = new WebSocket(socketUrl);
    this.sockets.add(ws);

    ws.onopen = () => {
      console.log(`[OMG WebDDS] Streaming started for Topic: ${topic.name}`);
    };

    ws.onmessage = (event) => {
      try {
        const rawLength = typeof event.data === 'string' ? event.data.length : (event.data.byteLength || 0);
        const data = JSON.parse(event.data);
        callback(data, rawLength);
      } catch (e) {
        console.error("[OMG WebDDS] Failed to parse message:", e);
      }
    };

    ws.onerror = (error) => {
      console.error(`[OMG WebDDS] WebSocket Error on ${topic.name}:`, error);
    };

    ws.onclose = () => {
      this.sockets.delete(ws);
      console.log(`[OMG WebDDS] Socket closed for topic: ${topic.name}`);
    };

    return ws;
  }

  /**
   * Semantik: Publish (DataWriter)
   * Mengirim data menggunakan HTTP POST ke Resource URI.
   */
  public publish(topic: Topic) {
    const publishUrl = `${this.restUrl}/domain/${this.domainId}/topic/${topic.name}/data`;

    return {
      write: async (data: any) => {
        try {
          const response = await fetch(publishUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (e) {
          console.error(`[OMG WebDDS] Failed to publish to ${topic.name}:`, e);
        }
      }
    };
  }

  public disconnect() {
    console.log(`[OMG WebDDS] Disconnecting ${this.sockets.size} sockets...`);
    this.sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    });
    this.sockets.clear();
  }
}

/**
 * Entry point utama WebDDS
 */
export class WebDDS {
  private restUrl: string;
  private wsUrl: string;

  constructor(restUrl: string, wsUrl: string) {
    this.restUrl = restUrl;
    this.wsUrl = wsUrl;
  }

  public createParticipant(domainId: number): WebDDSParticipant {
    return new WebDDSParticipant(this.restUrl, this.wsUrl, domainId);
  }
}
