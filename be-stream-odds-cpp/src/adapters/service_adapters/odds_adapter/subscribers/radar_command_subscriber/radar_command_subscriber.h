#pragma once
#include "../abstract_odds_subscriber/abstract_odds_subscriber.h"
#include "../../../../interface_adapters/interface_receivers/interface_radar_receiver.h"
#include "../../../../abstract_adapters/observable/observable.h"
#include "../../../../../models/odds_models/radar_command_model/RadarCommandC.h"
#include "../../../../../models/odds_models/radar_command_model/RadarCommandTypeSupportImpl.h"
#include "../../../../../globals/data_types/radar_data_types/radar_command_data_type.h"

/**
 * @class RadarCommandODDSSubscriber
 * @brief Implementasi Subscriber OpenDDS untuk menerima data Radar Command.
 */
class RadarCommandODDSSubscriber : public AbstractODDSSubscriber, public Observable, public InterfaceRadarReceiver
{
public:
    explicit RadarCommandODDSSubscriber(const DDS::DomainParticipant_var &participant);

    void start() override;
    void stop() override;

    void add_observer(Observer* observer) override;
    void remove_observer(Observer* observer) override;

    /**
     * @return Data command radar terakhir yang diterima.
     */
    RadarCommandReceiveData& get_command_data();

private:
    RadarCommand::CommandDataWriter_var radar_reader_; // Wait, should be DataReader
    RadarCommand::CommandDataReader_var radar_command_reader_;
    
    RadarCommand::CommandSeq msg_list_;
    DDS::SampleInfoSeq info_seq_;
    DDS::ReturnCode_t result_;

    RadarCommandReceiveData command_receive_data_;
};
