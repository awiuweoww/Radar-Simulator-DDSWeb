#pragma once
#include "../../../handlers/observer/observer.h"
#include "../../../adapters/service_adapters/odds_adapter/subscribers/radar_command_subscriber/radar_command_subscriber.h"
#include <atomic>

/**
 * @class RadarHandler
 * @brief Handler untuk mengelola status simulasi radar berdasarkan command yang diterima.
 */
class RadarHandler : public Observer
{
public:
    explicit RadarHandler(RadarCommandODDSSubscriber* subscriber);

    /**
     * Callback saat data command baru diterima via DDS.
     */
    void update_data() override;

    /**
     * @return Jumlah target simulasi saat ini.
     */
    int get_target_count() const;

    /**
     * @return Timestamp saat BE menerima command terakhir (ms epoch).
     */
    int64_t get_command_received_at() const;

private:
    RadarCommandODDSSubscriber* subscriber_;
    std::atomic<int> current_target_count_{0};
    std::atomic<int64_t> command_received_at_{0};
};
