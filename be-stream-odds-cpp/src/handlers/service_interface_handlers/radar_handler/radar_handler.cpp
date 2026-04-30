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
        LOG_INFO("Radar Handler", "Memperbarui Jumlah Target menjadi: " + std::to_string(current_target_count_));
    }
}

int RadarHandler::get_target_count() const {
    return current_target_count_.load();
}
