#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/pentagon_track_model/PentagonTrackC.h"
#include "../../../../../models/odds_models/pentagon_track_model/PentagonTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class PentagonTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit PentagonTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_pentagon_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    PentagonTrack::TrackData pentagon_msg_;
    PentagonTrack::TrackDataDataWriter_var pentagon_writer_;
};
