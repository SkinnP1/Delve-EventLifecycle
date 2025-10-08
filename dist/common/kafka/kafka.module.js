"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaModule = void 0;
const common_1 = require("@nestjs/common");
const configuration_module_1 = require("../configurations/configuration.module");
const kafka_producer_service_1 = require("./kafka-producer.service");
const kafka_consumer_service_1 = require("./kafka-consumer.service");
const database_module_1 = require("../database/database.module");
const services_module_1 = require("../../services/services.module");
const notification_service_1 = require("../../services/internal/notification.service");
const test_service_1 = require("../../services/internal/test.service");
const user_service_1 = require("../../services/internal/user.service");
let KafkaModule = class KafkaModule {
};
exports.KafkaModule = KafkaModule;
exports.KafkaModule = KafkaModule = __decorate([
    (0, common_1.Module)({
        imports: [configuration_module_1.ConfigurationModule, database_module_1.DatabaseModule, services_module_1.ServicesModule],
        providers: [kafka_producer_service_1.KafkaProducerService, kafka_consumer_service_1.KafkaConsumerService, notification_service_1.NotificationService, test_service_1.TestService, user_service_1.UserService],
        exports: [kafka_producer_service_1.KafkaProducerService, kafka_consumer_service_1.KafkaConsumerService, notification_service_1.NotificationService, test_service_1.TestService, user_service_1.UserService],
    })
], KafkaModule);
//# sourceMappingURL=kafka.module.js.map