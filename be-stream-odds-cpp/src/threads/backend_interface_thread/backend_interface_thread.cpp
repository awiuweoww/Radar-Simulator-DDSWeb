#include "backend_interface_thread.h"
#include <thread>


void BackendInterfaceThreadsContainer::radar_receiver_thread(InterfaceRadarReceiver* radar_receiver) {
    radar_receiver->start();
}
