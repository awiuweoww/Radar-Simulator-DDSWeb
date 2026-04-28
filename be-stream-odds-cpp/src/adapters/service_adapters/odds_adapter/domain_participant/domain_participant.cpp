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
 Name        : domain_participant.cpp
 Author      : Angga Gemilang
 Version     : 0.1.0 13/03/2025
 Description : Domain Participant of OpenDDS
 =================================================================================================================
*/

#include "domain_participant.h"
#include <string>
#include "../odds_operator/odds_operator.inl"
#include "../../../../utils/config_util/config_util.h"

template void ODDSOperator::check_handle<DDS::DomainParticipantFactory_var>
    (DDS::DomainParticipantFactory_var* handle, std::string_view info) const;
template void ODDSOperator::check_handle<DDS::DomainParticipant_var>
    (DDS::DomainParticipant_var* handle, std::string_view info) const;

ODDSDomainParticipant::ODDSDomainParticipant(DDS::DomainParticipantFactory_var factory) 
{
    if (!domain_participant_instance_) {
        // The DDS entities required to publish data
        DDS::DomainId_t domain;

        // Jika factory tidak dipasok dari luar, buat sendiri dengan default
        if (CORBA::is_nil(factory)) {
            int32_t argc = 3;
            char* arg1 = strdup(("./" + static_cast<std::string>(kServiceName)).c_str());
            char* arg2 = strdup("-DCPSConfigFile");
            char* arg3 = strdup(ConfigUtil::get_config().rtps_path.c_str());
            std::array<ACE_TCHAR*, 4> args = { arg1, arg2, arg3, NULL };
            factory = TheParticipantFactoryWithArgs(argc, args.data());
        }

        odds_operator_.check_handle(&factory, "DomainParticipantFactory is null");

        // Create a Domain Participant entity for the default domain (domain id = 0)
        domain = 0;
        participant_ =
            factory->create_participant(domain, PARTICIPANT_QOS_DEFAULT, nullptr, OpenDDS::DCPS::DEFAULT_STATUS_MASK);
        odds_operator_.check_handle(&participant_, "create_participant() failed");
    }
}

std::shared_ptr<ODDSDomainParticipant> ODDSDomainParticipant::get_instance(DDS::DomainParticipantFactory_var factory) {
    if (!domain_participant_instance_)
        domain_participant_instance_ = std::make_shared<ODDSDomainParticipant>(factory);

    return domain_participant_instance_;
}

DDS::DomainParticipant_var& ODDSDomainParticipant::get_participant_() {
    return this->participant_;
}
