import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../configurations/configuration.module';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Module({
    imports: [ConfigurationModule],
    providers: [KafkaProducerService, KafkaConsumerService],
    exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule { }
