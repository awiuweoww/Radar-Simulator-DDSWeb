#pragma once
#include <dds/DCPS/Marked_Default_Qos.h>
#include <dds/DCPS/Service_Participant.h>
#include <dds/DCPS/StaticIncludes.h>
#include <dds/DCPS/WaitSet.h>
#include <dds/DdsDcpsInfrastructureC.h>
#include <dds/DdsDcpsPublicationC.h>
#include "../../odds_operator/odds_operator.h"
#include "../../../../interface_adapters/interface_receivers/interface_receiver.h"

class AbstractODDSSubscriber : public InterfaceReceiver
{
public:
    explicit AbstractODDSSubscriber(const DDS::DomainParticipant_var &participant);

    /**
     * Method to get Domain Participant
     * @return Domain Participant as pointer DDS::DomainParticipant_var
     */
    DDS::DomainParticipant_var* get_participant_();
    /**
     * Method to get t_qos_
     * @return t_qos_ as DDS TopicQos
     */
    DDS::TopicQos* get_t_qos_();
    /**
     * Method to get s_qos_
     * @return s_qos_ as DDS SubscriberQos
     */
    DDS::SubscriberQos* get_s_qos_();
    /**
     * Method to get r_qos_
     * @return r_qos_ as DDS DataReaderQos
     */
    DDS::DataReaderQos* get_r_qos_();
    /**
     * Method to get ODDS Operator
     * @return ODDS Operator as pointer ODDSOperator
     */
    ODDSOperator* get_odds_operator_();
    /**
     * Method to get stop subscriber status
     * @return stop subscriber status as boolean
     */
    bool& get_is_stop_();    

    void stop() override;
protected:
    /**
     * Method to set topic on ODDS
     * @param type_name type name as CORBA::String_var
     * @param odds_topic topic to be set as pointer char
     * @param reader reader to be set as DDS::DataReader_var
     */
    void set_topic
    (
        CORBA::String_var &type_name,
        const char* odds_topic,
        DDS::DataReader_var &reader
    ) const;
private:
    DDS::DomainParticipant_var participant_;
    DDS::Subscriber_var subscriber_;
    DDS::TopicQos t_qos_;
    DDS::SubscriberQos s_qos_;
    DDS::DataReaderQos r_qos_;
    
    bool is_stop_ = false;
    ODDSOperator odds_operator_;
};
