"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const kafka_consumer_service_1 = require("./common/kafka/kafka-consumer.service");
const kafka_producer_service_1 = require("./common/kafka/kafka-producer.service");
const configuration_service_1 = require("./common/configurations/configuration.service");
let AppService = AppService_1 = class AppService {
    constructor(kafkaConsumer, kafkaProducer, configService) {
        this.kafkaConsumer = kafkaConsumer;
        this.kafkaProducer = kafkaProducer;
        this.configService = configService;
        this.logger = new common_1.Logger(AppService_1.name);
    }
    async onModuleInit() {
        await this.startKafkaConsumer();
    }
    async startKafkaConsumer() {
        try {
            const kafkaConfig = this.configService.getKafkaConfig();
            const topic = kafkaConfig.topicName;
            await this.kafkaConsumer.subscribeToTopic(topic, true);
            await this.kafkaConsumer.startConsuming(async (payload) => {
                this.logger.log(`Received message from topic ${payload.topic}:`, {
                    partition: payload.partition,
                    offset: payload.message.offset,
                    key: payload.message.key?.toString(),
                    value: payload.message.value?.toString(),
                });
                await this.kafkaConsumer.processMessage(payload);
            });
            this.logger.log(`Kafka consumer started and listening to topic: ${topic}`);
        }
        catch (error) {
            this.logger.error('Failed to start Kafka consumer:', error);
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = AppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [kafka_consumer_service_1.KafkaConsumerService,
        kafka_producer_service_1.KafkaProducerService,
        configuration_service_1.ConfigurationService])
], AppService);
//# sourceMappingURL=app.service.js.map