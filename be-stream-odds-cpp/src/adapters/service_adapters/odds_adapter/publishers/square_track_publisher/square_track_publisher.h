#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/square_track_model/SquareTrackC.h"
#include "../../../../../models/odds_models/square_track_model/SquareTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class SquareTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit SquareTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_square_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    SquareTrack::TrackData square_msg_;
    SquareTrack::TrackDataDataWriter_var square_writer_;
};
