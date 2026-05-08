#include <iostream>
#include <chrono>
#include <thread>
#include <cmath>
#include <vector>
#include <iomanip>

#include "utils/config_util/config_util.h"
#include "utils/log_util/log_util.h"
#include "adapters/service_adapters/odds_adapter/domain_participant/domain_participant.h"
#include "adapters/service_adapters/odds_adapter/publishers/radar_track_publisher/radar_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/subscribers/radar_command_subscriber/radar_command_subscriber.h"
#include "handlers/service_interface_handlers/radar_handler/radar_handler.h"
#include "threads/backend_interface_thread/backend_interface_thread.h"

// Stress Test Publishers
#include "adapters/service_adapters/odds_adapter/publishers/square_track_publisher/square_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/circle_track_publisher/circle_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/triangle_track_publisher/triangle_track_publisher.h"

/**
 * Konfigurasi Stress Test
 */
struct SimulationConfig {
    bool squareEnabled   = false;
    bool circleEnabled   = false;
    bool triangleEnabled = false;
    int stressObjectCount = 3000;
};

/**
 * Generator angka acak sederhana berbasis seed.
 */
double get_random(int index, double seed) {
    return fmod(std::abs(sin(index * 12.9898 + seed * 78.233)) * 43758.5453, 1.0);
}

/**
 * Mengambil timestamp millisecond dari system_clock.
 * Dipanggil SEKALI per burst — seluruh track dalam satu siklus
 * menggunakan timestamp yang sama agar baseline pengukuran latency konsisten.
 */
static inline long long get_burst_timestamp_ms() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();
}

