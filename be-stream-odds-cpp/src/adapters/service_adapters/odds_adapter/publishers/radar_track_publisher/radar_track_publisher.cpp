#include "radar_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"


template void ODDSOperator::check_handle<RadarTrack::TrackDataDataWriter_var>
    (RadarTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

RadarTrackODDSPublisher::RadarTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    RadarTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<RadarTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() RadarTrack::TrackData failed");

    /** setting QoS reliability, lifespan, and liveliness */
    this->get_w_qos_()->reliability.kind = DDS::BEST_EFFORT_RELIABILITY_QOS;
    this->get_w_qos_()->lifespan.duration.sec = 3; // Data basi setelah 3 detik
    this->get_w_qos_()->lifespan.duration.nanosec = 0;
    
    this->get_w_qos_()->liveliness.kind = DDS::AUTOMATIC_LIVELINESS_QOS;
    this->get_w_qos_()->liveliness.lease_duration.sec = 2; // Timeout 2 detik
    this->get_w_qos_()->liveliness.lease_duration.nanosec = 0;

    this->set_topic(type_name, "RadarTrackTopic", writer);
    radar_writer_ = RadarTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&radar_writer_, "TrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[RadarTrack] Per-sample Streaming mode ENABLED...");
}

void RadarTrackODDSPublisher::set_radar_data(const RadarTrackTransmitData &data) {
    // Populate single object directly
    radar_msg_.trackId = data.trackId;
    radar_msg_.lat = data.lat;
    radar_msg_.lon = data.lon;
    radar_msg_.speed = data.speed;
    radar_msg_.timestamp = data.timestamp;
    radar_msg_.classification = data.classification;

    this->send_message();
}

void RadarTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = radar_writer_->write(radar_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "radar_writer_->write() failed");
}
