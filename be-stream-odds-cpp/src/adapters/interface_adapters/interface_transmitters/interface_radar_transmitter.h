#pragma once
#include "interface_transmitter.h"
#include "../../../globals/data_types/radar_data_types/radar_track_data_type.h"

class InterfaceRadarTransmitter : public InterfaceTransmitter
{
public:
    ~InterfaceRadarTransmitter() override = default;

    /**
     * Interface method to set Radar Track data
     * @param data Radar Track data as RadarTrackTransmitData
     */
    virtual void set_radar_data(const RadarTrackTransmitData &data) = 0;
};
