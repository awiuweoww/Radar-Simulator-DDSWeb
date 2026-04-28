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
 Name        : config_util.cpp
 Author      : Angga Gemilang
 Version     : 0.1.0 12/03/2025
 Description : Utility for Environment Variables
 =================================================================================================================
*/

#include "config_util.h"
#include "../log_util/log_util.h"
#include "../../globals/constants.h"

void ConfigUtil::create_instance(uint8_t instance_type) {
    // Prevent race condition and make sure only one thread that access this initialization
    std::scoped_lock lock(config_util_mutex_);

    if (!config_util_instance_) {
        config_util_instance_ = std::make_shared<ConfigUtil>();

        if (instance_type == kConfigLoaderTypeGlobal)
            set_config_global();
    }
}

void ConfigUtil::set_config_global() {
    for (auto &[key, ref_value] : environment_variables_map_) {
        set_config_value(ref_value, key.data());
    }
}

void ConfigUtil::set_config_individual(const char* key, const char* value) {
    if (setenv(key, value, 1) == 0) {
        auto it = environment_variables_map_.find(key);
        if (it != environment_variables_map_.end()) {
            set_config_value(it->second, key);
        }
    } else {
        LOG_ERROR("Environment Variables Util", "Failed to set environment variable");
    }
}

void ConfigUtil::set_config_value(ValueType &ref_value, const char* key) {
    std::visit(
        [key](auto &current_ref_value) {
            using T = std::decay_t<decltype(current_ref_value.get())>;
            const char* env_val = std::getenv(key);
            if constexpr (std::is_same_v<T, uint8_t>) {
                current_ref_value.get() = env_val ? static_cast<uint8_t>(std::atoi(env_val)) : 0;
            } else if constexpr (std::is_same_v<T, std::string>) {
                current_ref_value.get() = env_val ? env_val : "";
            } else {
                LOG_ERROR("Environment Variables Util", "Unknown type");
            }
        },
        ref_value
    );
}

EnvironmentVariables ConfigUtil::get_config(uint8_t instance_type) {
    create_instance(instance_type);
    return ConfigUtil::environment_variables_;
}
