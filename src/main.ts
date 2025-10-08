import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './common/configurations/configuration.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { KafkaConsumerService } from './common/kafka/kafka-consumer.service';
import { KafkaProducerService } from './common/kafka/kafka-producer.service';

let isShuttingDown = false;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    // Get configuration service
    const configService = app.get(ConfigurationService);

    // Get application and API configuration
    const appConfig = configService.getAppConfig();
    const apiConfig = configService.getApiConfig();

    // Set global prefix
    app.setGlobalPrefix(apiConfig.prefix);

    // Enable CORS
    app.enableCors({
        origin: apiConfig.corsOrigin === '*' ? true : apiConfig.corsOrigin,
        credentials: true,
    });

    // Setup Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('Delve API')
        .setDescription('A simple NestJS application for Delve')
        .setVersion('1.0')
        .addTag('API')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Note: We handle graceful shutdown manually to avoid conflicts with database connections

    // Start the application
    await app.listen(appConfig.port);

    console.log(`🚀 ${appConfig.name} v${appConfig.version} is running!`);
    console.log(`📍 Environment: ${appConfig.environment}`);
    console.log(`🌐 Application URL: http://localhost:${appConfig.port}`);
    console.log(`🔗 API URL: http://localhost:${appConfig.port}/${apiConfig.prefix}`);
    console.log(`📚 Swagger Docs: http://localhost:${appConfig.port}/api/docs`);
    console.log(`📝 Description: ${appConfig.description}`);

    // Handle graceful shutdown
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

async function gracefulShutdown(app: any, logger: Logger) {
    if (isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring duplicate request');
        return;
    }

    isShuttingDown = true;

    try {
        logger.log('Graceful shutdown initiated...');

        // Get Kafka services
        const kafkaConsumer = app.get(KafkaConsumerService);
        const kafkaProducer = app.get(KafkaProducerService);

        // Get initial status
        const consumerActiveOps = kafkaConsumer.getActiveOperationsCount();
        const producerActiveOps = kafkaProducer.getActiveOperationsCount();

        logger.log(`Initial status - Consumer operations: ${consumerActiveOps}, Producer operations: ${producerActiveOps}`);

        // Start graceful shutdown of both services in parallel
        const shutdownPromises = [
            kafkaConsumer.gracefulShutdown(),
            kafkaProducer.gracefulShutdown()
        ];

        // Wait for both services to complete graceful shutdown
        await Promise.allSettled(shutdownPromises);

        // Final status check
        const finalConsumerOps = kafkaConsumer.getActiveOperationsCount();
        const finalProducerOps = kafkaProducer.getActiveOperationsCount();

        logger.log(`Final status - Consumer operations: ${finalConsumerOps}, Producer operations: ${finalProducerOps}`);

        if (finalConsumerOps > 0 || finalProducerOps > 0) {
            logger.warn(`Some operations may not have completed gracefully`);
        }

        logger.log('Closing application...');

        // Close the application - this will handle database connections properly
        await app.close();

        logger.log('Application closed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}

bootstrap();
