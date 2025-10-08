import { Module } from '@nestjs/common';
import { EmailService } from './external/email.service';
import { SmsService } from './external/sms.service';
import { TestRunnerService } from './external/test-runner.service';
import { AnalyticsService } from './external/analytics.service';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module';

@Module({
    imports: [CircuitBreakerModule],
    providers: [EmailService, SmsService, TestRunnerService, AnalyticsService],
    exports: [EmailService, SmsService, TestRunnerService, AnalyticsService],
})
export class ServicesModule { }
