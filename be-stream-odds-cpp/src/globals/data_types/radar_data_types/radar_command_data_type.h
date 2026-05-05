#pragma once
#include <string>
#include <cstdint>

/**
 * @struct RadarCommandReceiveData
 * @brief Data model internal untuk command radar yang diterima via DDS.
 */
struct RadarCommandReceiveData {
    std::string action;
    int32_t value;
    int64_t receivedAt;  // Waktu nyata saat BE menerima command
};
