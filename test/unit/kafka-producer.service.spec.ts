import { Test, TestingModule } from '@nestjs/testing';
import { KafkaProducerService } from '../../src/common/kafka/kafka-producer.service';
import { DatabaseService } from '../../src/common/database/database.service';
import { ConfigurationService } from '../../src/common/configurations/configuration.service';
import { KafkaMessageDto } from '../../src/api/dto/kafka-message.dto';
import { KafkaEntryEntity } from '../../src/entities/kafka-entry.entity';
import { KafkaStatusEnum } from '../../src/entities/enums/kafka-status.enum';
import { LifecycleStatusEnum } from '../../src/entities/enums/lifecycle-status.enum';
import { EventStageEnum } from '../../src/entities/enums/event-stage.enum';

describe('KafkaProducerService', () => {
    let service: KafkaProducerService;
    let databaseService: DatabaseService;
    let configurationService: ConfigurationService;

    beforeEach(async () => {
        const mockDatabaseService = {
            updateEventLifecycle: jest.fn(),
            markKafkaEntryAsDLQ: jest.fn(),
            markKafkaEntryAsDLQFailed: jest.fn(),
        };

        const mockConfigurationService = {
            getKafkaConfig: jest.fn().mockReturnValue({
                topicName: 'test-topic',
                dlqTopicName: 'test-dlq-topic',
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KafkaProducerService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService,
                },
                {
                    provide: ConfigurationService,
                    useValue: mockConfigurationService,
                },
            ],
        }).compile();

        service = module.get<KafkaProducerService>(KafkaProducerService);
        databaseService = module.get<DatabaseService>(DatabaseService);
        configurationService = module.get<ConfigurationService>(ConfigurationService);
    });

    describe('Retry Logic', () => {
        it('should retry kafka message when retry count is less than 3', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                retryCount: 2,
                status: KafkaStatusEnum.FAILED,
                eventStage: EventStageEnum.VALIDATE_DATA,
                topicName: 'test-topic',
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventStage: null,
                    retryAt: null,
                },
            });

            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(service, 'produceKafkaEvent').mockResolvedValue();

            await service.retryKafkaMessage(mockKafkaEntry, mockKafkaMessage, 'Test error');

            expect(databaseService.updateEventLifecycle).toHaveBeenCalledWith(
                mockKafkaEntry,
                LifecycleStatusEnum.FAIL,
                'Test error'
            );
            expect(service.produceKafkaEvent).toHaveBeenCalledWith(
                mockKafkaEntry.topicName,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        eventStage: mockKafkaEntry.eventStage,
                        retryAt: mockKafkaEntry.nextRetryAt,
                    }),
                }),
                mockKafkaEntry.priority + mockKafkaEntry.referenceId
            );
        });

        it('should move to DLQ when retry limit is exhausted for main topic', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                retryCount: 3,
                status: KafkaStatusEnum.FAILED,
                eventStage: EventStageEnum.VALIDATE_DATA,
                topicName: 'test-topic', // Same as main topic
                child: {
                    priority: 'NORMAL',
                    referenceId: 'child-ref-123',
                    eventType: 'USER_CREATED',
                    topicName: 'child-topic',
                },
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                data: { userId: '123', email: 'test@example.com' },
            });

            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntryAsDLQ').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(service, 'produceKafkaEvent').mockResolvedValue();

            await service.retryKafkaMessage(mockKafkaEntry, mockKafkaMessage, 'Test error');

            expect(databaseService.updateEventLifecycle).toHaveBeenCalledWith(
                mockKafkaEntry,
                LifecycleStatusEnum.FAIL,
                'Test error'
            );
            expect(databaseService.markKafkaEntryAsDLQ).toHaveBeenCalledWith(mockKafkaEntry);
            expect(service.produceKafkaEvent).toHaveBeenCalledWith(
                mockKafkaEntry.child.topicName,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        priority: mockKafkaEntry.child.priority,
                        referenceId: mockKafkaEntry.child.referenceId,
                        eventType: mockKafkaEntry.child.eventType,
                        topicName: mockKafkaEntry.child.topicName,
                        eventStage: mockKafkaEntry.eventStage,
                    }),
                    data: mockKafkaMessage,
                }),
                mockKafkaEntry.child.priority + mockKafkaEntry.child.referenceId
            );
        });

        it('should mark as DLQ failed when retry limit is exhausted for non-main topic', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                retryCount: 3,
                status: KafkaStatusEnum.FAILED,
                eventStage: EventStageEnum.VALIDATE_DATA,
                topicName: 'other-topic', // Different from main topic
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                data: { userId: '123', email: 'test@example.com' },
            });

            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(databaseService, 'markKafkaEntryAsDLQFailed').mockResolvedValue(mockKafkaEntry);

            await service.retryKafkaMessage(mockKafkaEntry, mockKafkaMessage, 'Test error');

            expect(databaseService.updateEventLifecycle).toHaveBeenCalledWith(
                mockKafkaEntry,
                LifecycleStatusEnum.FAIL,
                'Test error'
            );
            expect(databaseService.markKafkaEntryAsDLQFailed).toHaveBeenCalledWith(mockKafkaEntry);
        });

        it('should handle retry errors gracefully', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                retryCount: 1,
                status: KafkaStatusEnum.FAILED,
                eventStage: EventStageEnum.VALIDATE_DATA,
                topicName: 'test-topic',
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage();

            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(service, 'produceKafkaEvent').mockRejectedValue(new Error('Kafka error'));

            await expect(
                service.retryKafkaMessage(mockKafkaEntry, mockKafkaMessage, 'Test error')
            ).rejects.toThrow('Kafka error');
        });
    });

    describe('Message Production', () => {
        it('should produce kafka event with correct format', async () => {
            const topic = 'test-topic';
            const event = { userId: '123', email: 'test@example.com' };
            const key = 'test-key';

            // Mock the producer to avoid actual Kafka calls
            const mockProducer = {
                send: jest.fn().mockResolvedValue({}),
            };
            (service as any).producer = mockProducer;

            await service.produceKafkaEvent(topic, event, key);

            expect(mockProducer.send).toHaveBeenCalled();
        });

        it('should send message with correct format', async () => {
            const topic = 'test-topic';
            const message = { userId: '123', email: 'test@example.com' };
            const key = 'test-key';

            // Mock the producer to avoid actual Kafka calls
            const mockProducer = {
                send: jest.fn().mockResolvedValue({}),
            };
            (service as any).producer = mockProducer;

            await service.sendMessage(topic, message, key);

            expect(mockProducer.send).toHaveBeenCalled();
        });

        it('should send batch messages with correct format', async () => {
            const topic = 'test-topic';
            const messages = [
                { key: 'key1', value: { userId: '123' } },
                { key: 'key2', value: { userId: '456' } },
            ];

            // Mock the producer to avoid actual Kafka calls
            const mockProducer = {
                send: jest.fn().mockResolvedValue({}),
            };
            (service as any).producer = mockProducer;

            await service.sendBatchMessages(topic, messages);

            expect(mockProducer.send).toHaveBeenCalled();
        });

        it('should send message with partition', async () => {
            const topic = 'test-topic';
            const message = { userId: '123', email: 'test@example.com' };
            const partition = 1;
            const key = 'test-key';

            // Mock the producer to avoid actual Kafka calls
            const mockProducer = {
                send: jest.fn().mockResolvedValue({}),
            };
            (service as any).producer = mockProducer;

            await service.sendMessageWithPartition(topic, message, partition, key);

            expect(mockProducer.send).toHaveBeenCalled();
        });
    });

    describe('Graceful Shutdown', () => {
        it('should track active operations', () => {
            const initialCount = service.getActiveOperationsCount();
            expect(initialCount).toBe(0);
        });

        it('should indicate shutdown status', () => {
            const isShuttingDown = service.isShuttingDownStatus();
            expect(typeof isShuttingDown).toBe('boolean');
        });
    });

    describe('Error Handling', () => {
        it('should handle production errors', async () => {
            const topic = 'test-topic';
            const event = { userId: '123' };

            jest.spyOn(service, 'produceKafkaEvent').mockRejectedValue(new Error('Production failed'));

            await expect(service.produceKafkaEvent(topic, event)).rejects.toThrow('Production failed');
        });

        it('should handle retry message errors', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                retryCount: 1,
                status: KafkaStatusEnum.FAILED,
                eventStage: EventStageEnum.VALIDATE_DATA,
                topicName: 'test-topic',
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage();

            jest.spyOn(databaseService, 'updateEventLifecycle').mockRejectedValue(new Error('Database error'));

            await expect(
                service.retryKafkaMessage(mockKafkaEntry, mockKafkaMessage, 'Test error')
            ).rejects.toThrow('Database error');
        });
    });

    describe('Configuration Integration', () => {
        it('should use configuration service for topic names', () => {
            expect(configurationService.getKafkaConfig).toHaveBeenCalled();

            const kafkaConfig = configurationService.getKafkaConfig();
            expect(kafkaConfig.topicName).toBe('test-topic');
            expect(kafkaConfig.dlqTopicName).toBe('test-dlq-topic');
        });
    });

    describe('Message Headers', () => {
        it('should set correct headers for retry message', async () => {
            const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
                retryCount: 1,
                status: KafkaStatusEnum.FAILED,
                eventStage: EventStageEnum.VALIDATE_DATA,
                topicName: 'test-topic',
                nextRetryAt: new Date('2023-01-01T00:00:00Z'),
            });

            const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
                headers: {
                    eventStage: null,
                    retryAt: null,
                },
            });

            jest.spyOn(databaseService, 'updateEventLifecycle').mockResolvedValue(mockKafkaEntry);
            jest.spyOn(service, 'produceKafkaEvent').mockResolvedValue();

            await service.retryKafkaMessage(mockKafkaEntry, mockKafkaMessage, 'Test error');

            expect(service.produceKafkaEvent).toHaveBeenCalledWith(
                mockKafkaEntry.topicName,
                expect.objectContaining({
                    headers: expect.objectContaining({
                        eventStage: mockKafkaEntry.eventStage,
                        retryAt: mockKafkaEntry.nextRetryAt,
                    }),
                }),
                expect.any(String)
            );
        });
    });
});
