#pragma once
#include <cstdint>
#include <string>

/**
 * @struct RadarTrackTransmitData
 * @brief Data model internal untuk track radar yang akan dikirim via DDS.
 */
struct RadarTrackTransmitData {
    int32_t trackId;
    double lat;
    double lon;
    float speed;
    int64_t timestamp;
    uint8_t classification;
    int64_t commandReceivedAt;
};
