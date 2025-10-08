import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigurationService } from '../configurations/configuration.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { KafkaMessageDto } from 'src/api/dto/kafka-message.dto';
import { DatabaseService } from '../database/database.service';
export declare class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly databaseService;
    private readonly logger;
    private kafka;
    private producer;
    constructor(configService: ConfigurationService, databaseService: DatabaseService);
    onModuleInit(): Promise<void>;
    kafkaConnect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private sendRecord;
    produceKafkaEvent(topic: string, event: any, key?: string): Promise<void>;
    sendMessage(topic: string, message: any, key?: string): Promise<void>;
    sendBatchMessages(topic: string, messages: Array<{
        key?: string;
        value: any;
    }>): Promise<void>;
    sendMessageWithPartition(topic: string, message: any, partition: number, key?: string): Promise<void>;
    retryKafkaMessage(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<void>;
}
