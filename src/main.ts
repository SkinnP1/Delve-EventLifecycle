import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './common/configurations/configuration.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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

    // Start the application
    await app.listen(appConfig.port);

    console.log(`🚀 ${appConfig.name} v${appConfig.version} is running!`);
    console.log(`📍 Environment: ${appConfig.environment}`);
    console.log(`🌐 Application URL: http://localhost:${appConfig.port}`);
    console.log(`🔗 API URL: http://localhost:${appConfig.port}/${apiConfig.prefix}`);
    console.log(`📚 Swagger Docs: http://localhost:${appConfig.port}/api/docs`);
    console.log(`📝 Description: ${appConfig.description}`);
}
bootstrap();
