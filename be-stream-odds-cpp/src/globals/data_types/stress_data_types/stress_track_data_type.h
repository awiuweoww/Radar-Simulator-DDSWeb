#pragma once
#include <cstdint>

/**
 * @struct StressTrackTransmitData
 * @brief Data model internal untuk stress test track yang akan dikirim via DDS.
 */
struct StressTrackTransmitData {
    int32_t trackId;
    double lat;
    double lon;
    int64_t timestamp;
};
