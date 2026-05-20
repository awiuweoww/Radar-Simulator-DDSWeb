import os
import re

shapes = [
    ("Parallelogram", "parallelogram"),
    ("Trapezoid", "trapezoid"),
    ("Rhombus", "rhombus"),
    ("Ellipse", "ellipse"),
    ("Pentagon", "pentagon"),
    ("Hexagon", "hexagon")
]

base_dir = "/home/chandreu/stream-radar-webdds-v2"
be_dir = f"{base_dir}/be-stream-odds-cpp"
gw_dir = f"{base_dir}/gateway-ddsweb"

# 1. BE IDLs
for cap, low in shapes:
    idl_dir = f"{be_dir}/idl/{cap}Track"
    os.makedirs(idl_dir, exist_ok=True)
    with open(f"{idl_dir}/{cap}Track.idl", "w") as f:
        f.write(f"module {cap}Track {{\n  @topic\n  struct TrackData {{\n    @key long trackId;\n    double lat;\n    double lon;\n    long long timestamp;\n  }};\n}};\n")

# 2. BE Publishers
publishers_dir = f"{be_dir}/src/adapters/service_adapters/odds_adapter/publishers"
for cap, low in shapes:
    pub_dir = f"{publishers_dir}/{low}_track_publisher"
    os.makedirs(pub_dir, exist_ok=True)
    with open(f"{pub_dir}/{low}_track_publisher.h", 'w') as f:
        f.write(f"""#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/{low}_track_model/{cap}TrackC.h"
#include "../../../../../models/odds_models/{low}_track_model/{cap}TrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class {cap}TrackODDSPublisher : public AbstractODDSPublisher
{{
public:
    explicit {cap}TrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_{low}_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    {cap}Track::TrackData {low}_msg_;
    {cap}Track::TrackDataDataWriter_var {low}_writer_;
}};
""")

    with open(f"{pub_dir}/{low}_track_publisher.cpp", 'w') as f:
        f.write(f"""#include "{low}_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<{cap}Track::TrackDataDataWriter_var>
    ({cap}Track::TrackDataDataWriter_var* handle, std::string_view info) const;

{cap}TrackODDSPublisher::{cap}TrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{{
    DDS::DataWriter_var writer;
    {cap}Track::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<{cap}Track::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() {cap}Track::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth = 1;

    this->set_topic(type_name, "{cap}TrackTopic", writer);
    {low}_writer_ = {cap}Track::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&{low}_writer_, "{cap}TrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[{cap}Track] Publisher initialized...");
}}

void {cap}TrackODDSPublisher::set_{low}_data(const StressTrackTransmitData &data) {{
    {low}_msg_.trackId = data.trackId;
    {low}_msg_.lat = data.lat;
    {low}_msg_.lon = data.lon;
    {low}_msg_.timestamp = data.timestamp;

    this->send_message();
}}

void {cap}TrackODDSPublisher::send_message() {{
    DDS::ReturnCode_t result;
    result = {low}_writer_->write({low}_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "{low}_writer_->write() failed");
}}
""")

# 3. Update app.cpp
app_cpp_path = f"{be_dir}/src/app.cpp"
with open(app_cpp_path, 'r') as f:
    app_cpp = f.read()

includes = "\n".join([f'#include "adapters/service_adapters/odds_adapter/publishers/{low}_track_publisher/{low}_track_publisher.h"' for _, low in shapes])
app_cpp = app_cpp.replace('#include "adapters/service_adapters/odds_adapter/publishers/triangle_track_publisher/triangle_track_publisher.h"',
                         f'#include "adapters/service_adapters/odds_adapter/publishers/triangle_track_publisher/triangle_track_publisher.h"\n{includes}')

config_add = "\n".join([f'    bool {low}Enabled   = true;' for _, low in shapes])
app_cpp = app_cpp.replace('bool triangleEnabled = true;', f'bool triangleEnabled = true;\n{config_add}')

pubs = "\n".join([f'        {cap}TrackODDSPublisher {low}_pub(participant);' for cap, low in shapes])
app_cpp = app_cpp.replace('TriangleTrackODDSPublisher triangle_pub(participant);', f'TriangleTrackODDSPublisher triangle_pub(participant);\n{pubs}')

loop_add = ""
for cap, low in shapes:
    loop_add += f"""
                // New Topic {cap}
                if (config.{low}Enabled) {{
                    for (int i = 0; i < config.stressObjectCount; i++) {{
                        StressTrackTransmitData t;
                        t.trackId = i;
                        t.lat = -8.0 + (i * 0.0001);
                        t.lon = 113.0 + (i * 0.0001);
                        t.timestamp = currentTs;
                        {low}_pub.set_{low}_data(t);
                        std::this_thread::sleep_for(std::chrono::microseconds(50));
                    }}
                    LOG_INFO("{cap}", "Published " + std::to_string(config.stressObjectCount) + " objects.");
                }}"""
app_cpp = app_cpp.replace('LOG_INFO("Circle", "Published " + std::to_string(config.stressObjectCount) + " objects.");\n                }',
                         'LOG_INFO("Circle", "Published " + std::to_string(config.stressObjectCount) + " objects.");\n                }' + loop_add)

