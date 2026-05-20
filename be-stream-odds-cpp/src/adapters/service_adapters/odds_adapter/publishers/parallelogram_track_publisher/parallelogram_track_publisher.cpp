#include "parallelogram_track_publisher.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<ParallelogramTrack::TrackDataDataWriter_var>
    (ParallelogramTrack::TrackDataDataWriter_var* handle, std::string_view info) const;

ParallelogramTrackODDSPublisher::ParallelogramTrackODDSPublisher(const DDS::DomainParticipant_var &participant)
    : AbstractODDSPublisher(participant)
{
    DDS::DataWriter_var writer;
    ParallelogramTrack::TrackDataTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<ParallelogramTrack::TrackDataTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() ParallelogramTrack::TrackData failed");

    this->get_w_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_w_qos_()->history.kind = DDS::KEEP_LAST_HISTORY_QOS;
    this->get_w_qos_()->history.depth =1;

    this->set_topic(type_name, "ParallelogramTrackTopic", writer);
    parallelogram_writer_ = ParallelogramTrack::TrackDataDataWriter::_narrow(writer);
    this->get_odds_operator_()->check_handle(&parallelogram_writer_, "ParallelogramTrackDataDataWriter::_narrow() failed");

    LOG_INFO("ODDS Publisher", "[ParallelogramTrack] Publisher initialized...");
}

void ParallelogramTrackODDSPublisher::set_parallelogram_data(const StressTrackTransmitData &data) {
    parallelogram_msg_.trackId = data.trackId;
    parallelogram_msg_.lat = data.lat;
    parallelogram_msg_.lon = data.lon;
    parallelogram_msg_.timestamp = data.timestamp;

    this->send_message();
}

void ParallelogramTrackODDSPublisher::send_message() {
    DDS::ReturnCode_t result;
    result = parallelogram_writer_->write(parallelogram_msg_, DDS::HANDLE_NIL);
    this->get_odds_operator_()->check_status(result, "parallelogram_writer_->write() failed");
}
