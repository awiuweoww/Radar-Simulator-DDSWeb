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

/**
 * Generator angka acak sederhana berbasis seed.
 */
double get_random(int index, double seed) {
    return fmod(std::abs(sin(index * 12.9898 + seed * 78.233)) * 43758.5453, 1.0);
}

int main(int argc, char* argv[]) {
    try {
        LOG_INFO("Main", " [Backend] Mesin radar OpenDDS v1.1 - MODE STREAMING dimulai...");

        ConfigUtil::create_instance();

        /** Inisialisasi Domain Participant */ 
        DDS::DomainParticipantFactory_var factory = TheParticipantFactoryWithArgs(argc, argv);
        auto participant = ODDSDomainParticipant::get_instance(factory)->get_participant_();

        /** Inisialisasi Publisher */
        RadarTrackODDSPublisher radar_publisher(participant);

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
         * Semua nilai ini deterministik (berbasis index + seed konstan),
         */
        struct TrackParams {
            double startLat;
            double startLon;
            float speed;
            double sinHeading; 
            double cosHeading; 
            uint8_t classification;
        };

        const int MAX_TRACKS = 10000;
        std::vector<TrackParams> params(MAX_TRACKS);
        for (int i = 0; i < MAX_TRACKS; i++) {
            double headingRad = get_random(i, 3.3) * 6.28318;
            double knots = 100.0 + (get_random(i, 5.5) * 400.0);
            double velocityFactor = knots * 0.0000035;

            params[i].startLat = -5.5 + (get_random(i, 1.1) - 0.5) * 1.5;
            params[i].startLon = 110.5 + (get_random(i, 2.2) - 0.5) * 1.5;
            params[i].speed = (float)knots;
            params[i].sinHeading = sin(headingRad) * velocityFactor;
            params[i].cosHeading = cos(headingRad) * velocityFactor;
            params[i].classification = (uint8_t)(get_random(i, 6.6) > 0.6 ? 1 : 0);
        }

        LOG_INFO("Main", "Prakalkulasi selesai. Memulai perulangan simulasi...");

        while (true) {
            int currentCount = radar_handler.get_target_count();
            int64_t cmdReceivedAt = radar_handler.get_command_received_at();
            auto nowSteady = std::chrono::steady_clock::now();
            double timeSec = std::chrono::duration_cast<std::chrono::milliseconds>(nowSteady - startTime).count() * 0.001;

            for (int i = 0; i < currentCount; i++) {
                long long timestampMs = std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count();

                const auto& p = params[i];
                RadarTrackTransmitData t;
                t.trackId = i;
                t.lat = p.startLat + (p.sinHeading * timeSec);
                t.lon = p.startLon + (p.cosHeading * timeSec);
                t.speed = p.speed;
                t.timestamp = timestampMs;
                t.classification = p.classification;
                t.commandReceivedAt = cmdReceivedAt;

                radar_publisher.set_radar_data(t);
            }
            
            if (currentCount > 0) {
                LOG_INFO("Main", "Simulation Cycle: Published " + std::to_string(currentCount) + " tracks (ID: 0 - " + std::to_string(currentCount - 1) + ")");
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
