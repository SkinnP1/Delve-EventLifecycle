"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const configuration_service_1 = require("./common/configurations/configuration.service");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const kafka_consumer_service_1 = require("./common/kafka/kafka-consumer.service");
const kafka_producer_service_1 = require("./common/kafka/kafka-producer.service");
let isShuttingDown = false;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger('Bootstrap');
    const configService = app.get(configuration_service_1.ConfigurationService);
    const appConfig = configService.getAppConfig();
    const apiConfig = configService.getApiConfig();
    app.setGlobalPrefix(apiConfig.prefix);
    app.enableCors({
        origin: apiConfig.corsOrigin === '*' ? true : apiConfig.corsOrigin,
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Delve API')
        .setDescription('A simple NestJS application for Delve')
        .setVersion('1.0')
        .addTag('API')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(appConfig.port);
    console.log(`🚀 ${appConfig.name} v${appConfig.version} is running!`);
    console.log(`📍 Environment: ${appConfig.environment}`);
    console.log(`🌐 Application URL: http://localhost:${appConfig.port}`);
    console.log(`🔗 API URL: http://localhost:${appConfig.port}/${apiConfig.prefix}`);
    console.log(`📚 Swagger Docs: http://localhost:${appConfig.port}/api/docs`);
    console.log(`📝 Description: ${appConfig.description}`);
    process.on('SIGTERM', async () => {
        if (isShuttingDown) {
            logger.warn('Shutdown already in progress, ignoring SIGTERM');
            return;
        }
        logger.log('SIGTERM received, starting graceful shutdown...');
        await gracefulShutdown(app, logger);
    });
    process.on('SIGINT', async () => {
        if (isShuttingDown) {
            logger.warn('Shutdown already in progress, ignoring SIGINT');
            return;
        }
        logger.log('SIGINT received, starting graceful shutdown...');
        await gracefulShutdown(app, logger);
    });
    process.on('SIGHUP', async () => {
        if (isShuttingDown) {
            logger.warn('Shutdown already in progress, ignoring SIGHUP');
            return;
        }
        logger.log('SIGHUP received, starting graceful shutdown...');
        await gracefulShutdown(app, logger);
    });
}
async function gracefulShutdown(app, logger) {
    if (isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring duplicate request');
        return;
    }
    isShuttingDown = true;
    try {
        logger.log('Graceful shutdown initiated...');
        const kafkaConsumer = app.get(kafka_consumer_service_1.KafkaConsumerService);
        const kafkaProducer = app.get(kafka_producer_service_1.KafkaProducerService);
        const consumerActiveOps = kafkaConsumer.getActiveOperationsCount();
        const producerActiveOps = kafkaProducer.getActiveOperationsCount();
        logger.log(`Initial status - Consumer operations: ${consumerActiveOps}, Producer operations: ${producerActiveOps}`);
        const shutdownPromises = [
            kafkaConsumer.gracefulShutdown(),
            kafkaProducer.gracefulShutdown()
        ];
        await Promise.allSettled(shutdownPromises);
        const finalConsumerOps = kafkaConsumer.getActiveOperationsCount();
        const finalProducerOps = kafkaProducer.getActiveOperationsCount();
        logger.log(`Final status - Consumer operations: ${finalConsumerOps}, Producer operations: ${finalProducerOps}`);
        if (finalConsumerOps > 0 || finalProducerOps > 0) {
            logger.warn(`Some operations may not have completed gracefully`);
        }
        logger.log('Closing application...');
        await app.close();
        logger.log('Application closed successfully');
        process.exit(0);
    }
    catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map