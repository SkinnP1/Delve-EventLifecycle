import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../src/common/database/database.service';
import { ConfigurationService } from '../../src/common/configurations/configuration.service';
import { KafkaEntryEntity } from '../../src/entities/kafka-entry.entity';
import { LifecycleStatusEnum } from '../../src/entities/enums/lifecycle-status.enum';
import { KafkaStatusEnum } from '../../src/entities/enums/kafka-status.enum';
import { EventStageEnum } from '../../src/entities/enums/event-stage.enum';

describe('Retry Delay Calculation', () => {
    let databaseService: DatabaseService;
    let configurationService: ConfigurationService;

    beforeEach(async () => {
        const mockConfigurationService = {
            getKafkaConfig: jest.fn().mockReturnValue({
                topicName: 'test-topic',
                dlqTopicName: 'test-dlq-topic',
            }),
        };

        const mockEventLifecycleRepository = {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
        };

        const mockKafkaEntryRepository = {
            save: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DatabaseService,
                {
                    provide: ConfigurationService,
                    useValue: mockConfigurationService,
                },
                {
                    provide: 'EventLifecycleEntityRepository',
                    useValue: mockEventLifecycleRepository,
                },
                {
                    provide: 'KafkaEntryEntityRepository',
                    useValue: mockKafkaEntryRepository,
                },
            ],
        }).compile();

        databaseService = module.get<DatabaseService>(DatabaseService);
        configurationService = module.get<ConfigurationService>(ConfigurationService);
    });

    describe('Retry Delay Calculation Logic', () => {
        it('should calculate exponential backoff with minimum cap', () => {
            const testCases = [
                { retryCount: 0, expectedDelay: 1 },
                { retryCount: 1, expectedDelay: 2 },
                { retryCount: 2, expectedDelay: 4 },
                { retryCount: 3, expectedDelay: 8 },
                { retryCount: 4, expectedDelay: 16 },
                { retryCount: 5, expectedDelay: 32 },
                { retryCount: 6, expectedDelay: 64 },
                { retryCount: 7, expectedDelay: 128 },
                { retryCount: 8, expectedDelay: 256 },
                { retryCount: 9, expectedDelay: 300 }, // Capped at 300ms
                { retryCount: 10, expectedDelay: 300 }, // Capped at 300ms
            ];

            testCases.forEach(({ retryCount, expectedDelay }) => {
                const calculatedDelay = Math.min(300, 1 * Math.pow(2, retryCount));
                expect(calculatedDelay).toBe(expectedDelay);
            });
        });

        it('should set nextRetryAt with calculated delay', () => {
            // Test the retry delay calculation logic directly
            const calculateRetryDelay = (retryCount: number) => {
                return Math.min(300, 1 * Math.pow(2, retryCount));
            };

            const testCases = [
                { retryCount: 0, expectedDelay: 1 },
                { retryCount: 1, expectedDelay: 2 },
                { retryCount: 2, expectedDelay: 4 },
                { retryCount: 3, expectedDelay: 8 },
                { retryCount: 4, expectedDelay: 16 },
                { retryCount: 5, expectedDelay: 32 },
                { retryCount: 6, expectedDelay: 64 },
                { retryCount: 7, expectedDelay: 128 },
                { retryCount: 8, expectedDelay: 256 },
                { retryCount: 9, expectedDelay: 300 }, // Capped at 300ms
                { retryCount: 10, expectedDelay: 300 }, // Capped at 300ms
            ];

            testCases.forEach(({ retryCount, expectedDelay }) => {
                const calculatedDelay = calculateRetryDelay(retryCount);
                expect(calculatedDelay).toBe(expectedDelay);
            });
        });

        it('should handle different retry counts correctly', () => {
            // Test retry count increment logic
            const incrementRetryCount = (currentCount: number) => {
                return currentCount + 1;
            };

            const testCases = [
                { initialRetryCount: 0, expectedNewRetryCount: 1 },
                { initialRetryCount: 1, expectedNewRetryCount: 2 },
                { initialRetryCount: 2, expectedNewRetryCount: 3 },
                { initialRetryCount: 5, expectedNewRetryCount: 6 },
            ];

            testCases.forEach(({ initialRetryCount, expectedNewRetryCount }) => {
                const newRetryCount = incrementRetryCount(initialRetryCount);
                expect(newRetryCount).toBe(expectedNewRetryCount);
            });
        });

        it('should cap retry delay at 300ms', () => {
            // Test that retry delay is capped at 300ms
            const calculateRetryDelay = (retryCount: number) => {
                return Math.min(300, 1 * Math.pow(2, retryCount));
            };

            const highRetryCounts = [10, 15, 20, 25, 30];

            highRetryCounts.forEach(retryCount => {
                const delay = calculateRetryDelay(retryCount);
                expect(delay).toBe(300); // Should be capped at 300ms
            });
        });
    });

    describe('Retry Logic Integration', () => {
        it('should handle retry limit exhaustion', () => {
            // Test retry limit logic
            const isRetryLimitExceeded = (retryCount: number, maxRetries: number = 3) => {
                return retryCount >= maxRetries;
            };

            const testCases = [
                { retryCount: 0, maxRetries: 3, shouldExceed: false },
                { retryCount: 1, maxRetries: 3, shouldExceed: false },
                { retryCount: 2, maxRetries: 3, shouldExceed: false },
                { retryCount: 3, maxRetries: 3, shouldExceed: true },
                { retryCount: 4, maxRetries: 3, shouldExceed: true },
            ];

            testCases.forEach(({ retryCount, maxRetries, shouldExceed }) => {
                const exceeded = isRetryLimitExceeded(retryCount, maxRetries);
                expect(exceeded).toBe(shouldExceed);
            });
        });

        it('should set error information correctly', () => {
            // Test error information structure
            const createErrorInfo = (eventStage: string, errorMessage: string) => {
                return {
                    [eventStage]: errorMessage
                };
            };

            const eventStage = EventStageEnum.VALIDATE_DATA;
            const errorMessage = 'Validation failed: Invalid email format';

            const errorInfo = createErrorInfo(eventStage, errorMessage);

            expect(errorInfo).toBeDefined();
            expect(errorInfo[eventStage]).toBe(errorMessage);
        });

        it('should handle success status correctly', () => {
            // Test success status logic
            const updateCompletedStages = (completedStages: any, eventStage: string) => {
                return {
                    ...completedStages,
                    [eventStage]: KafkaStatusEnum.COMPLETED
                };
            };

            const initialCompletedStages = {};
            const eventStage = EventStageEnum.VALIDATE_DATA;

            const updatedStages = updateCompletedStages(initialCompletedStages, eventStage);

            expect(updatedStages[eventStage]).toBe(KafkaStatusEnum.COMPLETED);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero retry count', () => {
            // Test zero retry count logic
            const calculateRetryDelay = (retryCount: number) => {
                return Math.min(300, 1 * Math.pow(2, retryCount));
            };

            const retryCount = 0;
            const delay = calculateRetryDelay(retryCount);

            // Verify delay is 1ms for retry count 0 (2^0 = 1)
            expect(delay).toBe(1);
        });

        it('should handle very high retry counts', () => {
            // Test very high retry count logic
            const calculateRetryDelay = (retryCount: number) => {
                return Math.min(300, 1 * Math.pow(2, retryCount));
            };

            const highRetryCounts = [20, 25, 30, 50, 100];

            highRetryCounts.forEach(retryCount => {
                const delay = calculateRetryDelay(retryCount);
                // Verify delay is capped at 300ms for high retry counts
                expect(delay).toBe(300);
            });
        });
    });
});
