#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/circle_track_model/CircleTrackC.h"
#include "../../../../../models/odds_models/circle_track_model/CircleTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class CircleTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit CircleTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_circle_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    CircleTrack::TrackData circle_msg_;
    CircleTrack::TrackDataDataWriter_var circle_writer_;
};
