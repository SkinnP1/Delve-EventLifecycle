import { Injectable, Logger } from '@nestjs/common';
import { KafkaMessageDto } from 'src/api/dto/kafka-message.dto';
import { EventStageEnum } from 'src/entities/enums/event-stage.enum';
import { EventTypeEnum } from 'src/entities/enums/event-type.enum';
import { DatabaseService } from 'src/common/database/database.service';
import { LifecycleStatusEnum } from 'src/entities/enums/lifecycle-status.enum';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';
import { KafkaProducerService } from 'src/common/kafka/kafka-producer.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';


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
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)

        }
    }

    // Step 2: Send Email (3 lines)
    private async sendEmail(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.SEND_EMAIL)
        try {
            // Add logic to validate template
            console.log('sendEmail', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error sendEmail:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 3: Render Content (3 lines)
    private async renderContent(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.RENDER_CONTENT)
        try {
            // Add logic to validate template
            console.log('renderContent', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error renderContent:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 4: Track Status (3 lines)
    private async trackStatus(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.TRACK_STATUS)
        try {
            // Add logic to validate template
            console.log('trackStatus', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error trackStatus:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

}
