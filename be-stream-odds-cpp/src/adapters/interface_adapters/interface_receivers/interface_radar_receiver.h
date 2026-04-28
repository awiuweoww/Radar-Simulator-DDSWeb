#pragma once
#include "interface_receiver.h"
#include "../../abstract_adapters/observable/interface_observable.h"
#include "../../../globals/data_types/radar_data_types/radar_command_data_type.h"

class InterfaceRadarReceiver : public InterfaceReceiver, public InterfaceObservable
{
public:
    ~InterfaceRadarReceiver() override = default;

    /**
     * Interface method to get Command message
     * @return Command message as RadarCommandReceiveData
     */
    virtual RadarCommandReceiveData& get_command_data() = 0;
};
