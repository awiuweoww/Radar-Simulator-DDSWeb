#include "ellipse_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<EllipseTrack::TrackDataDataWriter_var>
    (EllipseTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

EllipseTrackODDSPublisher::EllipseTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    EllipseTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<EllipseTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() EllipseTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth =1;

    this->set_topic(type_name, "EllipseTrackTopic", writer);
    ellipse_writer_ = EllipseTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&ellipse_writer_, "EllipseTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[EllipseTrack] Publisher initialized...");
}

void EllipseTrackODDSPublisher::set_ellipse_data(const StressTrackTransmitData &data) {
    ellipse_msg_.trackId = data.trackId;
    ellipse_msg_.lat = data.lat;
    ellipse_msg_.lon = data.lon;
    ellipse_msg_.timestamp = data.timestamp;

    this->send_message();
}

void EllipseTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = ellipse_writer_->write(ellipse_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "ellipse_writer_->write() failed");
}
