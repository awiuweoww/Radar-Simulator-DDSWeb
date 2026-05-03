/**
 * OMG DDS-WEB Standard Gateway 
 * 
 */

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
                history: { kind: 'KEEP_LAST_HISTORY_QOS', depth: 10 },
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
        const typeName = (topicName === 'RadarTrackTopic') ? 'RadarTrack::TrackData' : 'RadarCommand::Command';

        console.log(` [WS] Berlangganan ke ${topicName}`);

        const subQos = 
            {
                DataReaderQos: {
                    reliability: { kind: 'BEST_EFFORT_RELIABILITY_QOS' },
                    history: { kind: 'KEEP_LAST_HISTORY_QOS', depth: 1 }
                }
            };
        const reader = participant.subscribe(topicName, typeName, subQos, (r, sampleInfo, sample) => {
            if (sampleInfo.valid_data && ws.readyState === ws.OPEN) {
                if (ws.bufferedAmount > 512 * 1024) return;

                if (topicName === 'RadarTrackTopic') {
                    const fastJson = `{"trackId":${sample.trackId},"lat":${sample.lat},"lon":${sample.lon},"speed":${sample.speed},"timestamp":${sample.timestamp},"classification":${sample.classification}}`;
                    ws.send(fastJson);
                } else {
                    ws.send(JSON.stringify(sample));
                }
            }
        });


        ws.on('close', () => {
            console.log(` [WS] Berhenti berlangganan dari ${topicName}`);
            try {
                participant.unsubscribe(topicName, reader);
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
        console.log(' [DDS] Pustaka Dimuat (libRadarTrack & libRadarCommand). Menunggu...');
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
