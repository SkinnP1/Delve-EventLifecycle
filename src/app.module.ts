import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigurationModule } from './common/configurations/configuration.module';
import { KafkaModule } from './common/kafka/kafka.module';
// import { DatabaseModule } from './common/database/database.module';

@Module({
    imports: [ConfigurationModule, KafkaModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
