#include "radar_command_subscriber.h"
#include "../../odds_operator/odds_operator.inl"
#include "../../../../../utils/log_util/log_util.h"

template void ODDSOperator::check_handle<RadarCommand::CommandDataReader_var>
    (RadarCommand::CommandDataReader_var* handle, std::string_view info) const;

RadarCommandODDSSubscriber::RadarCommandODDSSubscriber(const DDS::DomainParticipant_var &participant)
    : AbstractODDSSubscriber(participant)
{
    DDS::DataReader_var reader;
    RadarCommand::CommandTypeSupport_var type_support;
    DDS::ReturnCode_t result;
    CORBA::String_var type_name;

    type_support = std::make_unique<RadarCommand::CommandTypeSupportImpl>().release();
    type_name = type_support->get_type_name();
    LOG_INFO("ODDS Subscriber", "[RadarCommand] Mendaftarkan Nama Tipe: " + std::string(type_name));
    result = type_support->register_type(*this->get_participant_(), type_name);
    this->get_odds_operator_()->check_status(result, "register_type() RadarCommand failed");

    /** setting QoS reliability and durability */
    this->get_r_qos_()->reliability.kind = DDS::RELIABLE_RELIABILITY_QOS;
    this->get_r_qos_()->durability.kind = DDS::TRANSIENT_LOCAL_DURABILITY_QOS;
    this->set_topic(type_name, "CommandTopic", reader);

    radar_command_reader_ = RadarCommand::CommandDataReader::_narrow(reader);
    this->get_odds_operator_()->check_handle(&radar_command_reader_, "CommandDataReader::_narrow() failed");

    LOG_INFO("ODDS Subscriber", "[RadarCommand] Siap menerima perintah...");
}

void RadarCommandODDSSubscriber::start() {
    LOG_INFO("ODDS Subscriber", "[RadarCommand] Perulangan dimulai...");

    while (!this->get_is_stop_()) {
        this->result_ = this->radar_command_reader_->take(
            this->msg_list_, 
            this->info_seq_, 
            DDS::LENGTH_UNLIMITED,
            DDS::ANY_SAMPLE_STATE, 
            DDS::ANY_VIEW_STATE, 
            DDS::ANY_INSTANCE_STATE
        );

        if (this->result_ == DDS::RETCODE_OK) {
            if (this->msg_list_.length() > 0) {
                LOG_INFO("ODDS Subscriber", "[RadarCommand] Menerima " + std::to_string(this->msg_list_.length()) + " sampel");
            }
            for (CORBA::ULong i = 0; i < this->msg_list_.length(); i++) {
                if (this->info_seq_[i].valid_data) {
                    this->sync_threads();

                    this->command_receive_data_.action = this->msg_list_[i].action.in();
                    this->command_receive_data_.value = this->msg_list_[i].value;

                    LOG_INFO("ODDS Subscriber", "[RadarCommand] Menerima: " + 
                        this->command_receive_data_.action + " dengan nilai: " + 
                        std::to_string(this->command_receive_data_.value));

                    this->notify_observers();
                }
            }
            this->radar_command_reader_->return_loan(this->msg_list_, this->info_seq_);
        }
        
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
}

void RadarCommandODDSSubscriber::stop() {
    AbstractODDSSubscriber::stop();
}

void RadarCommandODDSSubscriber::add_observer(Observer* observer) {
    Observable::add_observer(observer);
}

void RadarCommandODDSSubscriber::remove_observer(Observer* observer) {
    Observable::remove_observer(observer);
}

RadarCommandReceiveData& RadarCommandODDSSubscriber::get_command_data() {
    return this->command_receive_data_;
}
