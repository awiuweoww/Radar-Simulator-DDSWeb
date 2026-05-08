#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/triangle_track_model/TriangleTrackC.h"
#include "../../../../../models/odds_models/triangle_track_model/TriangleTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class TriangleTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit TriangleTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_triangle_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    TriangleTrack::TrackData triangle_msg_;
    TriangleTrack::TrackDataDataWriter_var triangle_writer_;
};
