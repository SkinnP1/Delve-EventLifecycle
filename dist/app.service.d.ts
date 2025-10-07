import { OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from './common/kafka/kafka-consumer.service';
import { KafkaProducerService } from './common/kafka/kafka-producer.service';
import { ConfigurationService } from './common/configurations/configuration.service';
export declare class AppService implements OnModuleInit {
    private readonly kafkaConsumer;
    private readonly kafkaProducer;
    private readonly configService;
    private readonly logger;
    constructor(kafkaConsumer: KafkaConsumerService, kafkaProducer: KafkaProducerService, configService: ConfigurationService);
    onModuleInit(): Promise<void>;
    private startKafkaConsumer;
    private processKafkaMessage;
}
