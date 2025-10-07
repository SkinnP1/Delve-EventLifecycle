import { Injectable, Logger } from '@nestjs/common';
import { KafkaMessageDto } from 'src/api/dto/kafka-message.dto';
import { EventStageEnum } from 'src/entities/enums/event-stage.enum';
import { EventTypeEnum } from 'src/entities/enums/event-type.enum';
import { DatabaseService } from 'src/common/database/database.service';
import { LifecycleStatusEnum } from 'src/entities/enums/lifecycle-status.enum';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';
import { KafkaProducerService } from 'src/common/kafka/kafka-producer.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';

export interface NotificationData {
    recipient: string;
    subject?: string;
    message: string;
    type: 'email' | 'sms';
    metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(private readonly databaseService: DatabaseService, private readonly kafkaProducerService: KafkaProducerService) { }

    /**
     * Process notification message from Kafka
     * @param kafkaMessage - The Kafka message containing notification data
     */
    async processNotificationMessage(kafkaMessage: KafkaMessageDto): Promise<void> {
        try {
            const { headers, data } = kafkaMessage;
            const eventType = headers.eventType;
            switch (eventType) {
                case EventTypeEnum.NOTIFICATION_EMAIL:
                    await this.processEmailNotification(kafkaMessage);
                    break;
                // case EventTypeEnum.NOTIFICATION_SMS:
                //     await this.processSmsNotification(kafkaMessage);
                //     break;
                default:
                    this.logger.warn(`Unsupported notification event type: ${eventType}`);
                    break;
            }
        } catch (error) {
            this.logger.error('Error processing notification message:', error);
            throw error;
        }
    }

    /**
     * Process email notification
     * @param data - Email notification data
     */
    private async processEmailNotification(kafkaMessage: KafkaMessageDto): Promise<void> {
        const { headers, data } = kafkaMessage;
        const kafkaEntry = await this.databaseService.getKafkaEntryByReferenceId(kafkaMessage.headers.referenceId);
        const eventStage = headers?.eventStage;
        try {
            if (!eventStage) {
                await this.validateTemplate(kafkaEntry, kafkaMessage);
                await this.renderContent(kafkaEntry, kafkaMessage);
                await this.sendEmail(kafkaEntry, kafkaMessage);
                await this.trackStatus(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.RENDER_CONTENT) {
                await this.renderContent(kafkaEntry, kafkaMessage);
                await this.sendEmail(kafkaEntry, kafkaMessage);
                await this.trackStatus(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.SEND_EMAIL) {
                await this.sendEmail(kafkaEntry, kafkaMessage);
                await this.trackStatus(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.TRACK_STATUS) {
                await this.trackStatus(kafkaEntry, kafkaMessage);
            }
            await this.databaseService.markKafkaEntrySuccess(kafkaEntry);

        } catch (error) {
            this.logger.error('Error processing email notification:', error);
            throw error;
        }
    }

    // Step 1: Validate template (3 lines)
    private async validateTemplate(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.VALIDATE_TEMPLATE)
        try {
            // Add logic to validate template
            console.log('validateTemplate', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error validating template:', error);
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.FAIL);
            if (kafkaEntry.retryCount == 3 && kafkaEntry.status === KafkaStatusEnum.FAILED) {
                // Retry Limit is exhasuted. Push to DLQ
            }
            kafkaMessage.headers.eventStage = EventStageEnum.VALIDATE_TEMPLATE;
            kafkaMessage.headers.retryAt = kafkaEntry.nextRetryAt;
            await this.kafkaProducerService.produceKafkaEvent(kafkaEntry.topicName, kafkaMessage, kafkaEntry.priority + kafkaEntry.referenceId);
        }
    }

    // Step 1: Validate template (3 lines)
    private async sendEmail(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.SEND_EMAIL)
        try {
            // Add logic to validate template
            console.log('sendEmail', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error validating template:', error);
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.FAIL);
            if (kafkaEntry.retryCount == 3 && kafkaEntry.status === KafkaStatusEnum.FAILED) {
                // Retry Limit is exhasuted. Push to DLQ
            }
            kafkaMessage.headers.eventStage = EventStageEnum.SEND_EMAIL;
            kafkaMessage.headers.retryAt = kafkaEntry.nextRetryAt;
            await this.kafkaProducerService.produceKafkaEvent(kafkaEntry.topicName, kafkaMessage, kafkaEntry.priority + kafkaEntry.referenceId);
        }
    }

    // Step 1: Validate template (3 lines)
    private async renderContent(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.RENDER_CONTENT)
        try {
            // Add logic to validate template
            console.log('sendEmail', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error validating template:', error);
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.FAIL);
            if (kafkaEntry.retryCount == 3 && kafkaEntry.status === KafkaStatusEnum.FAILED) {
                // Retry Limit is exhasuted. Push to DLQ
            }
            kafkaMessage.headers.eventStage = EventStageEnum.RENDER_CONTENT;
            kafkaMessage.headers.retryAt = kafkaEntry.nextRetryAt;
            await this.kafkaProducerService.produceKafkaEvent(kafkaEntry.topicName, kafkaMessage, kafkaEntry.priority + kafkaEntry.referenceId);
        }
    }

    private async trackStatus(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.TRACK_STATUS)
        try {
            // Add logic to validate template
            console.log('sendEmail', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error validating template:', error);
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.FAIL);
            if (kafkaEntry.retryCount == 3 && kafkaEntry.status === KafkaStatusEnum.FAILED) {
                // Retry Limit is exhasuted. Push to DLQ
            }
            kafkaMessage.headers.eventStage = EventStageEnum.TRACK_STATUS;
            kafkaMessage.headers.retryAt = kafkaEntry.nextRetryAt;
            await this.kafkaProducerService.produceKafkaEvent(kafkaEntry.topicName, kafkaMessage, kafkaEntry.priority + kafkaEntry.referenceId);
        }
    }

}
