#pragma once
#include <cstdint>
#include <string_view>

/**
 * @file constants.h
 * @description Global constants for the Radar Tracking System.
 */

// Config Loader Types
constexpr uint8_t kConfigLoaderTypeGlobal = 0;
constexpr uint8_t kConfigLoaderTypeIndividual = 1;

constexpr std::string_view kServiceName = "be-stream-odds";

// Default Paths 
constexpr std::string_view kDefaultIorPath = "simple.ior";
constexpr std::string_view kDefaultRtpsPath = "rtps.ini";
