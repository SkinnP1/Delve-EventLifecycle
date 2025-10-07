import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ConfigurationService } from '../configurations/configuration.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaConsumerService.name);
    private kafka: Kafka;
    private consumer: Consumer;

    constructor(private readonly configService: ConfigurationService) { }

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

    async pauseConsuming(topics: Array<{ topic: string; partitions?: number[] }>): Promise<void> {
        try {
            this.consumer.pause(topics);
            this.logger.log('Paused message consumption');
        } catch (error) {
            this.logger.error('Failed to pause message consumption:', error);
            throw error;
        }
    }

    async resumeConsuming(topics: Array<{ topic: string; partitions?: number[] }>): Promise<void> {
        try {
            this.consumer.resume(topics);
            this.logger.log('Resumed message consumption');
        } catch (error) {
            this.logger.error('Failed to resume message consumption:', error);
            throw error;
        }
    }

    async stopConsuming(): Promise<void> {
        try {
            await this.consumer.stop();
            this.logger.log('Stopped message consumption');
        } catch (error) {
            this.logger.error('Failed to stop message consumption:', error);
            throw error;
        }
    }

    async commitOffsets(topicPartitions: Array<{ topic: string; partition: number; offset: string }>): Promise<void> {
        try {
            await this.consumer.commitOffsets(topicPartitions);
            this.logger.debug('Committed consumer offsets');
        } catch (error) {
            this.logger.error('Failed to commit offsets:', error);
            throw error;
        }
    }

    async seekToOffset(topic: string, partition: number, offset: string): Promise<void> {
        try {
            await this.consumer.seek({
                topic,
                partition,
                offset,
            });
            this.logger.log(`Seeked to offset ${offset} for topic ${topic}, partition ${partition}`);
        } catch (error) {
            this.logger.error(`Failed to seek to offset ${offset} for topic ${topic}, partition ${partition}:`, error);
            throw error;
        }
    }
}
