import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/services/internal/user.service';
import { DatabaseService } from '../../src/common/database/database.service';
import { KafkaProducerService } from '../../src/common/kafka/kafka-producer.service';
import { EmailService } from '../../src/services/external/email.service';
import { AnalyticsService } from '../../src/services/external/analytics.service';
import { KafkaMessageDto } from '../../src/api/dto/kafka-message.dto';
import { EventStageEnum } from '../../src/entities/enums/event-stage.enum';
import { EventTypeEnum } from '../../src/entities/enums/event-type.enum';
import { LifecycleStatusEnum } from '../../src/entities/enums/lifecycle-status.enum';
import { KafkaStatusEnum } from '../../src/entities/enums/kafka-status.enum';

describe('Stage Processing', () => {
    let userService: UserService;
    let databaseService: DatabaseService;
    let kafkaProducerService: KafkaProducerService;
    let emailService: EmailService;
    let analyticsService: AnalyticsService;

    beforeEach(async () => {
        const mockDatabaseService = {
            updateKafkaEntry: jest.fn(),
            updateEventLifecycle: jest.fn(),
            markKafkaEntrySuccess: jest.fn(),
            getKafkaEntryByReferenceId: jest.fn(),
        };

        const mockKafkaProducerService = {
            retryKafkaMessage: jest.fn(),
        };

        const mockEmailService = {
            sendEmail: jest.fn(),
        };

        const mockAnalyticsService = {
            trackEvent: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService,
                },
                {
                    provide: KafkaProducerService,
                    useValue: mockKafkaProducerService,
                },
                {
                    provide: EmailService,
                    useValue: mockEmailService,
                },
                {
                    provide: AnalyticsService,
                    useValue: mockAnalyticsService,
                },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        databaseService = module.get<DatabaseService>(DatabaseService);
        kafkaProducerService = module.get<KafkaProducerService>(KafkaProducerService);
        emailService = module.get<EmailService>(EmailService);
        analyticsService = module.get<AnalyticsService>(AnalyticsService);
    });

    describe('User Created Event Processing', () => {
        it('should process user created event without event stage', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: null,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_CREATED,
                    eventStage: null,
                },
                data: {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'John Doe',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
            jest.spyOn(analyticsService, 'trackEvent').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify all stages are processed
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.VALIDATE_DATA
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.SEND_WELCOME_EMAIL
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.CREATE_PROFILE
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.PUBLISH_ANALYTICS
            );

            expect(databaseService.markKafkaEntrySuccess).toHaveBeenCalledWith(mockKafkaEntry);
            expect(emailService.sendEmail).toHaveBeenCalledWith(mockKafkaMessage.data);
            expect(analyticsService.trackEvent).toHaveBeenCalledWith(mockKafkaMessage.data);

            consoleSpy.mockRestore();
        });

        it('should process user created event with specific event stage', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: EventStageEnum.SEND_WELCOME_EMAIL,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_CREATED,
                    eventStage: EventStageEnum.SEND_WELCOME_EMAIL,
                },
                data: {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'John Doe',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
            jest.spyOn(analyticsService, 'trackEvent').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify only the remaining stages are processed
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.SEND_WELCOME_EMAIL
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.CREATE_PROFILE
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.PUBLISH_ANALYTICS
            );

            // Should not call validate data since we're starting from SEND_WELCOME_EMAIL
            expect(databaseService.updateKafkaEntry).not.toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.VALIDATE_DATA
            );

            consoleSpy.mockRestore();
        });
    });

    describe('User Updated Event Processing', () => {
        it('should process user updated event without event stage', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: null,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_UPDATED,
                    eventStage: null,
                },
                data: {
                    userId: '123',
                    email: 'updated@example.com',
                    name: 'John Updated',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(analyticsService, 'trackEvent').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify all update stages are processed
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.VALIDATE_PAYLOAD
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.SYNC_ANALYTICS
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.UPDATE_SEARCH_INDEX
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.INVALIDATE_CACHE
            );

            expect(databaseService.markKafkaEntrySuccess).toHaveBeenCalledWith(mockKafkaEntry);
            expect(analyticsService.trackEvent).toHaveBeenCalledWith(mockKafkaMessage.data);

            consoleSpy.mockRestore();
        });

        it('should process user updated event with specific event stage', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: EventStageEnum.SYNC_ANALYTICS,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_UPDATED,
                    eventStage: EventStageEnum.SYNC_ANALYTICS,
                },
                data: {
                    userId: '123',
                    email: 'updated@example.com',
                    name: 'John Updated',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(analyticsService, 'trackEvent').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify only the remaining stages are processed
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.SYNC_ANALYTICS
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.UPDATE_SEARCH_INDEX
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.INVALIDATE_CACHE
            );

            // Should not call validate payload since we're starting from SYNC_ANALYTICS
            expect(databaseService.updateKafkaEntry).not.toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.VALIDATE_PAYLOAD
            );

            consoleSpy.mockRestore();
        });
    });

    describe('User Deleted Event Processing', () => {
        it('should process user deleted event without event stage', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: null,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_DELETED,
                    eventStage: null,
                },
                data: {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'John Doe',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify all deletion stages are processed
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.SOFT_DELETE
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.QUEUE_DATA_EXPORT
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.REMOVE_FROM_INDICES
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.SEND_CONFIRMATION
            );

            expect(databaseService.markKafkaEntrySuccess).toHaveBeenCalledWith(mockKafkaEntry);
            expect(emailService.sendEmail).toHaveBeenCalledWith(mockKafkaMessage.data);

            consoleSpy.mockRestore();
        });

        it('should process user deleted event with specific event stage', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: EventStageEnum.QUEUE_DATA_EXPORT,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_DELETED,
                    eventStage: EventStageEnum.QUEUE_DATA_EXPORT,
                },
                data: {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'John Doe',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify only the remaining stages are processed
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.QUEUE_DATA_EXPORT
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.REMOVE_FROM_INDICES
            );
            expect(databaseService.updateKafkaEntry).toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.SEND_CONFIRMATION
            );

            // Should not call soft delete since we're starting from QUEUE_DATA_EXPORT
            expect(databaseService.updateKafkaEntry).not.toHaveBeenCalledWith(
                mockKafkaEntry,
                EventStageEnum.SOFT_DELETE
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Stage Processing Error Handling', () => {
        it('should handle errors in stage processing and trigger retry', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: EventStageEnum.SEND_WELCOME_EMAIL,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_CREATED,
                    eventStage: EventStageEnum.SEND_WELCOME_EMAIL,
                },
                data: {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'John Doe',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(kafkaProducerService, 'retryKafkaMessage').mockResolvedValue();

            // Mock email service to throw an error
            jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('Email service unavailable'));

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify retry is triggered
            expect(kafkaProducerService.retryKafkaMessage).toHaveBeenCalledWith(
                mockKafkaEntry,
                mockKafkaMessage,
                'Email service unavailable'
            );

            consoleSpy.mockRestore();
        });

        it('should handle unsupported event types', async () => {
            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: 'UNSUPPORTED_EVENT' as any,
                },
                data: {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'John Doe',
                },
            });

            const loggerSpy = jest.spyOn(userService['logger'], 'warn').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Should not throw an error, just log a warning
            expect(loggerSpy).toHaveBeenCalledWith(
                'Unsupported user event type: UNSUPPORTED_EVENT'
            );

            loggerSpy.mockRestore();
        });
    });

    describe('Stage Processing Flow', () => {
        it('should process stages in correct order for user created', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: null,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_CREATED,
                    eventStage: null,
                },
                data: {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'John Doe',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
            jest.spyOn(analyticsService, 'trackEvent').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify stages are called in correct order
            const updateKafkaEntryCalls = (databaseService.updateKafkaEntry as jest.Mock).mock.calls;
            expect(updateKafkaEntryCalls[0]).toEqual([mockKafkaEntry, EventStageEnum.VALIDATE_DATA]);
            expect(updateKafkaEntryCalls[1]).toEqual([mockKafkaEntry, EventStageEnum.SEND_WELCOME_EMAIL]);
            expect(updateKafkaEntryCalls[2]).toEqual([mockKafkaEntry, EventStageEnum.CREATE_PROFILE]);
            expect(updateKafkaEntryCalls[3]).toEqual([mockKafkaEntry, EventStageEnum.PUBLISH_ANALYTICS]);

            consoleSpy.mockRestore();
        });

        it('should process stages in correct order for user updated', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: null,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_UPDATED,
                    eventStage: null,
                },
                data: {
                    userId: '123',
                    email: 'updated@example.com',
                    name: 'John Updated',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(analyticsService, 'trackEvent').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify stages are called in correct order
            const updateKafkaEntryCalls = (databaseService.updateKafkaEntry as jest.Mock).mock.calls;
            expect(updateKafkaEntryCalls[0]).toEqual([mockKafkaEntry, EventStageEnum.VALIDATE_PAYLOAD]);
            expect(updateKafkaEntryCalls[1]).toEqual([mockKafkaEntry, EventStageEnum.SYNC_ANALYTICS]);
            expect(updateKafkaEntryCalls[2]).toEqual([mockKafkaEntry, EventStageEnum.UPDATE_SEARCH_INDEX]);
            expect(updateKafkaEntryCalls[3]).toEqual([mockKafkaEntry, EventStageEnum.INVALIDATE_CACHE]);

            consoleSpy.mockRestore();
        });

        it('should process stages in correct order for user deleted', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                eventStage: null,
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventType: EventTypeEnum.USER_DELETED,
                    eventStage: null,
                },
                data: {
                    userId: '123',
                    email: 'test@example.com',
                    name: 'John Doe',
                },
            });

            jest.spyOn(databaseService, 'getKafkaEntryByReferenceId').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateKafkaEntry').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntrySuccess').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await userService.processUserMessage(mockKafkaMessage);

            // Verify stages are called in correct order
            const updateKafkaEntryCalls = (databaseService.updateKafkaEntry as jest.Mock).mock.calls;
            expect(updateKafkaEntryCalls[0]).toEqual([mockKafkaEntry, EventStageEnum.SOFT_DELETE]);
            expect(updateKafkaEntryCalls[1]).toEqual([mockKafkaEntry, EventStageEnum.QUEUE_DATA_EXPORT]);
            expect(updateKafkaEntryCalls[2]).toEqual([mockKafkaEntry, EventStageEnum.REMOVE_FROM_INDICES]);
            expect(updateKafkaEntryCalls[3]).toEqual([mockKafkaEntry, EventStageEnum.SEND_CONFIRMATION]);

            consoleSpy.mockRestore();
        });
    });
});
