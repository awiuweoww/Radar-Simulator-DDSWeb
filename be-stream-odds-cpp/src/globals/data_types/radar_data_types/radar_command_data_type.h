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
};
