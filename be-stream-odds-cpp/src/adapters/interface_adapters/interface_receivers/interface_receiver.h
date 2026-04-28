#pragma once

class InterfaceReceiver
{
public:
    virtual ~InterfaceReceiver() = default;

    /**
     * Interface method to start receiver
     */
    virtual void start() = 0;
    /**
     * Interface method to stop receiver
     */
    virtual void stop() = 0;
};
