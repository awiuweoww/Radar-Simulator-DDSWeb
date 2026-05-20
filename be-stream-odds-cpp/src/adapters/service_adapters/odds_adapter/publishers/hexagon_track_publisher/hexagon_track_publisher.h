#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/hexagon_track_model/HexagonTrackC.h"
#include "../../../../../models/odds_models/hexagon_track_model/HexagonTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class HexagonTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit HexagonTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_hexagon_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    HexagonTrack::TrackData hexagon_msg_;
    HexagonTrack::TrackDataDataWriter_var hexagon_writer_;
};
