#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/rhombus_track_model/RhombusTrackC.h"
#include "../../../../../models/odds_models/rhombus_track_model/RhombusTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class RhombusTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit RhombusTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_rhombus_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    RhombusTrack::TrackData rhombus_msg_;
    RhombusTrack::TrackDataDataWriter_var rhombus_writer_;
};
