import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigurationService } from '../configurations/configuration.service';
export declare class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private kafka;
    private producer;
    constructor(configService: ConfigurationService);
    onModuleInit(): Promise<void>;
    kafkaConnect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    produceKafkaEvent(topic: string, event: any, key?: string): Promise<void>;
    sendMessage(topic: string, message: any, key?: string): Promise<void>;
    sendBatchMessages(topic: string, messages: Array<{
        key?: string;
        value: any;
    }>): Promise<void>;
    sendMessageWithPartition(topic: string, message: any, partition: number, key?: string): Promise<void>;
}
