"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const configuration_service_1 = require("./common/configurations/configuration.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(configuration_service_1.ConfigurationService);
    const appConfig = configService.getAppConfig();
    const apiConfig = configService.getApiConfig();
    app.setGlobalPrefix(apiConfig.prefix);
    app.enableCors({
        origin: apiConfig.corsOrigin === '*' ? true : apiConfig.corsOrigin,
        credentials: true,
    });
    await app.listen(appConfig.port);
    console.log(`🚀 ${appConfig.name} v${appConfig.version} is running!`);
    console.log(`📍 Environment: ${appConfig.environment}`);
    console.log(`🌐 Application URL: http://localhost:${appConfig.port}`);
    console.log(`🔗 API URL: http://localhost:${appConfig.port}/${apiConfig.prefix}`);
    console.log(`📝 Description: ${appConfig.description}`);
}
bootstrap();
//# sourceMappingURL=main.js.map