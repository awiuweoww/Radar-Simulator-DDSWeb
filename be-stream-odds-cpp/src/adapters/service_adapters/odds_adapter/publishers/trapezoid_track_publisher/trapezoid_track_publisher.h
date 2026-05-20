#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/trapezoid_track_model/TrapezoidTrackC.h"
#include "../../../../../models/odds_models/trapezoid_track_model/TrapezoidTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class TrapezoidTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit TrapezoidTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_trapezoid_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    TrapezoidTrack::TrackData trapezoid_msg_;
    TrapezoidTrack::TrackDataDataWriter_var trapezoid_writer_;
};
