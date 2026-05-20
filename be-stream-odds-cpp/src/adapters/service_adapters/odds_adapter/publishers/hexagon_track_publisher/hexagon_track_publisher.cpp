#include "hexagon_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<HexagonTrack::TrackDataDataWriter_var>
    (HexagonTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

HexagonTrackODDSPublisher::HexagonTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    HexagonTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<HexagonTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() HexagonTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth =1;

    this->set_topic(type_name, "HexagonTrackTopic", writer);
    hexagon_writer_ = HexagonTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&hexagon_writer_, "HexagonTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[HexagonTrack] Publisher initialized...");
}

void HexagonTrackODDSPublisher::set_hexagon_data(const StressTrackTransmitData &data) {
    hexagon_msg_.trackId = data.trackId;
    hexagon_msg_.lat = data.lat;
    hexagon_msg_.lon = data.lon;
    hexagon_msg_.timestamp = data.timestamp;

    this->send_message();
}

void HexagonTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = hexagon_writer_->write(hexagon_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "hexagon_writer_->write() failed");
}