with open(app_cpp_path, 'w') as f:
    f.write(app_cpp)

# 4. Update CMakeLists.txt
cmake_path = f"{be_dir}/CMakeLists.txt"
with open(cmake_path, 'r') as f:
    cmake_txt = f.read()
cmake_add = "\n".join([f'    ${{CMAKE_CURRENT_SOURCE_DIR}}/src/models/odds_models/{low}_track_model' for _, low in shapes])
cmake_txt = cmake_txt.replace('${CMAKE_CURRENT_SOURCE_DIR}/src/models/odds_models/triangle_track_model',
                             f'${{CMAKE_CURRENT_SOURCE_DIR}}/src/models/odds_models/triangle_track_model\n{cmake_add}')
with open(cmake_path, 'w') as f:
    f.write(cmake_txt)

# 5. Gateway IDLs and MPCs
for cap, low in shapes:
    idl_dir = f"{gw_dir}/idl/{cap}Track"
    os.makedirs(idl_dir, exist_ok=True)
    with open(f"{idl_dir}/{cap}Track.idl", "w") as f:
        f.write(f"module {cap}Track {{\n  @topic\n  struct TrackData {{\n    @key long trackId;\n    double lat;\n    double lon;\n    long long timestamp;\n  }};\n}};\n")
    
    with open(f"{idl_dir}/{cap}Track.mpc", "w") as f:
        f.write(f"""project: dcps {{
  requires += tao_orbsvcs
  includes += $(TAO_ROOT)/orbsvcs
  idlflags += -I$(TAO_ROOT)/orbsvcs
  dynamicflags += {cap.upper()}TRACK_BUILD_DLL

  TypeSupport_Files {{
    {cap}Track.idl
  }}

  Source_Files {{
    {cap}TrackTypeSupportImpl.cpp
    {cap}TrackC.cpp
    {cap}TrackS.cpp
    {cap}TrackTypeSupportC.cpp
    {cap}TrackTypeSupportS.cpp
  }}

  Header_Files {{
    {cap}TrackTypeSupportImpl.h
    {cap}TrackC.h
    {cap}TrackS.h
    {cap}TrackTypeSupportC.h
    {cap}TrackTypeSupportS.h
  }}
}}
""")

# 6. Update gateway_idl.mwc
mwc_path = f"{gw_dir}/gateway_idl.mwc"
with open(mwc_path, 'r') as f:
    mwc = f.read()
mwc_add = "\n".join([f'  {cap}Track/{cap}Track.mpc' for cap, _ in shapes])
mwc = mwc.replace('  TriangleTrack/TriangleTrack.mpc', f'  TriangleTrack/TriangleTrack.mpc\n{mwc_add}')
with open(mwc_path, 'w') as f:
    f.write(mwc)

# 7. Update server.js
server_js_path = f"{gw_dir}/server.js"
with open(server_js_path, 'r') as f:
    sjs = f.read()
sjs_load = "\n".join([f"        opendds.load(path.join(IDL_BIN_DIR, '{cap}Track', 'lib{cap}Track'));" for cap, _ in shapes])
sjs = sjs.replace("opendds.load(path.join(IDL_BIN_DIR, 'TriangleTrack', 'libTriangleTrack'));",
                 f"opendds.load(path.join(IDL_BIN_DIR, 'TriangleTrack', 'libTriangleTrack'));\n{sjs_load}")

sjs_map = ",\n".join([f"            '{cap}TrackTopic': '{cap}Track::TrackData'" for cap, _ in shapes])
sjs = sjs.replace("'TriangleTrackTopic': 'TriangleTrack::TrackData'",
                 f"'TriangleTrackTopic': 'TriangleTrack::TrackData',\n{sjs_map}")

sjs_includes = " || ".join([f"topicName.includes('{cap}')" for cap, _ in shapes])
sjs = sjs.replace("topicName.includes('Triangle')", f"topicName.includes('Triangle') || {sjs_includes}")
with open(server_js_path, 'w') as f:
    f.write(sjs)

# 8. Update radarApi.ts
radar_api_path = f"{base_dir}/fe-webdds/src/utils/api/radarApi.ts"
with open(radar_api_path, 'r') as f:
    rapi = f.read()
rapi_arr = "', '".join([cap for cap, _ in shapes])
rapi = rapi.replace("['Square', 'Circle', 'Triangle']", f"['Square', 'Circle', 'Triangle', '{rapi_arr}']")
with open(radar_api_path, 'w') as f:
    f.write(rapi)

# 9. Update stressLogger.ts
stress_logger_path = f"{base_dir}/fe-webdds/src/utils/logger/stressLogger.ts"
with open(stress_logger_path, 'r') as f:
    slog = f.read()
slog_arr = "', '".join([cap.upper() for cap, _ in shapes])
slog = slog.replace("'RADAR', 'SQUARE', 'CIRCLE', 'TRIANGLE'", f"'RADAR', 'SQUARE', 'CIRCLE', 'TRIANGLE', '{slog_arr}'")
with open(stress_logger_path, 'w') as f:
    f.write(slog)

print("Scaffolding complete!")
