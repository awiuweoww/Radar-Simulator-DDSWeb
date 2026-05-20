#include <iostream>
#include <chrono>
#include <thread>
#include <cmath>
#include <vector>
#include <iomanip>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <signal.h>
#include <queue>
#include <functional>

#include "utils/config_util/config_util.h"
#include "utils/log_util/log_util.h"
#include "adapters/service_adapters/odds_adapter/domain_participant/domain_participant.h"
#include "adapters/service_adapters/odds_adapter/publishers/radar_track_publisher/radar_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/subscribers/radar_command_subscriber/radar_command_subscriber.h"
#include "handlers/service_interface_handlers/radar_handler/radar_handler.h"
#include "threads/backend_interface_thread/backend_interface_thread.h"
#include "adapters/service_adapters/odds_adapter/publishers/square_track_publisher/square_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/circle_track_publisher/circle_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/triangle_track_publisher/triangle_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/parallelogram_track_publisher/parallelogram_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/trapezoid_track_publisher/trapezoid_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/rhombus_track_publisher/rhombus_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/ellipse_track_publisher/ellipse_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/pentagon_track_publisher/pentagon_track_publisher.h"
#include "adapters/service_adapters/odds_adapter/publishers/hexagon_track_publisher/hexagon_track_publisher.h"

struct SimulationConfig {
    bool squareEnabled   = true;
    bool circleEnabled   = true;
    bool triangleEnabled = true;
    bool parallelogramEnabled   = true;
    bool trapezoidEnabled   = true;
    bool rhombusEnabled   = true;
    bool ellipseEnabled   = true;
    bool pentagonEnabled   = true;
    bool hexagonEnabled   = true;
    int stressObjectCount = 100;
};

struct TrackParams {
    double startLat;
    double startLon;
    float  speed;
    double sinHeading;
    double cosHeading;
    uint8_t classification;
};

/** Global Sync */
std::atomic<bool> g_running{true};

void signal_handler(int signum) {
    LOG_INFO("Main", "Menerima sinyal berhenti. Mematikan proses...");
    g_running = false;
}

class PublishQueue {
public:
    void push(std::vector<std::function<void()>> task_group) {
        std::lock_guard<std::mutex> lock(mtx_);
        tasks_.push(task_group);
        cv_.notify_one();
    }

    std::vector<std::function<void()>> pop() {
        std::unique_lock<std::mutex> lock(mtx_);
        cv_.wait(lock, [this] { return !tasks_.empty() || !running_; });
        if (tasks_.empty() && !running_) return {};
        auto task = tasks_.front();
        tasks_.pop();
        return task;
    }

    void stop() {
        {
            std::lock_guard<std::mutex> lock(mtx_);
            running_ = false;
        }
        cv_.notify_all();
    }

    size_t size() {
        std::lock_guard<std::mutex> lock(mtx_);
        return tasks_.size();
    }

    void clear() {
        std::lock_guard<std::mutex> lock(mtx_);
        std::queue<std::vector<std::function<void()>>> empty;
        std::swap(tasks_, empty);
    }

private:
    std::queue<std::vector<std::function<void()>>> tasks_;
    std::mutex mtx_;
    std::condition_variable cv_;
    bool running_ = true;
};

double get_random(int index, double seed) {
    return fmod(std::abs(sin(index * 12.9898 + seed * 78.233)) * 43758.5453, 1.0);
}

static inline long long get_burst_timestamp_ms() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();
}

