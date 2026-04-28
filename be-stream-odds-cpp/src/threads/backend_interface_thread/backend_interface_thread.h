#pragma once
#include "../../adapters/interface_adapters/interface_receivers/interface_radar_receiver.h"

class BackendInterfaceThreadsContainer 
{
public:
    
    /**
     * Method to run Radar receiver
     * @param radar_receiver Radar Receiver as InterfaceRadarReceiver
     */
    static void radar_receiver_thread(InterfaceRadarReceiver* radar_receiver);
};
