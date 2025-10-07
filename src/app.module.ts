import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigurationModule } from './common/configurations/configuration.module';
import { KafkaModule } from './common/kafka/kafka.module';
import { DatabaseModule } from './common/database/database.module';
import { ApiModule } from './api/api.module';
import { EmailService } from './services/external/email.service';
import { SmsService } from './services/external/sms.service';
import { TestRunnerService } from './services/external/test-runner.service';
import { AnalyticsService } from './services/external/analytics.service';
import { NotificationService } from './services/internal/notification.service';

@Module({
    imports: [ConfigurationModule, DatabaseModule, KafkaModule, ApiModule],
    controllers: [],
    providers: [AppService, EmailService, SmsService, TestRunnerService, AnalyticsService, NotificationService],
})
export class AppModule { }
