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
import { AnalyticsService } from '../external/analytics.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly kafkaProducerService: KafkaProducerService,
        private readonly emailService: EmailService,
        private readonly analyticsService: AnalyticsService
    ) { }

    /**
     * Process user message from Kafka
     * @param kafkaMessage - The Kafka message containing user data
     */
    async processUserMessage(kafkaMessage: KafkaMessageDto): Promise<void> {
        try {
            const { headers, data } = kafkaMessage;
            const eventType = headers.eventType;
            switch (eventType) {
                case EventTypeEnum.USER_CREATED:
                    await this.processUserCreated(kafkaMessage);
                    break;
                case EventTypeEnum.USER_UPDATED:
                    await this.processUserUpdated(kafkaMessage);
                    break;
                case EventTypeEnum.USER_DELETED:
                    await this.processUserDeleted(kafkaMessage);
                    break;
                default:
                    this.logger.warn(`Unsupported user event type: ${eventType}`);
                    break;
            }
        } catch (error) {
            this.logger.error('Error processing user message:', error);
            throw error;
        }
    }

    /**
     * Process user created event
     * @param kafkaMessage - User created data
     */
    private async processUserCreated(kafkaMessage: KafkaMessageDto): Promise<void> {
        const { headers, data } = kafkaMessage;
        const kafkaEntry = await this.databaseService.getKafkaEntryByReferenceId(kafkaMessage.headers.referenceId);
        const eventStage = headers?.eventStage;
        try {
            if (!eventStage) {
                await this.validateData(kafkaEntry, kafkaMessage);
                await this.sendWelcomeEmail(kafkaEntry, kafkaMessage);
                await this.createProfile(kafkaEntry, kafkaMessage);
                await this.publishAnalytics(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.SEND_WELCOME_EMAIL) {
                await this.sendWelcomeEmail(kafkaEntry, kafkaMessage);
                await this.createProfile(kafkaEntry, kafkaMessage);
                await this.publishAnalytics(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.CREATE_PROFILE) {
                await this.createProfile(kafkaEntry, kafkaMessage);
                await this.publishAnalytics(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.PUBLISH_ANALYTICS) {
                await this.publishAnalytics(kafkaEntry, kafkaMessage);
            }
            await this.databaseService.markKafkaEntrySuccess(kafkaEntry);

        } catch (error) {
            this.logger.error('Error processing user created:', error);
        }
    }

    /**
     * Process user updated event
     * @param kafkaMessage - User updated data
     */
    private async processUserUpdated(kafkaMessage: KafkaMessageDto): Promise<void> {
        const { headers, data } = kafkaMessage;
        const kafkaEntry = await this.databaseService.getKafkaEntryByReferenceId(kafkaMessage.headers.referenceId);
        const eventStage = headers?.eventStage;
        try {
            if (!eventStage) {
                await this.validatePayload(kafkaEntry, kafkaMessage);
                await this.syncAnalytics(kafkaEntry, kafkaMessage);
                await this.updateSearchIndex(kafkaEntry, kafkaMessage);
                await this.invalidateCache(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.SYNC_ANALYTICS) {
                await this.syncAnalytics(kafkaEntry, kafkaMessage);
                await this.updateSearchIndex(kafkaEntry, kafkaMessage);
                await this.invalidateCache(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.UPDATE_SEARCH_INDEX) {
                await this.updateSearchIndex(kafkaEntry, kafkaMessage);
                await this.invalidateCache(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.INVALIDATE_CACHE) {
                await this.invalidateCache(kafkaEntry, kafkaMessage);
            }
            await this.databaseService.markKafkaEntrySuccess(kafkaEntry);

        } catch (error) {
            this.logger.error('Error processing user updated:', error);
        }
    }

    /**
     * Process user deleted event
     * @param kafkaMessage - User deleted data
     */
    private async processUserDeleted(kafkaMessage: KafkaMessageDto): Promise<void> {
        const { headers, data } = kafkaMessage;
        const kafkaEntry = await this.databaseService.getKafkaEntryByReferenceId(kafkaMessage.headers.referenceId);
        const eventStage = headers?.eventStage;
        try {
            if (!eventStage) {
                await this.softDelete(kafkaEntry, kafkaMessage);
                await this.queueDataExport(kafkaEntry, kafkaMessage);
                await this.removeFromIndices(kafkaEntry, kafkaMessage);
                await this.sendConfirmation(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.QUEUE_DATA_EXPORT) {
                await this.queueDataExport(kafkaEntry, kafkaMessage);
                await this.removeFromIndices(kafkaEntry, kafkaMessage);
                await this.sendConfirmation(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.REMOVE_FROM_INDICES) {
                await this.removeFromIndices(kafkaEntry, kafkaMessage);
                await this.sendConfirmation(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.SEND_CONFIRMATION) {
                await this.sendConfirmation(kafkaEntry, kafkaMessage);
            }
            await this.databaseService.markKafkaEntrySuccess(kafkaEntry);

        } catch (error) {
            this.logger.error('Error processing user deleted:', error);
        }
    }

    // Step 1: Validate data (3 lines)
    private async validateData(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.VALIDATE_DATA)
        try {
            // Add logic to validate user data
            console.log('validateData', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error validating data:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 2: Send welcome email (3 lines)
    private async sendWelcomeEmail(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.SEND_WELCOME_EMAIL)
        try {
            // Add logic to send welcome email
            await this.emailService.sendEmail(kafkaMessage.data);
            console.log('sendWelcomeEmail', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error sending welcome email:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 3: Create profile (3 lines)
    private async createProfile(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.CREATE_PROFILE)
        try {
            // Add logic to create user profile
            console.log('createProfile', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error creating profile:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 4: Publish analytics (3 lines)
    private async publishAnalytics(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.PUBLISH_ANALYTICS)
        try {
            // Add logic to publish analytics
            await this.analyticsService.trackEvent(kafkaMessage.data);
            console.log('publishAnalytics', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error publishing analytics:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 1: Validate payload (3 lines)
    private async validatePayload(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.VALIDATE_PAYLOAD)
        try {
            // Add logic to validate payload
            console.log('validatePayload', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error validating payload:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 2: Sync analytics (3 lines)
    private async syncAnalytics(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.SYNC_ANALYTICS)
        try {
            // Add logic to sync analytics
            await this.analyticsService.trackEvent(kafkaMessage.data);
            console.log('syncAnalytics', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error syncing analytics:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 3: Update search index (3 lines)
    private async updateSearchIndex(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.UPDATE_SEARCH_INDEX)
        try {
            // Add logic to update search index
            console.log('updateSearchIndex', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error updating search index:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 4: Invalidate cache (3 lines)
    private async invalidateCache(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.INVALIDATE_CACHE)
        try {
            // Add logic to invalidate cache
            console.log('invalidateCache', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error invalidating cache:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 1: Soft delete (3 lines)
    private async softDelete(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.SOFT_DELETE)
        try {
            // Add logic to soft delete user
            console.log('softDelete', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error soft deleting user:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 2: Queue data export (3 lines)
    private async queueDataExport(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.QUEUE_DATA_EXPORT)
        try {
            // Add logic to queue data export
            console.log('queueDataExport', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error queueing data export:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 3: Remove from indices (3 lines)
    private async removeFromIndices(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.REMOVE_FROM_INDICES)
        try {
            // Add logic to remove from indices
            console.log('removeFromIndices', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error removing from indices:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
        }
    }

    // Step 4: Send confirmation (3 lines)
    private async sendConfirmation(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.SEND_CONFIRMATION)
        try {
            // Add logic to send confirmation
            await this.emailService.sendEmail(kafkaMessage.data);
            console.log('sendConfirmation', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error sending confirmation:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }
}
