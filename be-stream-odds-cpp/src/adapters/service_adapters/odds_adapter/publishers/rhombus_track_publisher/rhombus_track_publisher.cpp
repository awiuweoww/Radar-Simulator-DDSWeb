#include "rhombus_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<RhombusTrack::TrackDataDataWriter_var>
    (RhombusTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

RhombusTrackODDSPublisher::RhombusTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    RhombusTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<RhombusTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() RhombusTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth =1;

    this->set_topic(type_name, "RhombusTrackTopic", writer);
    rhombus_writer_ = RhombusTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&rhombus_writer_, "RhombusTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[RhombusTrack] Publisher initialized...");
}

void RhombusTrackODDSPublisher::set_rhombus_data(const StressTrackTransmitData &data) {
    rhombus_msg_.trackId = data.trackId;
    rhombus_msg_.lat = data.lat;
    rhombus_msg_.lon = data.lon;
    rhombus_msg_.timestamp = data.timestamp;

    this->send_message();
}

void RhombusTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = rhombus_writer_->write(rhombus_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "rhombus_writer_->write() failed");
}
