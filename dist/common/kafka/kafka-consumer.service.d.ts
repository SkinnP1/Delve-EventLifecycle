import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EachMessagePayload } from 'kafkajs';
import { ConfigurationService } from '../configurations/configuration.service';
export declare class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private kafka;
    private consumer;
    constructor(configService: ConfigurationService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    subscribeToTopic(topic: string, fromBeginning?: boolean): Promise<void>;
    startConsuming(messageHandler: (payload: EachMessagePayload) => Promise<void>): Promise<void>;
    pauseConsuming(topics: Array<{
        topic: string;
        partitions?: number[];
    }>): Promise<void>;
    resumeConsuming(topics: Array<{
        topic: string;
        partitions?: number[];
    }>): Promise<void>;
    stopConsuming(): Promise<void>;
    commitOffsets(topicPartitions: Array<{
        topic: string;
        partition: number;
        offset: string;
    }>): Promise<void>;
    seekToOffset(topic: string, partition: number, offset: string): Promise<void>;
}
