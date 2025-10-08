import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationModule } from '../configurations/configuration.module';
import { ConfigurationService } from '../configurations/configuration.service';
import { KafkaEntryEntity } from '../../entities/kafka-entry.entity';
import { EventLifecycleEntity } from '../../entities/event-lifecycle.entity';
import { DatabaseService } from './database.service';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigurationModule],
            useFactory: (configService: ConfigurationService) =>
                configService.getTypeOrmConfig(),
            inject: [ConfigurationService],
        }),
        TypeOrmModule.forFeature([KafkaEntryEntity, EventLifecycleEntity]),
    ],
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule { }
