import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EachMessagePayload } from 'kafkajs';
import { ConfigurationService } from '../configurations/configuration.service';
import { KafkaProducerService } from './kafka-producer.service';
import { NotificationService } from 'src/services/internal/notification.service';
export declare class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly kafkaProducer;
    private readonly notificationService;
    private readonly logger;
    private kafka;
    private consumer;
    constructor(configService: ConfigurationService, kafkaProducer: KafkaProducerService, notificationService: NotificationService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    subscribeToTopic(topic: string, fromBeginning?: boolean): Promise<void>;
    startConsuming(messageHandler: (payload: EachMessagePayload) => Promise<void>): Promise<void>;
    processMessage(payload: EachMessagePayload): Promise<void>;
}
