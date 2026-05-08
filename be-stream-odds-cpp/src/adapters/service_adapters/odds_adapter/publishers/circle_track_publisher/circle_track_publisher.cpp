#include "circle_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<CircleTrack::TrackDataDataWriter_var>
    (CircleTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

CircleTrackODDSPublisher::CircleTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    CircleTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<CircleTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() CircleTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_ALL_HISTORY_QOS;
    this->get_w_qos_()->history.depth = 1;

    this->set_topic(type_name, "CircleTrackTopic", writer);
    circle_writer_ = CircleTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&circle_writer_, "CircleTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[CircleTrack] Publisher initialized...");
}

void CircleTrackODDSPublisher::set_circle_data(const StressTrackTransmitData &data) {
    circle_msg_.trackId = data.trackId;
    circle_msg_.lat = data.lat;
    circle_msg_.lon = data.lon;
    circle_msg_.timestamp = data.timestamp;

    this->send_message();
}

void CircleTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = circle_writer_->write(circle_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "circle_writer_->write() failed");
}
