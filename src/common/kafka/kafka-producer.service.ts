import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { ConfigurationService } from '../configurations/configuration.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { KafkaMessageDto } from 'src/api/dto/kafka-message.dto';
import { EventStageEnum } from 'src/entities/enums/event-stage.enum';
import { DatabaseService } from '../database/database.service';
import { LifecycleStatusEnum } from 'src/entities/enums/lifecycle-status.enum';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaProducerService.name);
    private kafka: Kafka;
    private producer: Producer;
    private kafkaTopic: string;
    private dlqKafkaTopic: string;

    constructor(private readonly configService: ConfigurationService,
        private readonly databaseService: DatabaseService
    ) {
        this.kafkaTopic = this.configService.getKafkaConfig().topicName;
        this.dlqKafkaTopic = this.configService.getKafkaConfig().dlqTopicName;
    }

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

    private async sendRecord(record: ProducerRecord, logMessage: string, errorMessage: string): Promise<void> {
        try {
            await this.producer.send(record);
            this.logger.log(logMessage);
        } catch (error) {
            this.logger.error(errorMessage, error);
            throw error;
        }
    }

    async produceKafkaEvent(topic: string, event: any, key?: string): Promise<void> {
        const record: ProducerRecord = {
            topic,
            messages: [{
                key,
                value: JSON.stringify(event),
                timestamp: Date.now().toString(),
            }],
        };

        await this.sendRecord(
            record,
            `Kafka event produced to topic ${topic}: ${JSON.stringify(event)}`,
            `Failed to produce Kafka event to topic ${topic}:`
        );
    }

    async sendMessage(topic: string, message: any, key?: string): Promise<void> {
        const record: ProducerRecord = {
            topic,
            messages: [{
                key,
                value: JSON.stringify(message),
                timestamp: Date.now().toString(),
            }],
        };

        await this.sendRecord(
            record,
            `Message sent to topic ${topic}: ${JSON.stringify(message)}`,
            `Failed to send message to topic ${topic}:`
        );
    }

    async sendBatchMessages(topic: string, messages: Array<{ key?: string; value: any }>): Promise<void> {
        const record: ProducerRecord = {
            topic,
            messages: messages.map(msg => ({
                key: msg.key,
                value: JSON.stringify(msg.value),
                timestamp: Date.now().toString(),
            })),
        };

        await this.sendRecord(
            record,
            `Batch of ${messages.length} messages sent to topic ${topic}`,
            `Failed to send batch messages to topic ${topic}:`
        );
    }

    async sendMessageWithPartition(topic: string, message: any, partition: number, key?: string): Promise<void> {
        const record: ProducerRecord = {
            topic,
            messages: [{
                key,
                value: JSON.stringify(message),
                partition,
                timestamp: Date.now().toString(),
            }],
        };

        await this.sendRecord(
            record,
            `Message sent to topic ${topic}, partition ${partition}: ${JSON.stringify(message)}`,
            `Failed to send message to topic ${topic}, partition ${partition}:`
        );
    }

    async retryKafkaMessage(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto, errorMessage?: string): Promise<void> {
        try {
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.FAIL, errorMessage);
            if (kafkaEntry.retryCount === 3 && kafkaEntry.status === KafkaStatusEnum.FAILED) {
                // Retry limit is exhausted. Push to DLQ
                if (kafkaEntry.topicName === this.kafkaTopic) {
                    await this.databaseService.markKafkaEntryAsDLQ(kafkaEntry);
                    this.logger.warn(`Retry limit exhausted for kafka entry ${kafkaEntry.id}. Moving to DLQ.`);
                    const dlqMessage: KafkaMessageDto = {
                        headers: {
                            priority: kafkaEntry.child.priority,
                            referenceId: kafkaEntry.child.referenceId,
                            eventType: kafkaEntry.child.eventType,
                            topicName: kafkaEntry.child.topicName,
                            eventStage: kafkaEntry.eventStage
                        },
                        data: kafkaMessage
                    }
                    await this.produceKafkaEvent(kafkaEntry.child.topicName, dlqMessage, kafkaEntry.child.priority + kafkaEntry.child.referenceId);
                    return;
                }
                else {
                    await this.databaseService.markKafkaEntryAsDLQFailed(kafkaEntry);
                    this.logger.warn(`Retry limit exhausted for kafka entry ${kafkaEntry.id}. No Further Processing.`);
                    return;
                }
            }
            kafkaMessage.headers.eventStage = kafkaEntry.eventStage;
            kafkaMessage.headers.retryAt = kafkaEntry.nextRetryAt;
            await this.produceKafkaEvent(kafkaEntry.topicName, kafkaMessage, kafkaEntry.priority + kafkaEntry.referenceId);
        } catch (error) {
            this.logger.error(`Failed to retry kafka message for entry ${kafkaEntry.id}:`, error);
            throw error;
        }
    }

}
