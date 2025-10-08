import { Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../../common/configurations/configuration.service';
import { AnalyticsConfigDto } from 'src/common/configurations/dtos/analytics-config.dto';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);
    private readonly analyticsConfig: AnalyticsConfigDto;
    constructor(private readonly configService: ConfigurationService) {
        this.analyticsConfig = this.configService.getAnalyticsConfig();
    }

    async trackEvent(body: any): Promise<{ success: boolean; message: string; latency: number; eventId: string }> {
        const startTime = Date.now();

        try {
            // Get configuration from environment
            const analyticsFailureRate = this.analyticsConfig.failureRate; // Default 2%

            // Generate random latency within min/max range
            const randomLatency = Math.floor(Math.random() * (this.analyticsConfig.maxLatency - this.analyticsConfig.minLatency + 1)) + this.analyticsConfig.minLatency;

            // Simulate latency
            await this.delay(randomLatency);

            // Simulate failure based on failure rate
            if (Math.random() < analyticsFailureRate) {
                throw new Error('Analytics service failed due to configured failure rate');
            }

            const latency = Date.now() - startTime;
            const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


            this.logger.log(`Analytics event tracked: ${JSON.stringify(body)} (${latency}ms)`);

            return {
                success: true,
                message: `Event tracked successfully`,
                latency: latency,
                eventId: eventId
            };
        } catch (error) {
            this.logger.error(`Failed to track analytics event:`, error);
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
