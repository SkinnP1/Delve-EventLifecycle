import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { KafkaModule } from 'src/common/kafka/kafka.module';
import { DatabaseModule } from 'src/common/database/database.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([KafkaEntryEntity]),
        KafkaModule,
        DatabaseModule
    ],
    controllers: [ApiController],
    providers: [ApiService],
    exports: [ApiService]
})
export class ApiModule { }
