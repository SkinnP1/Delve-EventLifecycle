import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class KafkaConfigDto {
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    brokers: string[];

    @IsNotEmpty()
    @IsString()
    clientId: string;

    @IsNotEmpty()
    @IsString()
    groupId: string;

    @IsNotEmpty()
    @IsString()
    topicName: string;

    @IsNotEmpty()
    @IsString()
    autoOffsetReset: string;

    @IsNotEmpty()
    @IsNumber()
    sessionTimeout: number;

    @IsNotEmpty()
    @IsNumber()
    heartbeatInterval: number;

    @IsNotEmpty()
    @IsNumber()
    maxPollRecords: number;

    @IsNotEmpty()
    @IsBoolean()
    enableAutoCommit: boolean;

    @IsNotEmpty()
    @IsNumber()
    retryBackoff: number;

    @IsNotEmpty()
    @IsNumber()
    retryAttempts: number;

    @IsNotEmpty()
    @IsBoolean()
    sslEnabled: boolean;

    @IsNotEmpty()
    @IsString()
    saslMechanism: string;

    @IsOptional()
    @IsString()
    saslUsername?: string;

    @IsOptional()
    @IsString()
    saslPassword?: string;

    @IsNotEmpty()
    @IsString()
    securityProtocol: string;

    @IsNotEmpty()
    @IsNumber()
    consumerTimeout: number;

    @IsNotEmpty()
    @IsString()
    producerAcks: string;

    @IsNotEmpty()
    @IsNumber()
    producerRetries: number;

    @IsNotEmpty()
    @IsNumber()
    producerBatchSize: number;

    @IsNotEmpty()
    @IsNumber()
    producerLingerMs: number;

    @IsNotEmpty()
    @IsNumber()
    producerBufferMemory: number;

    @IsNotEmpty()
    @IsString()
    producerCompressionType: string;

    @IsNotEmpty()
    @IsString()
    dlqTopicName: string;
}
