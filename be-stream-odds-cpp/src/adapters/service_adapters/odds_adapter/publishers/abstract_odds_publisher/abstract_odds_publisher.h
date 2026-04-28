#pragma once
#include <dds/DCPS/Marked_Default_Qos.h>
#include <dds/DCPS/Service_Participant.h>
#include <dds/DCPS/StaticIncludes.h>
#include <dds/DCPS/WaitSet.h>
#include <dds/DdsDcpsInfrastructureC.h>
#include <dds/DdsDcpsPublicationC.h>
#include "../../odds_operator/odds_operator.h"
#include "../../../../interface_adapters/interface_transmitters/interface_transmitter.h"

class AbstractODDSPublisher : public InterfaceTransmitter
{
public:
    explicit AbstractODDSPublisher(const DDS::DomainParticipant_var &participant);

    /**
     * Method to get Domain Participant
     * @return Domain Participant as pointer DDS::DomainParticipant_var
     */
    DDS::DomainParticipant_var* get_participant_();
    /**
     * Method to get t qos
     * @return t qos as pointer DDS::TopicQos
     */
    DDS::TopicQos* get_t_qos_();
    /**
     * Method to get p qos
     * @return p qos as pointer DDS::PublisherQos
     */
    DDS::PublisherQos* get_p_qos_();
    /**
     * Method to get w qos
     * @return w qos as pointer DDS::DataWriterQos
     */
    DDS::DataWriterQos* get_w_qos_();
    /**
     * Method to get ODDS Operator
     * @return ODDS Operator as pointer ODDSOperator
     */
    ODDSOperator* get_odds_operator_();
protected:
    /**
     * Method set topic on ODDS
     * @param type_name type name as CORBA::String_var
     * @param odds_topic topic to be set as pointer char
     * @param writer writer to be set as DDS::DataWriter_var
     */
    void set_topic
    (
        CORBA::String_var &type_name,
        const char* odds_topic,
        DDS::DataWriter_var &writer
    );
private:
    DDS::DomainParticipant_var participant_;
    DDS::Publisher_var publisher_;
    DDS::TopicQos t_qos_;
    DDS::PublisherQos p_qos_;
    DDS::DataWriterQos w_qos_;

    ODDSOperator odds_operator_;
};
