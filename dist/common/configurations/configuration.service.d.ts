import { ConfigurationDto } from './dtos/configuration.dto';
import { DatabaseConfigDto } from './dtos/database-config.dto';
import { KafkaConfigDto } from './dtos/kafka-config.dto';
import { KafkaConsumerConfigDto } from './dtos/kafka-consumer-config.dto';
import { KafkaProducerConfigDto } from './dtos/kafka-producer-config.dto';
import { AppConfigDto } from './dtos/app-config.dto';
import { ApiConfigDto } from './dtos/api-config.dto';
import { LoggingConfigDto } from './dtos/logging-config.dto';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare class ConfigurationService {
    private readonly config;
    constructor();
    private initializeConfiguration;
    getConfiguration(): ConfigurationDto;
    getDatabaseConfig(): DatabaseConfigDto;
    getDatabaseConnectionString(): string;
    getKafkaConfig(): KafkaConfigDto;
    getKafkaConsumerConfig(): KafkaConsumerConfigDto;
    getKafkaProducerConfig(): KafkaProducerConfigDto;
    getAppConfig(): AppConfigDto;
    getApiConfig(): ApiConfigDto;
    getLoggingConfig(): LoggingConfigDto;
    getTypeOrmConfig(): TypeOrmModuleOptions;
    getTypeOrmConfigForMigrations(): TypeOrmModuleOptions;
    validateConfiguration(): Promise<boolean>;
}
