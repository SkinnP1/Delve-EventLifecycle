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

            // Subscribe to all configured topics (main topic + additional topics)
            await this.kafkaConsumer.subscribeToAllConfiguredTopics(true);

            // Start consuming messages
            await this.kafkaConsumer.startConsuming(async (payload) => {
                this.logger.log(`Received message from topic ${payload.topic}:`, {
                    partition: payload.partition,
                    offset: payload.message.offset,
                    key: payload.message.key?.toString(),
                    value: payload.message.value?.toString(),
                });

                // Process the message here
                await this.kafkaConsumer.processMessage(payload);
            });

            const allTopics = [kafkaConfig.topicName, kafkaConfig.dlqTopicName];
            this.logger.log(`Kafka consumer started and listening to topics: ${allTopics.join(', ')}`);
        } catch (error) {
            this.logger.error('Failed to start Kafka consumer:', error);
        }
    }

}
