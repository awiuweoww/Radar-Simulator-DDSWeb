#pragma once
#include <cstddef>
#include <string>

class InterfaceTransmitter
{
public:
    virtual ~InterfaceTransmitter() = default;

    /**
     * Interface method to send message
     */
    virtual void send_message() = 0;
};
