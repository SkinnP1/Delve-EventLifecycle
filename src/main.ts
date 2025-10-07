import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigurationService } from './common/configurations/configuration.service';

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

    // Start the application
    await app.listen(appConfig.port);

    console.log(`🚀 ${appConfig.name} v${appConfig.version} is running!`);
    console.log(`📍 Environment: ${appConfig.environment}`);
    console.log(`🌐 Application URL: http://localhost:${appConfig.port}`);
    console.log(`🔗 API URL: http://localhost:${appConfig.port}/${apiConfig.prefix}`);
    console.log(`📝 Description: ${appConfig.description}`);
}
bootstrap();
