"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const configuration_dto_1 = require("./dtos/configuration.dto");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const kafka_entry_entity_1 = require("../../entities/kafka-entry.entity");
const event_lifecycle_entity_1 = require("../../entities/event-lifecycle.entity");
let ConfigurationService = class ConfigurationService {
    constructor() {
        this.config = this.initializeConfiguration();
    }
    initializeConfiguration() {
        const configData = {
            APP_NAME: process.env.APP_NAME || 'Delve',
            APP_VERSION: process.env.APP_VERSION || '1.0.0',
            APP_DESCRIPTION: process.env.APP_DESCRIPTION || 'A simple NestJS application called Delve',
            APP_PORT: parseInt(process.env.APP_PORT || process.env.PORT || '3000'),
            NODE_ENV: process.env.NODE_ENV || 'development',
            DB_HOST: process.env.DB_HOST || 'localhost',
            DB_PORT: parseInt(process.env.DB_PORT || '5432'),
            DB_USERNAME: process.env.DB_USERNAME || 'postgres',
            DB_PASSWORD: process.env.DB_PASSWORD || 'password',
            DB_DATABASE: process.env.DB_DATABASE || 'delve_db',
            DATABASE_URL: process.env.DATABASE_URL,
            API_PREFIX: process.env.API_PREFIX || 'api',
            API_VERSION: process.env.API_VERSION || 'v1',
            API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
            CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
            RATE_LIMIT: parseInt(process.env.RATE_LIMIT || '100'),
            LOG_LEVEL: process.env.LOG_LEVEL || 'info',
            LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
            LOG_FILE: process.env.LOG_FILE,
            LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '10m',
            LOG_MAX_FILES: parseInt(process.env.LOG_MAX_FILES || '5'),
            KAFKA_BROKERS: process.env.KAFKA_BROKERS || 'localhost:9092',
            KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'delve-app',
            KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'delve-group',
            KAFKA_TOPIC: process.env.KAFKA_TOPIC || 'delve-kafka-topic',
            KAFKA_AUTO_OFFSET_RESET: process.env.KAFKA_AUTO_OFFSET_RESET || 'earliest',
            KAFKA_SESSION_TIMEOUT: parseInt(process.env.KAFKA_SESSION_TIMEOUT || '30000'),
            KAFKA_HEARTBEAT_INTERVAL: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL || '3000'),
            KAFKA_MAX_POLL_RECORDS: parseInt(process.env.KAFKA_MAX_POLL_RECORDS || '500'),
            KAFKA_ENABLE_AUTO_COMMIT: process.env.KAFKA_ENABLE_AUTO_COMMIT === 'true',
            KAFKA_RETRY_BACKOFF: parseInt(process.env.KAFKA_RETRY_BACKOFF || '100'),
            KAFKA_RETRY_ATTEMPTS: parseInt(process.env.KAFKA_RETRY_ATTEMPTS || '3'),
            KAFKA_SSL_ENABLED: process.env.KAFKA_SSL_ENABLED === 'true',
            KAFKA_SASL_MECHANISM: process.env.KAFKA_SASL_MECHANISM || 'PLAIN',
            KAFKA_SASL_USERNAME: process.env.KAFKA_SASL_USERNAME,
            KAFKA_SASL_PASSWORD: process.env.KAFKA_SASL_PASSWORD,
            KAFKA_SECURITY_PROTOCOL: process.env.KAFKA_SECURITY_PROTOCOL || 'PLAINTEXT',
            KAFKA_CONSUMER_TIMEOUT: parseInt(process.env.KAFKA_CONSUMER_TIMEOUT || '30000'),
            KAFKA_PRODUCER_ACKS: process.env.KAFKA_PRODUCER_ACKS || 'all',
            KAFKA_PRODUCER_RETRIES: parseInt(process.env.KAFKA_PRODUCER_RETRIES || '3'),
            KAFKA_PRODUCER_BATCH_SIZE: parseInt(process.env.KAFKA_PRODUCER_BATCH_SIZE || '16384'),
            KAFKA_PRODUCER_LINGER_MS: parseInt(process.env.KAFKA_PRODUCER_LINGER_MS || '5'),
            KAFKA_PRODUCER_BUFFER_MEMORY: parseInt(process.env.KAFKA_PRODUCER_BUFFER_MEMORY || '33554432'),
            KAFKA_PRODUCER_COMPRESSION_TYPE: process.env.KAFKA_PRODUCER_COMPRESSION_TYPE || 'none',
            ANALYTICS_MIN_LATENCY: parseInt(process.env.ANALYTICS_MIN_LATENCY || '100'),
            ANALYTICS_MAX_LATENCY: parseInt(process.env.ANALYTICS_MAX_LATENCY || '300'),
            ANALYTICS_FAILURE_RATE: parseFloat(process.env.ANALYTICS_FAILURE_RATE || '0.02'),
            EMAIL_MIN_LATENCY: parseInt(process.env.EMAIL_MIN_LATENCY || '800'),
            EMAIL_MAX_LATENCY: parseInt(process.env.EMAIL_MAX_LATENCY || '1200'),
            EMAIL_FAILURE_RATE: parseFloat(process.env.EMAIL_FAILURE_RATE || '0.05'),
            SMS_MIN_LATENCY: parseInt(process.env.SMS_MIN_LATENCY || '200'),
            SMS_MAX_LATENCY: parseInt(process.env.SMS_MAX_LATENCY || '500'),
            SMS_FAILURE_RATE: parseFloat(process.env.SMS_FAILURE_RATE || '0.03'),
            TEST_RUNNER_MIN_LATENCY: parseInt(process.env.TEST_RUNNER_MIN_LATENCY || '1000'),
            TEST_RUNNER_MAX_LATENCY: parseInt(process.env.TEST_RUNNER_MAX_LATENCY || '3000'),
            TEST_RUNNER_FAILURE_RATE: parseFloat(process.env.TEST_RUNNER_FAILURE_RATE || '0.1'),
        };
        return (0, class_transformer_1.plainToClass)(configuration_dto_1.ConfigurationDto, configData);
    }
    getConfiguration() {
        return this.config;
    }
    getDatabaseConfig() {
        return {
            host: this.config.DB_HOST,
            port: this.config.DB_PORT,
            username: this.config.DB_USERNAME,
            password: this.config.DB_PASSWORD,
            database: this.config.DB_DATABASE,
            url: this.config.DATABASE_URL,
        };
    }
    getDatabaseConnectionString() {
        if (this.config.DATABASE_URL) {
            return this.config.DATABASE_URL;
        }
        return `postgresql://${this.config.DB_USERNAME}:${this.config.DB_PASSWORD}@${this.config.DB_HOST}:${this.config.DB_PORT}/${this.config.DB_DATABASE}`;
    }
    getKafkaConfig() {
        return {
            brokers: this.config.KAFKA_BROKERS.split(','),
            clientId: this.config.KAFKA_CLIENT_ID,
            groupId: this.config.KAFKA_GROUP_ID,
            topicName: this.config.KAFKA_TOPIC,
            autoOffsetReset: this.config.KAFKA_AUTO_OFFSET_RESET,
            sessionTimeout: this.config.KAFKA_SESSION_TIMEOUT,
            heartbeatInterval: this.config.KAFKA_HEARTBEAT_INTERVAL,
            maxPollRecords: this.config.KAFKA_MAX_POLL_RECORDS,
            enableAutoCommit: this.config.KAFKA_ENABLE_AUTO_COMMIT,
            retryBackoff: this.config.KAFKA_RETRY_BACKOFF,
            retryAttempts: this.config.KAFKA_RETRY_ATTEMPTS,
            sslEnabled: this.config.KAFKA_SSL_ENABLED,
            saslMechanism: this.config.KAFKA_SASL_MECHANISM,
            saslUsername: this.config.KAFKA_SASL_USERNAME,
            saslPassword: this.config.KAFKA_SASL_PASSWORD,
            securityProtocol: this.config.KAFKA_SECURITY_PROTOCOL,
            consumerTimeout: this.config.KAFKA_CONSUMER_TIMEOUT,
            producerAcks: this.config.KAFKA_PRODUCER_ACKS,
            producerRetries: this.config.KAFKA_PRODUCER_RETRIES,
            producerBatchSize: this.config.KAFKA_PRODUCER_BATCH_SIZE,
            producerLingerMs: this.config.KAFKA_PRODUCER_LINGER_MS,
            producerBufferMemory: this.config.KAFKA_PRODUCER_BUFFER_MEMORY,
            producerCompressionType: this.config.KAFKA_PRODUCER_COMPRESSION_TYPE,
        };
    }
    getKafkaConsumerConfig() {
        return {
            groupId: this.config.KAFKA_GROUP_ID,
            autoOffsetReset: this.config.KAFKA_AUTO_OFFSET_RESET,
            sessionTimeout: this.config.KAFKA_SESSION_TIMEOUT,
            heartbeatInterval: this.config.KAFKA_HEARTBEAT_INTERVAL,
            maxPollRecords: this.config.KAFKA_MAX_POLL_RECORDS,
            enableAutoCommit: this.config.KAFKA_ENABLE_AUTO_COMMIT,
            consumerTimeout: this.config.KAFKA_CONSUMER_TIMEOUT,
        };
    }
    getKafkaProducerConfig() {
        return {
            acks: this.config.KAFKA_PRODUCER_ACKS,
            retries: this.config.KAFKA_PRODUCER_RETRIES,
            batchSize: this.config.KAFKA_PRODUCER_BATCH_SIZE,
            lingerMs: this.config.KAFKA_PRODUCER_LINGER_MS,
            bufferMemory: this.config.KAFKA_PRODUCER_BUFFER_MEMORY,
            compressionType: this.config.KAFKA_PRODUCER_COMPRESSION_TYPE,
        };
    }
    getAppConfig() {
        return {
            name: this.config.APP_NAME,
            version: this.config.APP_VERSION,
            description: this.config.APP_DESCRIPTION,
            port: this.config.APP_PORT,
            environment: this.config.NODE_ENV,
        };
    }
    getApiConfig() {
        return {
            prefix: this.config.API_PREFIX,
            version: this.config.API_VERSION,
            timeout: this.config.API_TIMEOUT,
            corsOrigin: this.config.CORS_ORIGIN,
            rateLimit: this.config.RATE_LIMIT,
        };
    }
    getLoggingConfig() {
        return {
            level: this.config.LOG_LEVEL,
            format: this.config.LOG_FORMAT,
            file: this.config.LOG_FILE,
            maxSize: this.config.LOG_MAX_SIZE,
            maxFiles: this.config.LOG_MAX_FILES,
        };
    }
    getTypeOrmConfig() {
        const dbConfig = this.getDatabaseConfig();
        return {
            type: 'postgres',
            host: dbConfig.host,
            port: dbConfig.port,
            username: dbConfig.username,
            password: dbConfig.password,
            database: dbConfig.database,
            url: dbConfig.url,
            entities: [
                kafka_entry_entity_1.KafkaEntryEntity,
                event_lifecycle_entity_1.EventLifecycleEntity,
            ],
            migrations: [__dirname + '/../**/migrations/*{.ts,.js}'],
            synchronize: this.config.NODE_ENV === 'development',
            logging: false,
            ssl: this.config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            extra: {
                connectionLimit: 10,
                acquireTimeoutMillis: 60000,
                timeout: 60000,
            },
        };
    }
    async validateConfiguration() {
        const errors = await (0, class_validator_1.validate)(this.config);
        return errors.length === 0;
    }
    getAnalyticsConfig() {
        return {
            failureRate: this.config.ANALYTICS_FAILURE_RATE,
            minLatency: this.config.ANALYTICS_MIN_LATENCY,
            maxLatency: this.config.ANALYTICS_MAX_LATENCY,
        };
    }
    getEmailConfig() {
        return {
            failureRate: this.config.EMAIL_FAILURE_RATE,
            minLatency: this.config.EMAIL_MIN_LATENCY,
            maxLatency: this.config.EMAIL_MAX_LATENCY,
        };
    }
    getSmsConfig() {
        return {
            failureRate: this.config.SMS_FAILURE_RATE,
            minLatency: this.config.SMS_MIN_LATENCY,
            maxLatency: this.config.SMS_MAX_LATENCY,
        };
    }
    getTestRunnerConfig() {
        return {
            failureRate: this.config.TEST_RUNNER_FAILURE_RATE,
            minLatency: this.config.TEST_RUNNER_MIN_LATENCY,
            maxLatency: this.config.TEST_RUNNER_MAX_LATENCY,
        };
    }
};
exports.ConfigurationService = ConfigurationService;
exports.ConfigurationService = ConfigurationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ConfigurationService);
//# sourceMappingURL=configuration.service.js.map