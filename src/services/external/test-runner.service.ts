import { Injectable, Logger } from '@nestjs/common';
import { ConfigurationService } from '../../common/configurations/configuration.service';
import { TestRunnerConfigDto } from 'src/common/configurations/dtos/test-runner-config.dto';

@Injectable()
export class TestRunnerService {
    private readonly logger = new Logger(TestRunnerService.name);
    private readonly testRunnerConfig: TestRunnerConfigDto;

    constructor(private readonly configService: ConfigurationService) {
        this.testRunnerConfig = this.configService.getTestRunnerConfig();
    }

    async runTests(body: any): Promise<{ success: boolean; message: string; latency: number; results: any }> {
        const startTime = Date.now();

        try {
            // Get configuration from environment
            const testFailureRate = this.testRunnerConfig.failureRate; // Default 10%

            // Generate random latency within min/max range
            const randomLatency = Math.floor(Math.random() * (this.testRunnerConfig.maxLatency - this.testRunnerConfig.minLatency + 1)) + this.testRunnerConfig.minLatency;

            // Simulate latency
            await this.delay(randomLatency);

            // Simulate failure based on failure rate
            if (Math.random() < testFailureRate) {
                throw new Error('Test runner failed due to configured failure rate');
            }

            const latency = Date.now() - startTime;

            // Simulate test results
            const results = {
                suite: body.testSuite || 'default',
                totalTests: Math.floor(Math.random() * 50) + 10,
                passed: Math.floor(Math.random() * 40) + 5,
                failed: Math.floor(Math.random() * 10),
                duration: latency,
                timestamp: new Date().toISOString()
            };

            this.logger.log(`Tests completed: ${JSON.stringify(body)} - ${results.passed}/${results.totalTests} passed (${latency}ms)`);

            return {
                success: true,
                message: `Test suite completed`,
                latency: latency,
                results: results
            };
        } catch (error) {
            this.logger.error(`Failed to run tests:`, error);
            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
