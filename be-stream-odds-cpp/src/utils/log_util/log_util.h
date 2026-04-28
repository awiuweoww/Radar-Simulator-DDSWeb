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
 Name        : log_util.h
 Author      : Angga Gemilang
 Version     : 0.1.0 13/03/2025
 Description : Utility for logging
 =================================================================================================================
*/

#pragma once
#include <spdlog/spdlog.h>
#include <string>
#include <memory>
#include <mutex>

/**
* Macro to call method logger::debug to produce specific file and line each its called
* @param exp_detail exp detail as std::string
* @param log_msg log message as std::string
*/
#define LOG_DEBUG(exp_detail, log_msg) Logger::debug(exp_detail, log_msg, __FILE__, __LINE__)
/**
* Macro to call method logger::info to produce specific file and line each its called
* @param exp_detail exp detail as std::string
* @param log_msg log message as std::string
*/
#define LOG_INFO(exp_detail, log_msg) Logger::info(exp_detail, log_msg, __FILE__, __LINE__)
/**
* Macro to call method logger::warn to produce specific file and line each its called
* @param exp_detail exp detail as std::string
* @param log_msg log message as std::string
*/
#define LOG_WARN(exp_detail, log_msg) Logger::warn(exp_detail, log_msg, __FILE__, __LINE__)
/**
* Macro to call method logger::error to produce specific file and line each its called
* @param exp_detail exp detail as std::string
* @param log_msg log message as std::string
*/
#define LOG_ERROR(exp_detail, log_msg) Logger::error(exp_detail, log_msg, __FILE__, __LINE__)

class Logger {
public:
    /**
     * Method to get logger instance
     * @return logger instance
     */
    static std::shared_ptr<spdlog::logger>& get_instance();
    /**
     * Method to run debug logger
     * @param exp_detail exp detail as std::string
     * @param log_msg log message as std::string
     * @param file file as const char *
     * @param line line as int
     */
    static void debug(const std::string& exp_detail, const std::string& log_msg, const char* file, int32_t line);
    /**
     * Method to run debug info
     * @param exp_detail exp detail as std::string
     * @param log_msg log message as std::string
     * @param file file as const char *
     * @param line line as int
     */
    static void info(const std::string& exp_detail, const std::string& log_msg, const char* file, int32_t line);
    /**
     * Method to run debug warning
     * @param exp_detail exp detail as std::string
     * @param log_msg log message as std::string
     * @param file file as const char *
     * @param line line as int
     */
    static void warn(const std::string& exp_detail, const std::string& log_msg, const char* file, int32_t line);
    /**
     * Method to run debug error
     * @param exp_detail exp detail as std::string
     * @param log_msg log message as std::string
     * @param file file as const char *
     * @param line line as int
     */
    static void error(const std::string& exp_detail, const std::string& log_msg, const char* file, int32_t line);
private:
    static inline std::shared_ptr<spdlog::logger> logger_instance_ = nullptr;
    static inline std::mutex logger_mutex_;  

    /**
     * Method to initialize logger instance
     */
    static void init();
    /**
     * Method to get spdlog log level
     * @return spdlog log level
     */
    static spdlog::level::level_enum get_log_level();
};
