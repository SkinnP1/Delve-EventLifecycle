import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { KafkaModule } from 'src/common/kafka/kafka.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([KafkaEntryEntity]),
        KafkaModule
    ],
    controllers: [ApiController],
    providers: [ApiService],
    exports: [ApiService]
})
export class ApiModule { }
