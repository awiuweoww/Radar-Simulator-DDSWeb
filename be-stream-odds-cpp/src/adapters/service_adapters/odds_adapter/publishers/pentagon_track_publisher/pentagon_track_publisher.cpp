#include "pentagon_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<PentagonTrack::TrackDataDataWriter_var>
    (PentagonTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

PentagonTrackODDSPublisher::PentagonTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    PentagonTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<PentagonTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() PentagonTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth =1;

    this->set_topic(type_name, "PentagonTrackTopic", writer);
    pentagon_writer_ = PentagonTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&pentagon_writer_, "PentagonTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[PentagonTrack] Publisher initialized...");
}

void PentagonTrackODDSPublisher::set_pentagon_data(const StressTrackTransmitData &data) {
    pentagon_msg_.trackId = data.trackId;
    pentagon_msg_.lat = data.lat;
    pentagon_msg_.lon = data.lon;
    pentagon_msg_.timestamp = data.timestamp;

    this->send_message();
}

void PentagonTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = pentagon_writer_->write(pentagon_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "pentagon_writer_->write() failed");
}
