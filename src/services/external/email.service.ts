import { Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../../common/configurations/configuration.service';
import { EmailConfigDto } from 'src/common/configurations/dtos/email-config.dto';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly emailConfig: EmailConfigDto;
    constructor(
        private readonly configService: ConfigurationService,
        private readonly circuitBreakerService: CircuitBreakerService
    ) {
        this.emailConfig = this.configService.getEmailConfig();
    }

    async sendEmail(body: any): Promise<{ success: boolean; message: string; latency: number }> {
        return this.circuitBreakerService.execute(
            'email-service',
            async () => {
                const startTime = Date.now();

                // Get configuration from environment
                const emailFailureRate = this.emailConfig.failureRate; // Default 5%

                // Generate random latency within min/max range
                const randomLatency = Math.floor(Math.random() * (this.emailConfig.maxLatency - this.emailConfig.minLatency + 1)) + this.emailConfig.minLatency;

                // Simulate latency
                await this.delay(randomLatency);

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
            }
        );
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
