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
const database_service_1 = require("../database/database.service");
const lifecycle_status_enum_1 = require("../../entities/enums/lifecycle-status.enum");
const kafka_status_enum_1 = require("../../entities/enums/kafka-status.enum");
let KafkaProducerService = KafkaProducerService_1 = class KafkaProducerService {
    constructor(configService, databaseService) {
        this.configService = configService;
        this.databaseService = databaseService;
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
    async sendRecord(record, logMessage, errorMessage) {
        try {
            await this.producer.send(record);
            this.logger.log(logMessage);
        }
        catch (error) {
            this.logger.error(errorMessage, error);
            throw error;
        }
    }
    async produceKafkaEvent(topic, event, key) {
        const record = {
            topic,
            messages: [{
                    key,
                    value: JSON.stringify(event),
                    timestamp: Date.now().toString(),
                }],
        };
        await this.sendRecord(record, `Kafka event produced to topic ${topic}: ${JSON.stringify(event)}`, `Failed to produce Kafka event to topic ${topic}:`);
    }
    async sendMessage(topic, message, key) {
        const record = {
            topic,
            messages: [{
                    key,
                    value: JSON.stringify(message),
                    timestamp: Date.now().toString(),
                }],
        };
        await this.sendRecord(record, `Message sent to topic ${topic}: ${JSON.stringify(message)}`, `Failed to send message to topic ${topic}:`);
    }
    async sendBatchMessages(topic, messages) {
        const record = {
            topic,
            messages: messages.map(msg => ({
                key: msg.key,
                value: JSON.stringify(msg.value),
                timestamp: Date.now().toString(),
            })),
        };
        await this.sendRecord(record, `Batch of ${messages.length} messages sent to topic ${topic}`, `Failed to send batch messages to topic ${topic}:`);
    }
    async sendMessageWithPartition(topic, message, partition, key) {
        const record = {
            topic,
            messages: [{
                    key,
                    value: JSON.stringify(message),
                    partition,
                    timestamp: Date.now().toString(),
                }],
        };
        await this.sendRecord(record, `Message sent to topic ${topic}, partition ${partition}: ${JSON.stringify(message)}`, `Failed to send message to topic ${topic}, partition ${partition}:`);
    }
    async retryKafkaMessage(kafkaEntry, kafkaMessage, errorMessage) {
        try {
            await this.databaseService.updateEventLifecycle(kafkaEntry, lifecycle_status_enum_1.LifecycleStatusEnum.FAIL, errorMessage);
            if (kafkaEntry.retryCount === 3 && kafkaEntry.status === kafka_status_enum_1.KafkaStatusEnum.FAILED) {
                this.logger.warn(`Retry limit exhausted for kafka entry ${kafkaEntry.id}. Moving to DLQ.`);
                return;
            }
            kafkaMessage.headers.eventStage = kafkaEntry.eventStage;
            kafkaMessage.headers.retryAt = kafkaEntry.nextRetryAt;
            console.log(kafkaEntry, kafkaMessage);
            await this.produceKafkaEvent(kafkaEntry.topicName, kafkaMessage, kafkaEntry.priority + kafkaEntry.referenceId);
        }
        catch (error) {
            this.logger.error(`Failed to retry kafka message for entry ${kafkaEntry.id}:`, error);
            throw error;
        }
    }
};
exports.KafkaProducerService = KafkaProducerService;
exports.KafkaProducerService = KafkaProducerService = KafkaProducerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [configuration_service_1.ConfigurationService,
        database_service_1.DatabaseService])
], KafkaProducerService);
//# sourceMappingURL=kafka-producer.service.js.map