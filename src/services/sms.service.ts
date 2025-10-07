import { Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../common/configurations/configuration.service';
import { SmsConfigDto } from 'src/common/configurations/dtos/sms-config.dto';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly smsConfig: SmsConfigDto;

    constructor(private readonly configService: ConfigurationService) {
        this.smsConfig = this.configService.getSmsConfig();
    }

    async sendSms(body: any): Promise<{ success: boolean; message: string; latency: number }> {
        const startTime = Date.now();

        try {
            // Get configuration from environment
            const smsLatency = this.smsConfig.latency; // Default 350ms
            const smsFailureRate = this.smsConfig.failureRate; // Default 3%

            // Simulate latency
            await this.delay(smsLatency);

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
        } catch (error) {
            this.logger.error(`Failed to send SMS:`, error);
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
