import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ConfigurationService } from '../configurations/configuration.service';
import { KafkaMessageDto } from 'src/api/dto/kafka-message.dto';
import { KafkaProducerService } from './kafka-producer.service';
import { EVENT_SERVICE_MAPPING, ServiceNameEnum } from '../constants/event-service-mapping.constants';
import { NotificationService } from 'src/services/internal/notification.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaConsumerService.name);
    private kafka: Kafka;
    private consumer: Consumer;

    constructor(
        private readonly configService: ConfigurationService,
        private readonly kafkaProducer: KafkaProducerService,
        private readonly notificationService: NotificationService
    ) { }

    async onModuleInit() {
        const kafkaConfig = this.configService.getKafkaConfig();
        const consumerConfig = this.configService.getKafkaConsumerConfig();

        this.kafka = new Kafka({
            clientId: kafkaConfig.clientId,
            brokers: kafkaConfig.brokers,
            ssl: false,
            connectionTimeout: 5000,
            requestTimeout: 60000,
            retry: {
                initialRetryTime: 1000,
                retries: 5
            }
        });

        this.consumer = this.kafka.consumer({
            groupId: consumerConfig.groupId,
            sessionTimeout: consumerConfig.sessionTimeout,
            heartbeatInterval: consumerConfig.heartbeatInterval,
            allowAutoTopicCreation: false,
        });

        await this.consumer.connect();
        this.logger.log('Kafka consumer connected successfully');
    }

    async onModuleDestroy() {
        if (this.consumer) {
            await this.consumer.disconnect();
            this.logger.log('Kafka consumer disconnected');
        }
    }

    async subscribeToTopic(topic: string, fromBeginning: boolean = false): Promise<void> {
        try {
            await this.consumer.subscribe({
                topic,
                fromBeginning,
            });
            this.logger.log(`Subscribed to topic: ${topic}`);
        } catch (error) {
            this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
            throw error;
        }
    }

    async startConsuming(
        messageHandler: (payload: EachMessagePayload) => Promise<void>
    ): Promise<void> {
        try {
            await this.consumer.run({
                eachMessage: async (payload) => {
                    try {
                        this.logger.debug(`Received message from topic ${payload.topic}:`, {
                            partition: payload.partition,
                            offset: payload.message.offset,
                            key: payload.message.key?.toString(),
                        });
                        await messageHandler(payload);
                    } catch (error) {
                        this.logger.error(`Error processing message from topic ${payload.topic}:`, error);
                        throw error;
                    }
                },
            });
            this.logger.log('Started consuming messages');
        } catch (error) {
            this.logger.error('Failed to start consuming messages:', error);
            throw error;
        }
    }

    async processMessage(payload: EachMessagePayload): Promise<void> {
        try {
            const message = JSON.parse(payload.message.value.toString());
            if (message.headers?.retryAt) {
                const currentTime = new Date();
                const retryAt = new Date(message.headers.retryAt);
                if (currentTime > retryAt) {
                    // Push the event back to topic
                    await this.kafkaProducer.produceKafkaEvent(message.headers.topic, payload, message.headers.priority + message.headers.referenceId);
                    return;
                }
            }
            const eventType = message.headers.eventType;
            const serviceName: ServiceNameEnum = EVENT_SERVICE_MAPPING[eventType];
            switch (serviceName) {
                case ServiceNameEnum.USER_SERVICE:
                    // Handle user created event
                    this.logger.log(`Processing USER_CREATED event: ${JSON.stringify(message)}`);
                    break;
                case ServiceNameEnum.TEST_SERVICE:
                    // Handle test run event
                    this.logger.log(`Processing TEST_RUN event: ${JSON.stringify(message)}`);
                    break;
                case ServiceNameEnum.NOTIFICATION_SERVICE:
                    // Handle notification events
                    this.logger.log(`Processing notification event: ${JSON.stringify(message)}`);
                    await this.notificationService.processNotificationMessage(message);
                    break;
                default:
                    this.logger.warn(`No handler for service: ${serviceName}`);
                    break;
            }
        } catch (error) {
            this.logger.error(`Error processing message from topic ${payload.topic}:`, error);
            throw error;
        }
    }
}
