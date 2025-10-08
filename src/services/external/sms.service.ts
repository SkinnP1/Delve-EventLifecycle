import { Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../../common/configurations/configuration.service';
import { SmsConfigDto } from 'src/common/configurations/dtos/sms-config.dto';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly smsConfig: SmsConfigDto;

    constructor(
        private readonly configService: ConfigurationService,
        private readonly circuitBreakerService: CircuitBreakerService
    ) {
        this.smsConfig = this.configService.getSmsConfig();
    }

    async sendSms(body: any): Promise<{ success: boolean; message: string; latency: number }> {
        return this.circuitBreakerService.execute(
            'sms-service',
            async () => {
                const startTime = Date.now();

                // Get configuration from environment
                const smsFailureRate = this.smsConfig.failureRate; // Default 3%

                // Generate random latency within min/max range
                const randomLatency = Math.floor(Math.random() * (this.smsConfig.maxLatency - this.smsConfig.minLatency + 1)) + this.smsConfig.minLatency;

                // Simulate latency
                await this.delay(randomLatency);

                // Simulate failure based on failure rate
                if (Math.random() < smsFailureRate) {
                    throw new Error('SMS service failed due to configured failure rate');
                }

                const latency = Date.now() - startTime;

                this.logger.log(`SMS sent: ${JSON.stringify(body)} (${latency}ms)`);

                return {
                    success: true,
                    message: `SMS sent successfully`,
                    latency: latency
                };
            }
        );
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
