import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigurationModule } from './common/configurations/configuration.module';
import { KafkaModule } from './common/kafka/kafka.module';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { TestRunnerService } from './services/test-runner.service';
import { AnalyticsService } from './services/analytics.service';
// import { DatabaseModule } from './common/database/database.module';

@Module({
    imports: [ConfigurationModule, KafkaModule],
    controllers: [],
    providers: [AppService, EmailService, SmsService, TestRunnerService, AnalyticsService],
})
export class AppModule { }
