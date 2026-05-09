const opendds = require('opendds');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

console.log('---------------------------------');
console.log(' [SYSTEM] OMG DDS-WEB Gateway ...');

const ddsArgs = ['node', ...process.argv.slice(2)];
const factory = opendds.initialize.apply(opendds, ddsArgs);

if (!factory) {
    console.error(' [CRITICAL] Gagal menginisialisasi OpenDDS!');
    console.error('            Pastikan path pada -DCPSConfigFile benar dan file tersebut ada.');
    process.exit(1);
}
const participants = new Map();
const writers = new Map();
const subscriberCounts = new Map();

const IDL_BIN_DIR = path.join(__dirname, 'idl');

function getParticipant(domainId) {
    if (!participants.has(domainId)) {
        console.log(` [DDS] Menginisialisasi Participant Domain ${domainId}...`);
        const participant = factory.create_participant(domainId);
        participants.set(domainId, participant);
    }
    return participants.get(domainId);
}

function getWriter(participant, topicName, typeName) {
    const key = `${topicName}:${typeName}`;
    if (!writers.has(key)) {
        console.log(` [DDS] Membentuk DataWriter untuk: ${topicName}`);
        const qos = {
            DataWriterQos: {
                reliability: { kind: 'RELIABLE_RELIABILITY_QOS' },
                history: { kind: 'KEEP_ALL_HISTORY_QOS' },
                resource_limits: {
                    max_samples: 10000,
                    max_instances: 2000,
                    max_samples_per_instance: 1000
                },
                durability: { kind: 'TRANSIENT_LOCAL_DURABILITY_QOS' }
            }
        };
        const writer = participant.create_datawriter(topicName, typeName, qos);
        writers.set(key, writer);
    }
    return writers.get(key);
}

