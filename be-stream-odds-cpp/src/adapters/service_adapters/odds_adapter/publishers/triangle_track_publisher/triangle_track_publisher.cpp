#include "triangle_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<TriangleTrack::TrackDataDataWriter_var>
    (TriangleTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

TriangleTrackODDSPublisher::TriangleTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    TriangleTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<TriangleTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() TriangleTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::BEST_EFFORT_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth = 1;

    this->set_topic(type_name, "TriangleTrackTopic", writer);
    triangle_writer_ = TriangleTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&triangle_writer_, "TriangleTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[TriangleTrack] Publisher initialized...");
}

void TriangleTrackODDSPublisher::set_triangle_data(const StressTrackTransmitData &data) {
    triangle_msg_.trackId = data.trackId;
    triangle_msg_.lat = data.lat;
    triangle_msg_.lon = data.lon;
    triangle_msg_.timestamp = data.timestamp;

    this->send_message();
}

void TriangleTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = triangle_writer_->write(triangle_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "triangle_writer_->write() failed");
}
