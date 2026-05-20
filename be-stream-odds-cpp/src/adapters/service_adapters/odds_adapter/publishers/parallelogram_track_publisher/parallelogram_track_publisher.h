#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/parallelogram_track_model/ParallelogramTrackC.h"
#include "../../../../../models/odds_models/parallelogram_track_model/ParallelogramTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class ParallelogramTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit ParallelogramTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_parallelogram_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    ParallelogramTrack::TrackData parallelogram_msg_;
    ParallelogramTrack::TrackDataDataWriter_var parallelogram_writer_;
};