// REST API (Publish)
app.post(['/dds/domain/:domainId/topic/:topicName/data', '/domain/:domainId/topic/:topicName/data'], (req, res) => {
    const { domainId, topicName } = req.params;
    try {
        const participant = getParticipant(parseInt(domainId));
        const typeName = (topicName === 'RadarTrackTopic') ? 'RadarTrack::TrackData' : 'RadarCommand::Command';
        const writer = getWriter(participant, topicName, typeName);

        const payload = req.body;
        if (payload.value !== undefined) payload.value = Math.floor(Number(payload.value));

        console.log(` [REST] Meneruskan ke DDS: ${JSON.stringify(payload)}`);
        writer.write(payload);

        res.status(201).json({ status: "OK" });
    } catch (err) {
        console.error(` [Kesalahan REST] ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// WebSocket (Subscribe)
wss.on('connection', (ws, req) => {
    const url = req.url.replace('/dds/', '/');
    const urlParts = url.split('/');
    if (urlParts.length < 5) return ws.close();

    const domainId = parseInt(urlParts[2]);
    const topicName = urlParts[4];

    try {
        const participant = getParticipant(domainId);

        const typeNameMap = {
            'RadarTrackTopic': 'RadarTrack::TrackData',
            'CommandTopic': 'RadarCommand::Command',
            'SquareTrackTopic': 'SquareTrack::TrackData',
            'CircleTrackTopic': 'CircleTrack::TrackData',
            'TriangleTrackTopic': 'TriangleTrack::TrackData'
        };

        const typeName = typeNameMap[topicName] || 'RadarCommand::Command';

        console.log(` [WS] Berlangganan ke ${topicName}`);

        // Update subscriber count
        const currentCount = subscriberCounts.get(topicName) || 0;
        subscriberCounts.set(topicName, currentCount + 1);

        const subQos =
        {
            DataReaderQos: {
                reliability: { kind: 'BEST_EFFORT_RELIABILITY_QOS' },
                history: { kind: 'KEEP_LAST_HISTORY_QOS', depth: 1 }
            }
        };
        const reader = participant.subscribe(topicName, typeName, subQos, (r, sampleInfo, sample) => {
            if (sampleInfo.valid_data && ws.readyState === ws.OPEN) {
                if (ws.bufferedAmount > 10 * 1024 * 1024) return;

                if (topicName === 'RadarTrackTopic') {
                    const gatewayReceivedAt = Date.now();
                    const fastJson = `{"trackId":${sample.trackId},"lat":${sample.lat},"lon":${sample.lon},"speed":${sample.speed},"timestamp":${sample.timestamp},"classification":${sample.classification},"commandReceivedAt":${sample.commandReceivedAt || 0},"gatewayReceivedAt":${gatewayReceivedAt}}`;
                    ws.send(fastJson);
                } else if (topicName.includes('Square') || topicName.includes('Circle') || topicName.includes('Triangle')) {
                    const gatewayReceivedAt = Date.now();
                    const shape = topicName.replace('TrackTopic', '').toUpperCase();
                    const fastJson = `{"trackId":${sample.trackId},"lat":${sample.lat},"lon":${sample.lon},"timestamp":${sample.timestamp},"shape":"${shape}","gatewayReceivedAt":${gatewayReceivedAt}}`;
                    ws.send(fastJson);
                } else {
                    ws.send(JSON.stringify(sample));
                }
            }
        });


        // RTT Ping/Pong: FE mengirim __ping, gateway langsung echo __pong
        ws.on('message', (msg) => {
            try {
                const str = typeof msg === 'string' ? msg : msg.toString();
                if (str.startsWith('{"__ping":')) {
                    const parsed = JSON.parse(str);
                    ws.send(JSON.stringify({ __pong: parsed.__ping }));
                }
            } catch (_) { /* ignore non-ping messages */ }
        });

        ws.on('close', () => {
            console.log(` [WS] Berhenti berlangganan dari ${topicName}`);

            // Update subscriber count
            const newCount = (subscriberCounts.get(topicName) || 1) - 1;
            subscriberCounts.set(topicName, Math.max(0, newCount));

            // Jika tidak ada lagi yang menonton radar, kirim STOP ke BE
            if (topicName === 'RadarTrackTopic' && newCount <= 0) {
                try {
                    const cmdWriter = getWriter(participant, 'CommandTopic', 'RadarCommand::Command');
                    console.log(' [SYSTEM] Semua client terputus. Mengirim STOP ke Backend...');
                    cmdWriter.write({ action: 'STOP', value: 0 });
                } catch (err) {
                    console.error(` [Peringatan STOP Otomatis] ${err.message}`);
                }
            }

            try {
                participant.unsubscribe(reader);
            } catch (err) {
                console.error(` [Peringatan Pembersihan WS] ${err.message}`);
            }
        });

    } catch (err) {
        console.error(` [Kesalahan WS]`, err.message);
        ws.close();
    }
});

/** Berfungsi untuk menginisialisasi komunikasi DDS */
async function initializeDDS() {
    try {
        opendds.load(path.join(IDL_BIN_DIR, 'RadarTrack', 'libRadarTrack'));
        opendds.load(path.join(IDL_BIN_DIR, 'RadarCommand', 'libRadarCommand'));
        opendds.load(path.join(IDL_BIN_DIR, 'SquareTrack', 'libSquareTrack'));
        opendds.load(path.join(IDL_BIN_DIR, 'CircleTrack', 'libCircleTrack'));
        opendds.load(path.join(IDL_BIN_DIR, 'TriangleTrack', 'libTriangleTrack'));

        console.log(' [DDS] Semua Pustaka Dimuat (Radar + Stress Topics). Menunggu...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const p0 = getParticipant(0);
        getWriter(p0, 'CommandTopic', 'RadarCommand::Command');
        console.log(' [DDS] Pemanasan CommandWriter Dimulai (Domain 0).');
    } catch (e) {
        console.error(' [Kesalahan DDS] Inisialisasi gagal:', e.message);
    }
}

initializeDDS();

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`         OMG DDS-WEB Gateway  Aktif            `);
    console.log(`===============================================`);
});
