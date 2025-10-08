import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigurationModule } from './common/configurations/configuration.module';
import { KafkaModule } from './common/kafka/kafka.module';
import { DatabaseModule } from './common/database/database.module';
import { ApiModule } from './api/api.module';
import { ServicesModule } from './services/services.module';

@Module({
    imports: [ConfigurationModule, DatabaseModule, KafkaModule, ApiModule, ServicesModule],
    controllers: [],
    providers: [AppService],
})
export class AppModule { }
