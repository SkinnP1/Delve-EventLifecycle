import { Injectable, Logger } from '@nestjs/common';
import { KafkaMessageDto } from 'src/api/dto/kafka-message.dto';
import { EventStageEnum } from 'src/entities/enums/event-stage.enum';
import { EventTypeEnum } from 'src/entities/enums/event-type.enum';
import { DatabaseService } from 'src/common/database/database.service';
import { LifecycleStatusEnum } from 'src/entities/enums/lifecycle-status.enum';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';
import { KafkaProducerService } from 'src/common/kafka/kafka-producer.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { EmailService } from '../external/email.service';
import { SmsService } from '../external/sms.service';


@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(private readonly databaseService: DatabaseService, private readonly kafkaProducerService: KafkaProducerService, private readonly emailService: EmailService, private readonly smsService: SmsService) { }

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
                case EventTypeEnum.NOTIFICATION_SMS:
                    await this.processSmsNotification(kafkaMessage);
                    break;
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

    private async processSmsNotification(kafkaMessage: KafkaMessageDto): Promise<void> {
        const { headers, data } = kafkaMessage;
        const kafkaEntry = await this.databaseService.getKafkaEntryByReferenceId(kafkaMessage.headers.referenceId);
        const eventStage = headers?.eventStage;
        try {
            if (!eventStage) {
                await this.validatePhoneNumber(kafkaEntry, kafkaMessage);
                await this.checkRateLimit(kafkaEntry, kafkaMessage);
                await this.sendSms(kafkaEntry, kafkaMessage);
                await this.logDelivery(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.CHECK_RATE_LIMIT) {
                await this.checkRateLimit(kafkaEntry, kafkaMessage);
                await this.sendSms(kafkaEntry, kafkaMessage);
                await this.logDelivery(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.SEND_SMS) {
                await this.sendSms(kafkaEntry, kafkaMessage);
                await this.logDelivery(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.LOG_DELIVERY) {
                await this.logDelivery(kafkaEntry, kafkaMessage);
            }
            await this.databaseService.markKafkaEntrySuccess(kafkaEntry);

        } catch (error) {
            this.logger.error('Error processing sms notification:', error);
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
            throw error;

        }
    }

    // Step 2: Send Email (3 lines)
    private async sendEmail(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.SEND_EMAIL)
        try {
            // Add logic to Send Email
            await this.emailService.sendEmail(kafkaMessage.data);
            console.log('sendEmail', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error sendEmail:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 3: Render Content (3 lines)
    private async renderContent(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.RENDER_CONTENT)
        try {
            // Add logic to render content
            console.log('renderContent', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error renderContent:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }


    // Step 4: Track Status (3 lines)
    private async trackStatus(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.TRACK_STATUS)
        try {
            // Add logic to track status
            console.log('trackStatus', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error trackStatus:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }


    // Step 1: Validate template (3 lines)
    private async validatePhoneNumber(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.VALIDATE_PHONE)
        try {
            // Add logic to validate phone number
            console.log('validatePhoneNumber', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error validating phone number:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;

        }
    }

    // Step 2: Check Rate Limit (3 lines)
    private async checkRateLimit(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.CHECK_RATE_LIMIT)
        try {
            // Add logic to render content
            console.log('checkRateLimit', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error checkRateLimit:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }


    // Step 3: Send SMS (3 lines)
    private async sendSms(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.SEND_SMS)
        try {
            // Add logic to Send SMS
            await this.smsService.sendSms(kafkaMessage.data);
            console.log('sendSms', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error sendSms:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }


    // Step 4: Log Delivery (3 lines)
    private async logDelivery(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.LOG_DELIVERY)
        try {
            // Add logic for log delivery
            console.log('logDelivery', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error logDelivery:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

}
