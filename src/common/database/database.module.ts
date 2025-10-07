import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationModule } from '../configurations/configuration.module';
import { ConfigurationService } from '../configurations/configuration.service';
import { KafkaEntry } from '../../entities/kafka-entry.entity';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigurationModule],
            useFactory: (configService: ConfigurationService) =>
                configService.getTypeOrmConfig(),
            inject: [ConfigurationService],
        }),
        TypeOrmModule.forFeature([KafkaEntry]),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule { }
