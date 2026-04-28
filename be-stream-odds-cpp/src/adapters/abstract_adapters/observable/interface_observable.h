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
 Name        : interface_observable.h
 Author      : Angga Gemilang
 Version     : 0.1.0 07/03/2025
 Description : Interface for observable
 =================================================================================================================
*/

#pragma once
#include "../../../handlers/observer/observer.h"

class InterfaceObservable
{
public:
    virtual ~InterfaceObservable() = default;

    /**
     * Interface method to add observer
     * @param observer observer to be added as pointer Observer
     */
    virtual void add_observer(Observer* observer) = 0;
    /**
     * Interface method to remove observer
     * @param observer observer to be removed as pointer Observer
     */
    virtual void remove_observer(Observer* observer) = 0;
};
