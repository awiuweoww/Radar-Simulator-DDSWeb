/*
 * Copyright PT LEN INNOVATION TECHNOLOGY
 *
 * THIS SOFTWARE SOURCE CODE AND ANY EXECUTABLE DERIVED THEREOF ARE PROPRIETARY
 * TO PT LEN INNOVATION TECHNOLOGY, AS APPLICABLE, AND SHALL NOT BE USED IN ANY WAY
 * OTHER THAN BEFOREHAND AGREED ON BY PT LEN INNOVATION TECHNOLOGY, NOR BE REPRODUCED
 * OR DISCLOSED TO THIRD PARTIES WITHOUT PRIOR WRITTEN AUTHORIZATION BY
 * PT LEN INNOVATION TECHNOLOGY, AS APPLICABLE.
 */

/*
 =================================================================================================================
 Name        : observable.h
 Author      : Angga Gemilang
 Version     : 0.1.0 13/03/2025
 Description : Observable
 =================================================================================================================
*/

#pragma once
#include <list>
#include <thread>
#include "interface_observable.h"
#include "../../../handlers/observer/observer.h"

class Observable : public InterfaceObservable
{
public:
    /**
     * Method to notify all observers
     */
    void notify_observers();
    /**
     * Method to synchronize all observer threads
     */
    void sync_threads();
    
    void add_observer(Observer* observer) override;
    void remove_observer(Observer* observer) override;
private:
    std::list<Observer*> observers_;
    std::list<std::thread> threads_;
};
