#pragma once
#include "../abstract_odds_publisher/abstract_odds_publisher.h"
#include "../../../../interface_adapters/interface_transmitters/interface_radar_transmitter.h"
#include "../../../../../models/odds_models/radar_track_model/RadarTrackC.h"
#include "../../../../../models/odds_models/radar_track_model/RadarTrackTypeSupportImpl.h"
#include "../../../../../globals/data_types/radar_data_types/radar_track_data_type.h"

/**
 * @class RadarTrackODDSPublisher
 * @brief Implementasi Publisher OpenDDS untuk mengirim data Radar Track.
 */
class RadarTrackODDSPublisher : public AbstractODDSPublisher, public InterfaceRadarTransmitter
{
public:
    explicit RadarTrackODDSPublisher(const DDS::DomainParticipant_var &participant);

    /**
     * Memasukkan data radar ke dalam buffer publisher.
     * @param data Data track radar internal.
     */
    void set_radar_data(const RadarTrackTransmitData &data);

    /**
     * Mengirim data yang sudah di-set ke domain DDS.
     */
    void send_message() override;

private:
    RadarTrack::TrackData radar_msg_;
    RadarTrack::TrackDataDataWriter_var radar_writer_;
};
