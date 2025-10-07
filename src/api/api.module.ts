import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { KafkaProducerService } from 'src/common/kafka/kafka-producer.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([KafkaEntryEntity])
    ],
    controllers: [ApiController],
    providers: [ApiService, KafkaProducerService],
    exports: [ApiService]
})
export class ApiModule { }
