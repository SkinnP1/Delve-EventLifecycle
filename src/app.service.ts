import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from './common/kafka/kafka-consumer.service';
import { KafkaProducerService } from './common/kafka/kafka-producer.service';
import { ConfigurationService } from './common/configurations/configuration.service';

@Injectable()
export class AppService implements OnModuleInit {
    private readonly logger = new Logger(AppService.name);

    constructor(
        private readonly kafkaConsumer: KafkaConsumerService,
        private readonly kafkaProducer: KafkaProducerService,
        private readonly configService: ConfigurationService,
    ) { }

    async onModuleInit() {
        await this.startKafkaConsumer();
    }

    private async startKafkaConsumer(): Promise<void> {
        try {
            const kafkaConfig = this.configService.getKafkaConfig();
            const topic = kafkaConfig.topicPrefix;

            // Subscribe to the configured topic
            await this.kafkaConsumer.subscribeToTopic(topic, true);

            // Start consuming messages
            await this.kafkaConsumer.startConsuming(async (payload) => {
                this.logger.log(`Received message from topic ${payload.topic}:`, {
                    partition: payload.partition,
                    offset: payload.message.offset,
                    key: payload.message.key?.toString(),
                    value: payload.message.value?.toString(),
                });

                // Process the message here
                await this.processKafkaMessage(payload);
            });

            this.logger.log(`Kafka consumer started and listening to topic: ${topic}`);
        } catch (error) {
            this.logger.error('Failed to start Kafka consumer:', error);
        }
    }

    private async processKafkaMessage(payload: any): Promise<void> {
        try {
            const message = JSON.parse(payload.message.value.toString());
            this.logger.log('Processing Kafka message:', message);

            // Add your message processing logic here
            // For example:
            // - Save to database
            // - Trigger business logic
            // - Send notifications
            // - etc.

        } catch (error) {
            this.logger.error('Error processing Kafka message:', error);
        }
    }

    getHello(): string {
        return 'Welcome to Delve - A simple NestJS application!';
    }

    getHealth(): object {
        return {
            status: 'ok',
            message: 'Delve application is running',
            timestamp: new Date().toISOString(),
        };
    }

    async sendMessage(topic: string, message: any): Promise<{ success: boolean; message: string }> {
        try {
            await this.kafkaProducer.produceKafkaEvent(topic, message);
            this.logger.log(`Message sent to topic ${topic}:`, message);
            return {
                success: true,
                message: `Message sent to topic ${topic}`
            };
        } catch (error) {
            this.logger.error(`Failed to send message to topic ${topic}:`, error);
            return {
                success: false,
                message: `Failed to send message: ${error.message}`
            };
        }
    }
}