int main(int argc, char* argv[]) {
    signal(SIGINT, signal_handler);
    
    try {
        LOG_INFO("Main", " [Backend] Mesin radar Multi-Threaded (REAL RACE) dimulai...");

        ConfigUtil::create_instance();
        DDS::DomainParticipantFactory_var factory = TheParticipantFactoryWithArgs(argc, argv);
        auto participant = ODDSDomainParticipant::get_instance(factory)->get_participant_();

        // Publishers
        RadarTrackODDSPublisher radar_pub(participant);
        SquareTrackODDSPublisher square_pub(participant);
        CircleTrackODDSPublisher circle_pub(participant);
        TriangleTrackODDSPublisher triangle_pub(participant);
        ParallelogramTrackODDSPublisher parallelogram_pub(participant);
        TrapezoidTrackODDSPublisher trapezoid_pub(participant);
        RhombusTrackODDSPublisher rhombus_pub(participant);
        EllipseTrackODDSPublisher ellipse_pub(participant);
        PentagonTrackODDSPublisher pentagon_pub(participant);
        HexagonTrackODDSPublisher hexagon_pub(participant);

        // Subscriber & Handler
        RadarCommandODDSSubscriber radar_sub(participant);
        RadarHandler radar_handler(&radar_sub);
        radar_sub.add_observer(&radar_handler);
        std::thread sub_thread(BackendInterfaceThreadsContainer::radar_receiver_thread, &radar_sub);

        SimulationConfig config;
        auto startTime = std::chrono::steady_clock::now();

        const int MAX_TRACKS = 100000;
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

        // Publish Queue & Thread
        PublishQueue publish_queue;
        std::thread publisher_thread([&publish_queue]() {
            while (g_running) {
                auto task_group = publish_queue.pop();
                if (task_group.empty()) {
                    if (!g_running) break;
                    continue;
                }
                for (const auto& task : task_group) {
                    if (!g_running) break;
                    task();
                    std::this_thread::sleep_for(std::chrono::microseconds(50));
                }
            }
        });

        // --- MASTER LOOP (Single Thread) ---
        while (g_running) {
            std::this_thread::sleep_for(std::chrono::milliseconds(1000));
            if (!g_running) break;

            if (publish_queue.size() > 0) {
                LOG_WARN("Main", "Queue masih memproses burst sebelumnya (sisa: " + std::to_string(publish_queue.size()) + " tugas). Melewati siklus ini...");
                continue;
            }

            long long currentTs = get_burst_timestamp_ms();

            int count = radar_handler.get_target_count();
            if (count > 0) {
                int64_t cmdAt = radar_handler.get_command_received_at();
                auto nowS = std::chrono::steady_clock::now();
                double tSec = std::chrono::duration_cast<std::chrono::milliseconds>(nowS - startTime).count() * 0.001;

                std::vector<std::function<void()>> burst_tasks;
                int maxObjects = std::max(count, config.stressObjectCount);
                burst_tasks.reserve(maxObjects * 10);

                for (int i = 0; i < maxObjects; i++) {
                    // 1. Radar
                    if (i < count) {
                        RadarTrackTransmitData t;
                        t.trackId = i;
                        t.lat = params[i].startLat + (params[i].sinHeading * tSec);
                        t.lon = params[i].startLon + (params[i].cosHeading * tSec);
                        t.speed = params[i].speed;
                        t.timestamp = currentTs;
                        t.classification = params[i].classification;
                        t.commandReceivedAt = cmdAt;
                        burst_tasks.push_back([&radar_pub, t]() {
                            radar_pub.set_radar_data(t);
                        });
                    }

                    // 2. Square
                    if (config.squareEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData s;
                        s.trackId = i;
                        s.lat = -5.0 + (i * 0.0001);
                        s.lon = 110.0 + (i * 0.0001);
                        s.timestamp = currentTs;
                        burst_tasks.push_back([&square_pub, s]() {
                            square_pub.set_square_data(s);
                        });
                    }

                    // 3. Triangle
                    if (config.triangleEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData tr;
                        tr.trackId = i;
                        tr.lat = -7.0 + (i * 0.0001);
                        tr.lon = 112.0 + (i * 0.0001);
                        tr.timestamp = currentTs;
                        burst_tasks.push_back([&triangle_pub, tr]() {
                            triangle_pub.set_triangle_data(tr);
                        });
                    }

                    // 4. Circle
                    if (config.circleEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData c;
                        c.trackId = i;
                        c.lat = -6.0 + (i * 0.0001);
                        c.lon = 111.0 + (i * 0.0001);
                        c.timestamp = currentTs;
                        burst_tasks.push_back([&circle_pub, c]() {
                            circle_pub.set_circle_data(c);
                        });
                    }

                    // 5. Parallelogram
                    if (config.parallelogramEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData p;
                        p.trackId = i;
                        p.lat = -8.0 + (i * 0.0001);
                        p.lon = 113.0 + (i * 0.0001);
                        p.timestamp = currentTs;
                        burst_tasks.push_back([&parallelogram_pub, p]() {
                            parallelogram_pub.set_parallelogram_data(p);
                        });
                    }

                    // 6. Trapezoid
                    if (config.trapezoidEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData trz;
                        trz.trackId = i;
                        trz.lat = -3.0 + (i * 0.0001);
                        trz.lon = 112.0 + (i * 0.0001);
                        trz.timestamp = currentTs;
                        burst_tasks.push_back([&trapezoid_pub, trz]() {
                            trapezoid_pub.set_trapezoid_data(trz);
                        });
                    }

                    // 7. Rhombus
                    if (config.rhombusEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData r;
                        r.trackId = i;
                        r.lat = -4.0 + (i * 0.0001);
                        r.lon = 108.0 + (i * 0.0001);
                        r.timestamp = currentTs;
                        burst_tasks.push_back([&rhombus_pub, r]() {
                            rhombus_pub.set_rhombus_data(r);
                        });
                    }

                    // 8. Ellipse
                    if (config.ellipseEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData el;
                        el.trackId = i;
                        el.lat = -7.0 + (i * 0.0001);
                        el.lon = 108.0 + (i * 0.0001);
                        el.timestamp = currentTs;
                        burst_tasks.push_back([&ellipse_pub, el]() {
                            ellipse_pub.set_ellipse_data(el);
                        });
                    }

                    // 9. Pentagon
                    if (config.pentagonEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData pen;
                        pen.trackId = i;
                        pen.lat = -9.0 + (i * 0.0001);
                        pen.lon = 110.0 + (i * 0.0001);
                        pen.timestamp = currentTs;
                        burst_tasks.push_back([&pentagon_pub, pen]() {
                            pentagon_pub.set_pentagon_data(pen);
                        });
                    }

                    // 10. Hexagon
                    if (config.hexagonEnabled && i < config.stressObjectCount) {
                        StressTrackTransmitData hex;
                        hex.trackId = i;
                        hex.lat = -5.0 + (i * 0.0001);
                        hex.lon = 114.0 + (i * 0.0001);
                        hex.timestamp = currentTs;
                        burst_tasks.push_back([&hexagon_pub, hex]() {
                            hexagon_pub.set_hexagon_data(hex);
                        });
                    }
                }
                size_t num_tasks = burst_tasks.size();
                publish_queue.push(std::move(burst_tasks));
                LOG_INFO("Main", "Enqueued " + std::to_string(num_tasks) + " tasks for round-robin streaming (queue size: " + std::to_string(publish_queue.size()) + ")");
            }
        }

        publish_queue.stop();
        if (publisher_thread.joinable()) publisher_thread.join();
        if (sub_thread.joinable()) sub_thread.join();
    }
    catch (const std::exception &err) {
        LOG_ERROR("Main", std::string("Fatal Error: ") + err.what());
    }
    return 0;
}