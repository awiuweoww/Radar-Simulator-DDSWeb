#include "trapezoid_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<TrapezoidTrack::TrackDataDataWriter_var>
    (TrapezoidTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

TrapezoidTrackODDSPublisher::TrapezoidTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    TrapezoidTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<TrapezoidTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() TrapezoidTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth =1;

    this->set_topic(type_name, "TrapezoidTrackTopic", writer);
    trapezoid_writer_ = TrapezoidTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&trapezoid_writer_, "TrapezoidTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[TrapezoidTrack] Publisher initialized...");
}

void TrapezoidTrackODDSPublisher::set_trapezoid_data(const StressTrackTransmitData &data) {
    trapezoid_msg_.trackId = data.trackId;
    trapezoid_msg_.lat = data.lat;
    trapezoid_msg_.lon = data.lon;
    trapezoid_msg_.timestamp = data.timestamp;

    this->send_message();
}

void TrapezoidTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = trapezoid_writer_->write(trapezoid_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "trapezoid_writer_->write() failed");
}
