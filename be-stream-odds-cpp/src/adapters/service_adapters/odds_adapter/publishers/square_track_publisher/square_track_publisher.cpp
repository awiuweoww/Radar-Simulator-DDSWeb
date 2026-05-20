#include "square_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<SquareTrack::TrackDataDataWriter_var>
    (SquareTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

SquareTrackODDSPublisher::SquareTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    SquareTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<SquareTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() SquareTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth =1;

    this->set_topic(type_name, "SquareTrackTopic", writer);
    square_writer_ = SquareTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&square_writer_, "SquareTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[SquareTrack] Publisher initialized...");
}

void SquareTrackODDSPublisher::set_square_data(const StressTrackTransmitData &data) {
    square_msg_.trackId = data.trackId;
    square_msg_.lat = data.lat;
    square_msg_.lon = data.lon;
    square_msg_.timestamp = data.timestamp;

    this->send_message();
}

void SquareTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = square_writer_->write(square_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "square_writer_->write() failed");
}
