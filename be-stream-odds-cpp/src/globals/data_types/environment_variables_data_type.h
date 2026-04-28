#pragma once
#include <string>

/**
 * @file environment_variables_data_type.h
 * @description Structure for environment variable configuration.
 */

struct EnvironmentVariables {
    std::string log_level = "INFO";
    std::string ior_path = "simple.ior";
    std::string rtps_path = "rtps.ini";
    std::string test_topic = "TestTopic";
};
