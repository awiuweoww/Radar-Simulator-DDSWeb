cmake_minimum_required(VERSION 3.31.0)
project(be-stream-odds-cpp VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_CURRENT_SOURCE_DIR}/CMakeModules/")

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 17)

include(CTest)
enable_testing()

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/idl
    ${CMAKE_CURRENT_SOURCE_DIR}/src/models/odds_models/radar_track_model
    ${CMAKE_CURRENT_SOURCE_DIR}/src/models/odds_models/radar_command_model
    $ENV{DDS_ROOT}
    $ENV{ACE_ROOT}
    $ENV{TAO_ROOT}
)
link_directories(
    $ENV{DDS_ROOT}/lib
    $ENV{ACE_ROOT}/lib
)

file(GLOB_RECURSE SOURCES 
    src/*.cpp 
    src/*.cc 
    src/*.h 
    src/*.hpp
)
list(REMOVE_ITEM SOURCES ${CMAKE_CURRENT_SOURCE_DIR}/src/app.cpp)
add_library(shared-objects OBJECT ${SOURCES})

add_executable(${PROJECT_NAME} ${CMAKE_CURRENT_SOURCE_DIR}/src/app.cpp $<TARGET_OBJECTS:shared-objects>)

find_package(spdlog CONFIG REQUIRED)
add_definitions(-DSPDLOG_FMT_EXTERNAL)
target_link_libraries(${PROJECT_NAME} PRIVATE spdlog::spdlog)
include_directories(${spdlog_INCLUDE_DIR})
include_directories(${fmt_INCLUDE_DIR})

target_link_libraries(${PROJECT_NAME} PRIVATE OpenDDS_Dcps TAO_Valuetype TAO ACE)

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)
