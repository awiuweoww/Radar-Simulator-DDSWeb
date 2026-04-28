#include "abstract_odds_publisher.h"
#include "../../odds_operator/odds_operator.inl"

template void ODDSOperator::check_handle<DDS::Topic_var>(DDS::Topic_var* handle, std::string_view info) const;
template void ODDSOperator::check_handle<DDS::Publisher_var>(DDS::Publisher_var* handle, std::string_view info) const;
template void ODDSOperator::check_handle<DDS::DataWriter_var>(DDS::DataWriter_var* handle, std::string_view info) const;

AbstractODDSPublisher::AbstractODDSPublisher(const DDS::DomainParticipant_var &participant) : participant_(participant)
{
    DDS::ReturnCode_t result;

    /* Create topic entity
     * Create and initialize topic QOS value on heap
     */
    result = participant_->get_default_topic_qos(t_qos_);
    odds_operator_.check_status(result, "get_default_topic_qos() failed");
    result = participant_->get_default_publisher_qos(p_qos_);
    odds_operator_.check_status(result, "get_default_publisher_qos() failed");

    /* Fine tune the partition QOS policy into the partition in which the data will be published
     * Create the publisher
     */
    publisher_ = participant_->create_publisher(p_qos_, nullptr, OpenDDS::DCPS::DEFAULT_STATUS_MASK);
    odds_operator_.check_handle(&publisher_, "create_publisher() failed");

    result = publisher_->get_default_datawriter_qos(w_qos_);
    odds_operator_.check_status(result, "get_default_datawriter_qos() failed");

    result = publisher_->copy_from_topic_qos(w_qos_, t_qos_);
    odds_operator_.check_status(result, "copy_from_topic_qos() failed");
}

DDS::DomainParticipant_var* AbstractODDSPublisher::get_participant_() {
    return &this->participant_;
}

DDS::TopicQos* AbstractODDSPublisher::get_t_qos_() {
    return &this->t_qos_;
}

DDS::PublisherQos* AbstractODDSPublisher::get_p_qos_() {
    return &this->p_qos_;
}

DDS::DataWriterQos* AbstractODDSPublisher::get_w_qos_() {
    return &this->w_qos_;
}

ODDSOperator* AbstractODDSPublisher::get_odds_operator_() {
    return &this->odds_operator_;
}

void AbstractODDSPublisher::set_topic
(
    CORBA::String_var &type_name,
    const char* odds_topic,
    DDS::DataWriter_var &writer
)
{
    DDS::Topic_var topic;

    topic = this->participant_->create_topic(odds_topic, type_name, this->t_qos_, nullptr, 
        OpenDDS::DCPS::DEFAULT_STATUS_MASK);
    this->odds_operator_.check_handle(&topic, "create_topic() failed");

    /* Set the autodispose_unregistered_instances QOS policy to false
     * If autodispose_unregistered_instances is set to true (default value)
     * You will have to start the subscriber before the publisher
     */
    this->w_qos_.writer_data_lifecycle.autodispose_unregistered_instances = false;

    writer = this->publisher_->create_datawriter(topic, this->w_qos_, nullptr, OpenDDS::DCPS::DEFAULT_STATUS_MASK);
    this->odds_operator_.check_handle(&writer, "create_datawriter() failed");
}
