import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../configurations/configuration.module';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { DatabaseModule } from '../database/database.module';
import { ServicesModule } from '../../services/services.module';
import { NotificationService } from '../../services/internal/notification.service';
import { TestService } from '../../services/internal/test.service';
import { UserService } from '../../services/internal/user.service';

@Module({
    imports: [ConfigurationModule, DatabaseModule, ServicesModule],
    providers: [KafkaProducerService, KafkaConsumerService, NotificationService, TestService, UserService],
    exports: [KafkaProducerService, KafkaConsumerService, NotificationService, TestService, UserService],
})
export class KafkaModule { }
