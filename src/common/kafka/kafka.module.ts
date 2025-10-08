import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../configurations/configuration.module';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationService } from '../../services/internal/notification.service';

@Module({
    imports: [ConfigurationModule, DatabaseModule],
    providers: [KafkaProducerService, KafkaConsumerService, NotificationService],
    exports: [KafkaProducerService, KafkaConsumerService, NotificationService],
})
export class KafkaModule { }
