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
    private kafkaTopic;
    private dlqKafkaTopic;
    private isShuttingDown;
    private activeOperations;
    private shutdownPromise;
    constructor(configService: ConfigurationService, databaseService: DatabaseService);
    onModuleInit(): Promise<void>;
    kafkaConnect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    gracefulShutdown(): Promise<void>;
    private performGracefulShutdown;
    private sendRecord;
    produceKafkaEvent(topic: string, event: any, key?: string): Promise<void>;
    sendMessage(topic: string, message: any, key?: string): Promise<void>;
    sendBatchMessages(topic: string, messages: Array<{
        key?: string;
        value: any;
    }>): Promise<void>;
    sendMessageWithPartition(topic: string, message: any, partition: number, key?: string): Promise<void>;
    retryKafkaMessage(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto, errorMessage?: string): Promise<void>;
    getActiveOperationsCount(): number;
    isShuttingDownStatus(): boolean;
}
