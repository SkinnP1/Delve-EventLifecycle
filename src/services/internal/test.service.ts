import { Injectable, Logger } from '@nestjs/common';
import { KafkaMessageDto } from 'src/api/dto/kafka-message.dto';
import { EventStageEnum } from 'src/entities/enums/event-stage.enum';
import { EventTypeEnum } from 'src/entities/enums/event-type.enum';
import { DatabaseService } from 'src/common/database/database.service';
import { LifecycleStatusEnum } from 'src/entities/enums/lifecycle-status.enum';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';
import { KafkaProducerService } from 'src/common/kafka/kafka-producer.service';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { EmailService } from '../external/email.service';
import { TestRunnerService } from '../external/test-runner.service';

@Injectable()
export class TestService {
    private readonly logger = new Logger(TestService.name);

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly kafkaProducerService: KafkaProducerService,
        private readonly emailService: EmailService,
        private readonly testRunnerService: TestRunnerService
    ) { }

    /**
     * Process test message from Kafka
     * @param kafkaMessage - The Kafka message containing test data
     */
    async processTestMessage(kafkaMessage: KafkaMessageDto): Promise<void> {
        try {
            const { headers, data } = kafkaMessage;
            const eventType = headers.eventType;
            switch (eventType) {
                case EventTypeEnum.TEST_RUN:
                    await this.processTestRun(kafkaMessage);
                    break;
                case EventTypeEnum.TEST_FAILED:
                    await this.processTestFailed(kafkaMessage);
                    break;
                default:
                    this.logger.warn(`Unsupported test event type: ${eventType}`);
                    break;
            }
        } catch (error) {
            this.logger.error('Error processing test message:', error);
            throw error;
        }
    }

    /**
     * Process test run event
     * @param kafkaMessage - Test run data
     */
    private async processTestRun(kafkaMessage: KafkaMessageDto): Promise<void> {
        const { headers, data } = kafkaMessage;
        const kafkaEntry = await this.databaseService.getKafkaEntryByReferenceId(kafkaMessage.headers.referenceId);
        const eventStage = headers?.eventStage;
        try {
            if (!eventStage) {
                await this.parseConfig(kafkaEntry, kafkaMessage);
                await this.executeTests(kafkaEntry, kafkaMessage);
                await this.generateReport(kafkaEntry, kafkaMessage);
                await this.storeResults(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.EXECUTE_TESTS) {
                await this.executeTests(kafkaEntry, kafkaMessage);
                await this.generateReport(kafkaEntry, kafkaMessage);
                await this.storeResults(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.GENERATE_REPORT) {
                await this.generateReport(kafkaEntry, kafkaMessage);
                await this.storeResults(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.STORE_RESULTS) {
                await this.storeResults(kafkaEntry, kafkaMessage);
            }
            await this.databaseService.markKafkaEntrySuccess(kafkaEntry);

        } catch (error) {
            this.logger.error('Error processing test run:', error);
        }
    }

    /**
     * Process test failed event
     * @param kafkaMessage - Test failed data
     */
    private async processTestFailed(kafkaMessage: KafkaMessageDto): Promise<void> {
        const { headers, data } = kafkaMessage;
        const kafkaEntry = await this.databaseService.getKafkaEntryByReferenceId(kafkaMessage.headers.referenceId);
        const eventStage = headers?.eventStage;
        try {
            if (!eventStage) {
                await this.analyzeFailure(kafkaEntry, kafkaMessage);
                await this.retryTests(kafkaEntry, kafkaMessage);
                await this.notifyDevelopers(kafkaEntry, kafkaMessage);
                await this.createTicket(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.RETRY_TESTS) {
                await this.retryTests(kafkaEntry, kafkaMessage);
                await this.notifyDevelopers(kafkaEntry, kafkaMessage);
                await this.createTicket(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.NOTIFY_DEVELOPERS) {
                await this.notifyDevelopers(kafkaEntry, kafkaMessage);
                await this.createTicket(kafkaEntry, kafkaMessage);
            }
            if (eventStage === EventStageEnum.CREATE_TICKET) {
                await this.createTicket(kafkaEntry, kafkaMessage);
            }
            await this.databaseService.markKafkaEntrySuccess(kafkaEntry);

        } catch (error) {
            this.logger.error('Error processing test failed:', error);
        }
    }

    // Step 1: Parse config (3 lines)
    private async parseConfig(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.PARSE_CONFIG)
        try {
            // Add logic to parse test configuration
            console.log('parseConfig', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error parsing config:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 2: Execute tests (1-3 seconds) (3 lines)
    private async executeTests(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.EXECUTE_TESTS)
        try {
            // Add logic to execute tests (1-3 seconds)
            await this.testRunnerService.runTests(kafkaMessage.data);
            console.log('executeTests', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error executing tests:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 3: Generate report (3 lines)
    private async generateReport(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.GENERATE_REPORT)
        try {
            // Add logic to generate test report
            console.log('generateReport', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error generating report:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 4: Store results (3 lines)
    private async storeResults(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.STORE_RESULTS)
        try {
            // Add logic to store test results
            console.log('storeResults', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error storing results:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 1: Analyze failure (3 lines)
    private async analyzeFailure(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.ANALYZE_FAILURE)
        try {
            // Add logic to analyze test failure
            console.log('analyzeFailure', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error analyzing failure:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 2: Retry (3 lines)
    private async retryTests(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.RETRY_TESTS)
        try {
            // Add logic to retry failed tests
            console.log('retry', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error retrying tests:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 3: Notify developers (3 lines)
    private async notifyDevelopers(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.NOTIFY_DEVELOPERS)
        try {
            // Add logic to notify developers
            await this.emailService.sendEmail(kafkaMessage.data);
            console.log('notifyDevelopers', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error notifying developers:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }

    // Step 4: Create ticket (3 lines)
    private async createTicket(kafkaEntry: KafkaEntryEntity, kafkaMessage: KafkaMessageDto): Promise<any> {
        await this.databaseService.updateKafkaEntry(kafkaEntry, EventStageEnum.CREATE_TICKET)
        try {
            // Add logic to create ticket
            console.log('createTicket', "success");
            await this.databaseService.updateEventLifecycle(kafkaEntry, LifecycleStatusEnum.SUCCESS);

        } catch (error) {
            this.logger.error('Error creating ticket:', error);
            await this.kafkaProducerService.retryKafkaMessage(kafkaEntry, kafkaMessage)
            throw error;
        }
    }
}
