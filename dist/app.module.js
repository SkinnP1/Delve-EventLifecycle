"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const configuration_module_1 = require("./common/configurations/configuration.module");
const kafka_module_1 = require("./common/kafka/kafka.module");
const api_module_1 = require("./api/api.module");
const email_service_1 = require("./services/email.service");
const sms_service_1 = require("./services/sms.service");
const test_runner_service_1 = require("./services/test-runner.service");
const analytics_service_1 = require("./services/analytics.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [configuration_module_1.ConfigurationModule, kafka_module_1.KafkaModule, api_module_1.ApiModule],
        controllers: [],
        providers: [app_service_1.AppService, email_service_1.EmailService, sms_service_1.SmsService, test_runner_service_1.TestRunnerService, analytics_service_1.AnalyticsService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map