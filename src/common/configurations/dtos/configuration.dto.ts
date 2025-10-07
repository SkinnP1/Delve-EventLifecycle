import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class ConfigurationDto {
    // Application Configuration
    @IsNotEmpty()
    @IsString()
    APP_NAME: string;

    @IsNotEmpty()
    @IsString()
    APP_VERSION: string;

    @IsNotEmpty()
    @IsString()
    APP_DESCRIPTION: string;

    @IsNotEmpty()
    @IsNumber()
    APP_PORT: number;

    @IsNotEmpty()
    @IsString()
    NODE_ENV: string;

    // Database Configuration
    @IsNotEmpty()
    @IsString()
    DB_HOST: string;

    @IsNotEmpty()
    @IsNumber()
    DB_PORT: number;

    @IsNotEmpty()
    @IsString()
    DB_USERNAME: string;

    @IsNotEmpty()
    @IsString()
    DB_PASSWORD: string;

    @IsNotEmpty()
    @IsString()
    DB_DATABASE: string;

    @IsOptional()
    @IsString()
    DATABASE_URL?: string;

    // API Configuration
    @IsNotEmpty()
    @IsString()
    API_PREFIX: string;

    @IsNotEmpty()
    @IsString()
    API_VERSION: string;

    @IsNotEmpty()
    @IsNumber()
    API_TIMEOUT: number;

    @IsNotEmpty()
    @IsString()
    CORS_ORIGIN: string;

    @IsNotEmpty()
    @IsNumber()
    RATE_LIMIT: number;


    // Logging Configuration
    @IsNotEmpty()
    @IsString()
    LOG_LEVEL: string;

    @IsNotEmpty()
    @IsString()
    LOG_FORMAT: string;

    @IsOptional()
    @IsString()
    LOG_FILE?: string;

    @IsOptional()
    @IsString()
    LOG_MAX_SIZE?: string;

    @IsOptional()
    @IsNumber()
    LOG_MAX_FILES?: number;


    // Kafka Configuration
    @IsNotEmpty()
    @IsString()
    KAFKA_BROKERS: string;

    @IsNotEmpty()
    @IsString()
    KAFKA_CLIENT_ID: string;

    @IsNotEmpty()
    @IsString()
    KAFKA_GROUP_ID: string;

    @IsNotEmpty()
    @IsString()
    KAFKA_TOPIC: string;

    @IsNotEmpty()
    @IsString()
    KAFKA_AUTO_OFFSET_RESET: string;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_SESSION_TIMEOUT: number;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_HEARTBEAT_INTERVAL: number;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_MAX_POLL_RECORDS: number;

    @IsNotEmpty()
    @IsBoolean()
    KAFKA_ENABLE_AUTO_COMMIT: boolean;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_RETRY_BACKOFF: number;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_RETRY_ATTEMPTS: number;

    @IsNotEmpty()
    @IsBoolean()
    KAFKA_SSL_ENABLED: boolean;

    @IsNotEmpty()
    @IsString()
    KAFKA_SASL_MECHANISM: string;

    @IsOptional()
    @IsString()
    KAFKA_SASL_USERNAME?: string;

    @IsOptional()
    @IsString()
    KAFKA_SASL_PASSWORD?: string;

    @IsNotEmpty()
    @IsString()
    KAFKA_SECURITY_PROTOCOL: string;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_CONSUMER_TIMEOUT: number;

    @IsNotEmpty()
    @IsString()
    KAFKA_PRODUCER_ACKS: string;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_PRODUCER_RETRIES: number;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_PRODUCER_BATCH_SIZE: number;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_PRODUCER_LINGER_MS: number;

    @IsNotEmpty()
    @IsNumber()
    KAFKA_PRODUCER_BUFFER_MEMORY: number;

    @IsNotEmpty()
    @IsString()
    KAFKA_PRODUCER_COMPRESSION_TYPE: string;
}