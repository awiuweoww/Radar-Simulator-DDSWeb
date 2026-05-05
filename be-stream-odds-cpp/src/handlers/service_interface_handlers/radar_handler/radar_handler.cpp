#include "radar_handler.h"
#include "../../../utils/log_util/log_util.h"

RadarHandler::RadarHandler(RadarCommandODDSSubscriber* subscriber)
    : subscriber_(subscriber)
{
}

void RadarHandler::update_data() {
    auto& data = subscriber_->get_command_data();
    
    if (data.action == "UPDATE_TARGET_COUNT" || data.action == "START") {
        current_target_count_ = data.value;
        command_received_at_ = data.receivedAt;
        LOG_INFO("Radar Handler", "Memperbarui Jumlah Target menjadi: " + std::to_string(current_target_count_));
    } else if (data.action == "STOP" || data.action == "RESET") {
        current_target_count_ = 0;
        command_received_at_ = 0;
        LOG_INFO("Radar Handler", "Menghentikan simulasi (STOP/RESET diterima)");
    }
}

int RadarHandler::get_target_count() const {
    return current_target_count_.load();
}

int64_t RadarHandler::get_command_received_at() const {
    return command_received_at_.load();
}
