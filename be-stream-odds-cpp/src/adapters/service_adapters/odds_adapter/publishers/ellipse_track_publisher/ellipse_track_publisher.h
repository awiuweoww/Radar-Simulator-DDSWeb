#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../../models/odds_models/ellipse_track_model/EllipseTrackC.h"
#include "../../../../../models/odds_models/ellipse_track_model/EllipseTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/stress_data_types/stress_track_data_type.h"

class EllipseTrackODDSPublisher : public AbstractODDSPublisher
{
public:
    explicit EllipseTrackODDSPublisher(const DDS::DomainParticipant_var &participant);
    void set_ellipse_data(const StressTrackTransmitData &data);
    void send_message() override;

private:
    EllipseTrack::TrackData ellipse_msg_;
    EllipseTrack::TrackDataDataWriter_var ellipse_writer_;
};