int main(int argc, char* argv[]) {
    try {
        LOG_INFO("Main", " [Backend] Mesin radar OpenDDS v1.2 - MODE STREAMING (FIXED) dimulai...");

        ConfigUtil::create_instance();

        /** Inisialisasi Domain Participant */
        DDS::DomainParticipantFactory_var factory = TheParticipantFactoryWithArgs(argc, argv);
        auto participant = ODDSDomainParticipant::get_instance(factory)->get_participant_();

        /** Inisialisasi Publisher */
        RadarTrackODDSPublisher radar_publisher(participant);

        // Inisialisasi Stress Publishers
        SquareTrackODDSPublisher square_publisher(participant);
        CircleTrackODDSPublisher circle_publisher(participant);
        TriangleTrackODDSPublisher triangle_publisher(participant);

        SimulationConfig config;

        /** Inisialisasi Subscriber dan Handler */
        RadarCommandODDSSubscriber radar_subscriber(participant);
        RadarHandler radar_handler(&radar_subscriber);
        radar_subscriber.add_observer(&radar_handler);
        std::thread subscriber_thread(
            BackendInterfaceThreadsContainer::radar_receiver_thread,
            &radar_subscriber
        );

        auto startTime = std::chrono::steady_clock::now();

        /**
         * Pre-kalkulasi parameter statis setiap track.
         * Semua nilai ini deterministik (berbasis index + seed konstan).
         */
        struct TrackParams {
            double startLat;
            double startLon;
            float  speed;
            double sinHeading;
            double cosHeading;
            uint8_t classification;
        };

        const int MAX_TRACKS = 10000;
        std::vector<TrackParams> params(MAX_TRACKS);
        for (int i = 0; i < MAX_TRACKS; i++) {
            double headingRad    = get_random(i, 3.3) * 6.28318;
            double knots         = 100.0 + (get_random(i, 5.5) * 400.0);
            double velocityFactor = knots * 0.0000035;

            params[i].startLat      = -5.5 + (get_random(i, 1.1) - 0.5) * 1.5;
            params[i].startLon      = 110.5 + (get_random(i, 2.2) - 0.5) * 1.5;
            params[i].speed         = (float)knots;
            params[i].sinHeading    = sin(headingRad) * velocityFactor;
            params[i].cosHeading    = cos(headingRad) * velocityFactor;
            params[i].classification = (uint8_t)(get_random(i, 6.6) > 0.6 ? 1 : 0);
        }

        LOG_INFO("Main", "Prakalkulasi selesai. Memulai perulangan simulasi...");

        while (true) {
            int currentCount       = radar_handler.get_target_count();
            int64_t cmdReceivedAt  = radar_handler.get_command_received_at();

            auto nowSteady = std::chrono::steady_clock::now();
            double timeSec = std::chrono::duration_cast<std::chrono::milliseconds>(
                nowSteady - startTime
            ).count() * 0.001;

            // =========================================================
            // FIX: Ambil timestamp SEKALI sebelum loop radar track.
            // Semua track dalam satu burst pakai timestamp yang sama
            // sehingga pengukuran latency di FE konsisten untuk semua ID.
            // =========================================================
            const long long radarBurstTimestamp = get_burst_timestamp_ms();

            for (int i = 0; i < currentCount; i++) {
                const auto& p = params[i];
                RadarTrackTransmitData t;
                t.trackId           = i;
                t.lat               = p.startLat + (p.sinHeading * timeSec);
                t.lon               = p.startLon + (p.cosHeading * timeSec);
                t.speed             = p.speed;
                t.timestamp         = radarBurstTimestamp; // ← satu nilai untuk seluruh burst
                t.classification    = p.classification;
                t.commandReceivedAt = cmdReceivedAt;

                radar_publisher.set_radar_data(t);
            }

            if (currentCount > 0) {
                LOG_INFO("Main", "Simulation Cycle: Published "
                    + std::to_string(currentCount)
                    + " tracks (ID: 0 - "
                    + std::to_string(currentCount - 1)
                    + ") | T=" + std::to_string(radarBurstTimestamp) + "ms");
            }

            // --- STRESS TEST LOGIC ---
            // FIX: Ambil timestamp sekali untuk semua stress publisher
            const long long stressBurstTimestamp = get_burst_timestamp_ms();

            // 1. Square Stress
            if (config.squareEnabled) {
                for (int i = 0; i < config.stressObjectCount; i++) {
                    StressTrackTransmitData s;
                    s.trackId   = i;
                    s.lat       = -5.0 + (i * 0.0001);
                    s.lon       = 110.0 + (i * 0.0001);
                    s.timestamp = stressBurstTimestamp; // ← satu nilai per burst
                    square_publisher.set_square_data(s);
                }
                LOG_INFO("Main", "Stress Test: Published "
                    + std::to_string(config.stressObjectCount) + " Square objects.");
            }

            // 2. Circle Stress
            if (config.circleEnabled) {
                for (int i = 0; i < config.stressObjectCount; i++) {
                    StressTrackTransmitData c;
                    c.trackId   = i;
                    c.lat       = -6.0 + (i * 0.0001);
                    c.lon       = 111.0 + (i * 0.0001);
                    c.timestamp = stressBurstTimestamp;
                    circle_publisher.set_circle_data(c);
                }
                LOG_INFO("Main", "Stress Test: Published "
                    + std::to_string(config.stressObjectCount) + " Circle objects.");
            }

            // 3. Triangle Stress
            if (config.triangleEnabled) {
                for (int i = 0; i < config.stressObjectCount; i++) {
                    StressTrackTransmitData t;
                    t.trackId   = i;
                    t.lat       = -7.0 + (i * 0.0001);
                    t.lon       = 112.0 + (i * 0.0001);
                    t.timestamp = stressBurstTimestamp;
                    triangle_publisher.set_triangle_data(t);
                }
                LOG_INFO("Main", "Stress Test: Published "
                    + std::to_string(config.stressObjectCount) + " Triangle objects.");
            }

            std::this_thread::sleep_for(std::chrono::milliseconds(1000));
        }

        if (subscriber_thread.joinable()) {
            subscriber_thread.join();
        }
    }
    catch (const std::exception &err) {
        LOG_ERROR("Main", std::string("Kesalahan Fatal (std): ") + err.what());
    }
    catch (...) {
        LOG_ERROR("Main", "Kesalahan Fatal: Terjadi eksepsi tidak dikenal (kemungkinan eksepsi CORBA/DDS)");
    }

    return 0;
}