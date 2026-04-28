/*
 * Copyright PT LEN INNOVATION TECHNOLOGY
 *
 * THIS SOFTWARE SOURCE CODE AND ANY EXECUTABLE DERIVED THEREOF ARE PROPRIETARY
 * TO PT LEN INNOVATION TECHNOLOGY, AS APPLICABLE, AND SHALL NOT BE USED IN ANY WAY
 * OTHER THAN BEFOREHAND AGREED ON BY PT LEN INNOVATION TECHNOLOGY, NOR BE REPRODUCED
 * OR DISCLOSED TO THIRD PARTIES WITHOUT PRIOR WRITTEN AUTHORIZATION BY
 * PT LEN INNOVATION TECHNOLOGY, AS APPLICABLE.
 */

/*
 =================================================================================================================
 Name        : config_util.h
 Author      : Angga Gemilang
 Version     : 0.1.0 12/03/2025
 Description : Utility for Environment Variables
 =================================================================================================================
*/

#pragma once
#include <memory>
#include <cstdint>
#include <mutex>
#include <unordered_map>
#include <functional>
#include <variant>
#include "../../globals/constants.h"
#include "../../globals/data_types/environment_variables_data_type.h"

class ConfigUtil {
public:
    using ValueType = std::variant<
        std::reference_wrapper<uint8_t>,
        std::reference_wrapper<std::string>
    >;
    
    /**
     * Method to initialize config instance
     * @param instance_type instance type as uint8_t
     */
    static void create_instance(uint8_t instance_type = kConfigLoaderTypeGlobal);
    /**
     * Method to set environment variable individually
     * @param key key as const char*
     * @param value value as const char*
     */
    static void set_config_individual(const char* key, const char* value);
    /**
     * Method to get environment variable
     * @param instance_type instance type as uint8_t
     * @return environment variables as EnvironmentVariables
     */
    static EnvironmentVariables get_config(uint8_t instance_type = kConfigLoaderTypeGlobal);
private:
    struct TransparentHasher {
        using is_transparent = void; // Enables heterogeneous lookup
        std::size_t operator()(std::string_view key) const noexcept {
            return std::hash<std::string_view>{}(key);
        }
    };
    
    static inline std::mutex config_util_mutex_;
    static inline std::shared_ptr<ConfigUtil> config_util_instance_ = nullptr;
    static inline EnvironmentVariables environment_variables_;
    static inline std::unordered_map<std::string_view, ValueType, TransparentHasher, std::equal_to<>> environment_variables_map_ = {
        {"LOG_LEVEL", environment_variables_.log_level},
        {"IOR_PATH", environment_variables_.ior_path},
        {"RTPS_PATH", environment_variables_.rtps_path},
        {"TEST_TOPIC", environment_variables_.test_topic}
    };

    /**
     * Method to set global environment variables
     */
    static void set_config_global();    
    /**
     * @param ref_value reference value as ValueType
     * @param key key as const char* 
     */
    static void set_config_value(ValueType &ref_value, const char* key);
};
