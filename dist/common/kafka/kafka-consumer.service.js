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
var KafkaConsumerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaConsumerService = void 0;
const common_1 = require("@nestjs/common");
const kafkajs_1 = require("kafkajs");
const configuration_service_1 = require("../configurations/configuration.service");
const kafka_producer_service_1 = require("./kafka-producer.service");
const event_service_mapping_constants_1 = require("../constants/event-service-mapping.constants");
const notification_service_1 = require("../../services/internal/notification.service");
const user_service_1 = require("../../services/internal/user.service");
const test_service_1 = require("../../services/internal/test.service");
let KafkaConsumerService = KafkaConsumerService_1 = class KafkaConsumerService {
    constructor(configService, kafkaProducer, notificationService, userService, testService) {
        this.configService = configService;
        this.kafkaProducer = kafkaProducer;
        this.notificationService = notificationService;
        this.userService = userService;
        this.testService = testService;
        this.logger = new common_1.Logger(KafkaConsumerService_1.name);
    }
    async onModuleInit() {
        const kafkaConfig = this.configService.getKafkaConfig();
        const consumerConfig = this.configService.getKafkaConsumerConfig();
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
        this.consumer = this.kafka.consumer({
            groupId: consumerConfig.groupId,
            sessionTimeout: consumerConfig.sessionTimeout,
            heartbeatInterval: consumerConfig.heartbeatInterval,
            allowAutoTopicCreation: false,
        });
        await this.consumer.connect();
        this.logger.log('Kafka consumer connected successfully');
    }
    async onModuleDestroy() {
        if (this.consumer) {
            await this.consumer.disconnect();
            this.logger.log('Kafka consumer disconnected');
        }
    }
    async subscribeToTopic(topic, fromBeginning = false) {
        try {
            await this.consumer.subscribe({
                topic,
                fromBeginning,
            });
            this.logger.log(`Subscribed to topic: ${topic}`);
        }
        catch (error) {
            this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
            throw error;
        }
    }
    async startConsuming(messageHandler) {
        try {
            await this.consumer.run({
                eachMessage: async (payload) => {
                    try {
                        this.logger.debug(`Received message from topic ${payload.topic}:`, {
                            partition: payload.partition,
                            offset: payload.message.offset,
                            key: payload.message.key?.toString(),
                        });
                        await messageHandler(payload);
                    }
                    catch (error) {
                        this.logger.error(`Error processing message from topic ${payload.topic}:`, error);
                        throw error;
                    }
                },
            });
            this.logger.log('Started consuming messages');
        }
        catch (error) {
            this.logger.error('Failed to start consuming messages:', error);
            throw error;
        }
    }
    async processMessage(payload) {
        try {
            const message = JSON.parse(payload.message.value.toString());
            if (message.headers?.retryAt) {
                const currentTime = new Date();
                const retryAt = new Date(message.headers.retryAt);
                if (currentTime < retryAt) {
                    await this.kafkaProducer.produceKafkaEvent(message.headers.topicName, message, message.headers.priority + message.headers.referenceId);
                    return;
                }
            }
            const eventType = message.headers.eventType;
            const serviceName = event_service_mapping_constants_1.EVENT_SERVICE_MAPPING[eventType];
            switch (serviceName) {
                case event_service_mapping_constants_1.ServiceNameEnum.USER_SERVICE:
                    this.logger.log(`Processing USER_CREATED event: ${JSON.stringify(message)}`);
                    await this.userService.processUserMessage(message);
                    break;
                case event_service_mapping_constants_1.ServiceNameEnum.TEST_SERVICE:
                    this.logger.log(`Processing TEST_RUN event: ${JSON.stringify(message)}`);
                    await this.testService.processTestMessage(message);
                    break;
                case event_service_mapping_constants_1.ServiceNameEnum.NOTIFICATION_SERVICE:
                    this.logger.log(`Processing notification event: ${JSON.stringify(message)}`);
                    await this.notificationService.processNotificationMessage(message);
                    break;
                default:
                    this.logger.warn(`No handler for service: ${serviceName}`);
                    break;
            }
        }
        catch (error) {
            this.logger.error(`Error processing message from topic ${payload.topic}:`, error);
        }
    }
};
exports.KafkaConsumerService = KafkaConsumerService;
exports.KafkaConsumerService = KafkaConsumerService = KafkaConsumerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [configuration_service_1.ConfigurationService,
        kafka_producer_service_1.KafkaProducerService,
        notification_service_1.NotificationService,
        user_service_1.UserService,
        test_service_1.TestService])
], KafkaConsumerService);
//# sourceMappingURL=kafka-consumer.service.js.map