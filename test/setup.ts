import 'reflect-metadata';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.APP_NAME = 'Delve-Test';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USERNAME = 'test';
process.env.DATABASE_PASSWORD = 'test';
process.env.DATABASE_NAME = 'delve_test';
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.KAFKA_CLIENT_ID = 'delve-test';
process.env.KAFKA_TOPIC_NAME = 'delve-test-topic';
process.env.KAFKA_DLQ_TOPIC_NAME = 'delve-test-dlq-topic';

// Global test utilities
global.testUtils = {
    createMockKafkaEntry: (overrides = {}) => ({
        id: 1,
        referenceId: 'test-ref-123',
        eventId: 'test-event-123',
        status: 'QUEUE',
        retryCount: 0,
        topicName: 'test-topic',
        eventStage: 'VALIDATE_DATA',
        eventType: 'USER_CREATED',
        priority: 'NORMAL',
        createdAt: new Date(),
        updatedDate: new Date(),
        nextRetryAt: null,
        completedStages: {},
        error: null,
        data: { userId: '123', email: 'test@example.com' },
        child: null,
        parent: null,
        eventLifecycles: [],
        ...overrides,
    }),

    createMockKafkaMessage: (overrides = {}) => ({
        headers: {
            priority: 'NORMAL',
            referenceId: 'test-ref-123',
            eventType: 'USER_CREATED',
            topicName: 'test-topic',
            eventStage: null,
            retryAt: null,
        },
        data: { userId: '123', email: 'test@example.com' },
        ...overrides,
    }),

    createMockCircuitBreaker: (overrides = {}) => ({
        state: 'CLOSED',
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        consecutiveFailures: 0,
        requestHistory: [],
        config: {
            failureThreshold: 10,
            failureRateThreshold: 0.5,
            timeout: 600000,
            resetTimeout: 600000,
            monitoringPeriod: 300000,
        },
        ...overrides,
    }),
};
