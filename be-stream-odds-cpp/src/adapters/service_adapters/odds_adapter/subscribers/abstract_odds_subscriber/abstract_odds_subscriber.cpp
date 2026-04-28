#include "abstract_odds_subscriber.h"
#include "../../odds_operator/odds_operator.inl"

template void ODDSOperator::check_handle<DDS::Topic_var>(DDS::Topic_var* handle, std::string_view info) const;
template void ODDSOperator::check_handle<DDS::Publisher_var>(DDS::Publisher_var* handle, std::string_view info) const;
template void ODDSOperator::check_handle<DDS::DataWriter_var>(DDS::DataWriter_var* handle, std::string_view info) const;

AbstractODDSSubscriber::AbstractODDSSubscriber(const DDS::DomainParticipant_var &participant) : participant_(participant) 
{
    
    DDS::ReturnCode_t result;

    DDS::SampleInfoSeq info_seq;

    /* Create topic QOS
     * Create and initialize topic QOS value on heap
     */
    result = participant_->get_default_topic_qos(t_qos_);
    odds_operator_.check_status(result, "get_default_topic_qos() failed");

    /* Create subscriber entity
     * Create on heap and initialize subscriber QOS value with the default value
     */
    result = participant_->get_default_subscriber_qos(s_qos_);
    odds_operator_.check_status(result, "get_default_subscriber_qos() failed");

    /* Fine tune the partition qos policy ito the partition from which the data will be received. */
    /* Create the subscriber. */
    subscriber_ = participant_->create_subscriber(this->s_qos_, nullptr, OpenDDS::DCPS::DEFAULT_STATUS_MASK);
    this->odds_operator_.check_handle(&subscriber_, "create_subscriber() failed");

    result = subscriber_->get_default_datareader_qos(r_qos_);
    this->odds_operator_.check_status(result, "get_default_datareader_qos() failed");

    result = subscriber_->copy_from_topic_qos(r_qos_, t_qos_);
    this->odds_operator_.check_status(result, "copy_from_topic_qos() failed");
}

DDS::DomainParticipant_var* AbstractODDSSubscriber::get_participant_() {
    return &this->participant_;
}

DDS::TopicQos* AbstractODDSSubscriber::get_t_qos_() {
    return &this->t_qos_;
}

DDS::SubscriberQos* AbstractODDSSubscriber::get_s_qos_() {
    return &this->s_qos_;
}

DDS::DataReaderQos* AbstractODDSSubscriber::get_r_qos_() {
    return &this->r_qos_;
}

ODDSOperator* AbstractODDSSubscriber::get_odds_operator_() {
    return &this->odds_operator_;
}

bool& AbstractODDSSubscriber::get_is_stop_() {
    return this->is_stop_;
}

void AbstractODDSSubscriber::stop() {
    this->is_stop_ = true;
}

void AbstractODDSSubscriber::set_topic
(
    CORBA::String_var &type_name,
    const char* odds_topic,
    DDS::DataReader_var &reader
) const
{
    /* The DDS entities required to subcribe data */
    DDS::Topic_var topic;

    /* Use the changed policy when defining the topic */
    topic = participant_->create_topic(odds_topic, type_name, this->t_qos_, nullptr, OpenDDS::DCPS::DEFAULT_STATUS_MASK);
    this->odds_operator_.check_handle(&topic, "create_topic() failed");

    reader = subscriber_->create_datareader(topic, r_qos_, nullptr, OpenDDS::DCPS::DEFAULT_STATUS_MASK);
    this->odds_operator_.check_handle(&reader, "create_datareader() failed");
}
