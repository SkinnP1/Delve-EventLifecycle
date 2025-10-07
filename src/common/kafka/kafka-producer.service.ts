import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { ConfigurationService } from '../configurations/configuration.service';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaProducerService.name);
    private kafka: Kafka;
    private producer: Producer;

    constructor(private readonly configService: ConfigurationService) { }

    async onModuleInit() {
        await this.kafkaConnect();
    }

    async kafkaConnect(): Promise<void> {
        const kafkaConfig = this.configService.getKafkaConfig();
        const producerConfig = this.configService.getKafkaProducerConfig();

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

        this.producer = this.kafka.producer({
            createPartitioner: () => {
                return (() => 0); // Simple round-robin partitioner
            }
        });

        await this.producer.connect();
        this.logger.log('Kafka producer connected successfully');
    }

    async onModuleDestroy() {
        if (this.producer) {
            await this.producer.disconnect();
            this.logger.log('Kafka producer disconnected');
        }
    }

    async produceKafkaEvent(topic: string, event: any, key?: string): Promise<void> {
        try {
            const record: ProducerRecord = {
                topic,
                messages: [{
                    key,
                    value: JSON.stringify(event),
                    timestamp: Date.now().toString(),
                }],
            };

            await this.producer.send(record);
            this.logger.log(`Kafka event produced to topic ${topic}: ${JSON.stringify(event)}`);
        } catch (error) {
            this.logger.error(`Failed to produce Kafka event to topic ${topic}:`, error);
            throw error;
        }
    }

    async sendMessage(topic: string, message: any, key?: string): Promise<void> {
        try {
            const record: ProducerRecord = {
                topic,
                messages: [{
                    key,
                    value: JSON.stringify(message),
                    timestamp: Date.now().toString(),
                }],
            };

            await this.producer.send(record);
            this.logger.log(`Message sent to topic ${topic}: ${JSON.stringify(message)}`);
        } catch (error) {
            this.logger.error(`Failed to send message to topic ${topic}:`, error);
            throw error;
        }
    }

    async sendBatchMessages(topic: string, messages: Array<{ key?: string; value: any }>): Promise<void> {
        try {
            const record: ProducerRecord = {
                topic,
                messages: messages.map(msg => ({
                    key: msg.key,
                    value: JSON.stringify(msg.value),
                    timestamp: Date.now().toString(),
                })),
            };

            await this.producer.send(record);
            this.logger.log(`Batch of ${messages.length} messages sent to topic ${topic}`);
        } catch (error) {
            this.logger.error(`Failed to send batch messages to topic ${topic}:`, error);
            throw error;
        }
    }

    async sendMessageWithPartition(topic: string, message: any, partition: number, key?: string): Promise<void> {
        try {
            const record: ProducerRecord = {
                topic,
                messages: [{
                    key,
                    value: JSON.stringify(message),
                    partition,
                    timestamp: Date.now().toString(),
                }],
            };

            await this.producer.send(record);
            this.logger.log(`Message sent to topic ${topic}, partition ${partition}: ${JSON.stringify(message)}`);
        } catch (error) {
            this.logger.error(`Failed to send message to topic ${topic}, partition ${partition}:`, error);
            throw error;
        }
    }
}
