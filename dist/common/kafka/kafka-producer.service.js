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
var KafkaProducerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaProducerService = void 0;
const common_1 = require("@nestjs/common");
const kafkajs_1 = require("kafkajs");
const configuration_service_1 = require("../configurations/configuration.service");
let KafkaProducerService = KafkaProducerService_1 = class KafkaProducerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(KafkaProducerService_1.name);
    }
    async onModuleInit() {
        await this.kafkaConnect();
    }
    async kafkaConnect() {
        const kafkaConfig = this.configService.getKafkaConfig();
        const producerConfig = this.configService.getKafkaProducerConfig();
        this.kafka = new kafkajs_1.Kafka({
            clientId: kafkaConfig.clientId,
            brokers: kafkaConfig.brokers,
            ssl: false,
            connectionTimeout: 5000,
            requestTimeout: 60000,
            retry: {
                initialRetryTime: 1000,
                retries: 5
            }
        });
        this.producer = this.kafka.producer({
            createPartitioner: () => {
                return (() => 0);
            }
        });
        await this.producer.connect();
        this.logger.log('Kafka producer connected successfully');
    }
    async onModuleDestroy() {
        if (this.producer) {
            await this.producer.disconnect();
            this.logger.log('Kafka producer disconnected');
        }
    }
    async produceKafkaEvent(topic, event, key) {
        try {
            const record = {
                topic,
                messages: [{
                        key,
                        value: JSON.stringify(event),
                        timestamp: Date.now().toString(),
                    }],
            };
            await this.producer.send(record);
            this.logger.log(`Kafka event produced to topic ${topic}: ${JSON.stringify(event)}`);
        }
        catch (error) {
            this.logger.error(`Failed to produce Kafka event to topic ${topic}:`, error);
            throw error;
        }
    }
    async sendMessage(topic, message, key) {
        try {
            const record = {
                topic,
                messages: [{
                        key,
                        value: JSON.stringify(message),
                        timestamp: Date.now().toString(),
                    }],
            };
            await this.producer.send(record);
            this.logger.log(`Message sent to topic ${topic}: ${JSON.stringify(message)}`);
        }
        catch (error) {
            this.logger.error(`Failed to send message to topic ${topic}:`, error);
            throw error;
        }
    }
    async sendBatchMessages(topic, messages) {
        try {
            const record = {
                topic,
                messages: messages.map(msg => ({
                    key: msg.key,
                    value: JSON.stringify(msg.value),
                    timestamp: Date.now().toString(),
                })),
            };
            await this.producer.send(record);
            this.logger.log(`Batch of ${messages.length} messages sent to topic ${topic}`);
        }
        catch (error) {
            this.logger.error(`Failed to send batch messages to topic ${topic}:`, error);
            throw error;
        }
    }
    async sendMessageWithPartition(topic, message, partition, key) {
        try {
            const record = {
                topic,
                messages: [{
                        key,
                        value: JSON.stringify(message),
                        partition,
                        timestamp: Date.now().toString(),
                    }],
            };
            await this.producer.send(record);
            this.logger.log(`Message sent to topic ${topic}, partition ${partition}: ${JSON.stringify(message)}`);
        }
        catch (error) {
            this.logger.error(`Failed to send message to topic ${topic}, partition ${partition}:`, error);
            throw error;
        }
    }
};
exports.KafkaProducerService = KafkaProducerService;
exports.KafkaProducerService = KafkaProducerService = KafkaProducerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [configuration_service_1.ConfigurationService])
], KafkaProducerService);
//# sourceMappingURL=kafka-producer.service.js.map