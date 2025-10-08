import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EachMessagePayload } from 'kafkajs';
import { ConfigurationService } from '../configurations/configuration.service';
import { KafkaProducerService } from './kafka-producer.service';
import { NotificationService } from 'src/services/internal/notification.service';
import { UserService } from 'src/services/internal/user.service';
import { TestService } from 'src/services/internal/test.service';
export declare class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly kafkaProducer;
    private readonly notificationService;
    private readonly userService;
    private readonly testService;
    private readonly logger;
    private kafka;
    private consumer;
    constructor(configService: ConfigurationService, kafkaProducer: KafkaProducerService, notificationService: NotificationService, userService: UserService, testService: TestService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    subscribeToTopic(topic: string, fromBeginning?: boolean): Promise<void>;
    subscribeToMultipleTopics(topics: string[], fromBeginning?: boolean): Promise<void>;
    subscribeToAllConfiguredTopics(fromBeginning?: boolean): Promise<void>;
    startConsuming(messageHandler: (payload: EachMessagePayload) => Promise<void>): Promise<void>;
    addTopicSubscription(topic: string, fromBeginning?: boolean): Promise<void>;
    processMessage(payload: EachMessagePayload): Promise<void>;
    getAdminClient(): import("kafkajs").Admin;
    getActiveConsumerCount(): Promise<number>;
}
