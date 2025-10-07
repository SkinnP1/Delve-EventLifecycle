import { Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../common/configurations/configuration.service';
import { EmailConfigDto } from 'src/common/configurations/dtos/email-config.dto';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly emailConfig: EmailConfigDto;
    constructor(private readonly configService: ConfigurationService) {
        this.emailConfig = this.configService.getEmailConfig();
    }

    async sendEmail(body: any): Promise<{ success: boolean; message: string; latency: number }> {
        const startTime = Date.now();

        try {
            // Get configuration from environment
            const emailLatency = this.emailConfig.latency; // Default 1000ms
            const emailFailureRate = this.emailConfig.failureRate; // Default 5%

            // Simulate latency
            await this.delay(emailLatency);

            // Simulate failure based on failure rate
            if (Math.random() < emailFailureRate) {
                throw new Error('Email service failed due to configured failure rate');
            }

            const latency = Date.now() - startTime;

            this.logger.log(`Email sent: ${JSON.stringify(body)} (${latency}ms)`);

            return {
                success: true,
                message: `Email sent successfully`,
                latency: latency
            };
        } catch (error) {
            this.logger.error(`Failed to send email:`, error);
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
