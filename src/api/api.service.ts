import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { WebhookRequestDto, WebhookResponseDto } from './dto/webhook.dto';
import { EventStatusResponseDto, CompletedStageDto, CompletedStagesDto, ErrorDto } from './dto/event.dto';
import { HealthResponseDto, HealthStatus, QueueStatsDto, WorkerStatsDto, CircuitBreakerDto } from './dto/health.dto';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { KafkaProducerService } from 'src/common/kafka/kafka-producer.service';
import { ConfigurationService } from 'src/common/configurations/configuration.service';
import { KafkaMessageDto } from './dto/kafka-message.dto';
import { DatabaseService } from 'src/common/database/database.service';
import { CircuitBreakerService } from 'src/common/circuit-breaker/circuit-breaker.service';
import { KafkaConsumerService } from 'src/common/kafka/kafka-consumer.service';

@Injectable()
export class ApiService {
    private events: Map<string, EventStatusResponseDto> = new Map();
    private kafkaTopic: string;
    private dlqKafkaTopic: string;
    constructor(
        @InjectRepository(KafkaEntryEntity)
        private readonly kafkaEntryRepository: Repository<KafkaEntryEntity>,
        private readonly kafkaProducerService: KafkaProducerService,
        private readonly configurationService: ConfigurationService,
        private readonly databaseService: DatabaseService,
        private readonly circuitBreakerService: CircuitBreakerService,
        private readonly kafkaConsumerService: KafkaConsumerService
    ) {
        this.kafkaTopic = this.configurationService.getKafkaConfig().topicName;
        this.dlqKafkaTopic = this.configurationService.getKafkaConfig().dlqTopicName;
    }

    // Webhook processing
    async processWebhook(webhookRequest: WebhookRequestDto): Promise<WebhookResponseDto> {
        try {
            // 1. Create kafka_entry record
            const kafkaEntry = new KafkaEntryEntity();
            kafkaEntry.topicName = this.kafkaTopic;
            kafkaEntry.referenceId = uuidv4();
            kafkaEntry.eventId = webhookRequest.event_id;
            kafkaEntry.status = KafkaStatusEnum.QUEUE;
            kafkaEntry.eventType = webhookRequest.event_type;
            kafkaEntry.priority = webhookRequest.priority;
            kafkaEntry.retryCount = 0;
            kafkaEntry.data = webhookRequest.data;

            // Save to database
            await this.kafkaEntryRepository.save(kafkaEntry);

            // 2. Send message to Kafka
            const kafkaMessage: KafkaMessageDto = {
                headers: {
                    priority: webhookRequest.priority,
                    referenceId: kafkaEntry.referenceId,
                    eventType: webhookRequest.event_type,
                    topicName: kafkaEntry.topicName,
                },
                data: webhookRequest.data
            };


            await this.kafkaProducerService.sendMessage(
                kafkaEntry.topicName,
                kafkaMessage,
                webhookRequest.priority + kafkaEntry.referenceId
            );

            console.log(`Queuing event ${webhookRequest.event_id} of type ${webhookRequest.event_type} with kafka_entry ID: ${kafkaEntry.referenceId}`);

            return {
                event_id: kafkaEntry.referenceId,
                status: KafkaStatusEnum.QUEUE,
                queued_at: kafkaEntry.createdAt.toISOString()
            };
        } catch (error) {
            console.error(`Failed to process webhook for event ${webhookRequest.event_id}:`, error);
            throw error;
        }
    }

    // Utility method to convert completed stages format
    private convertCompletedStages(completedStages: Record<string, string> | null): CompletedStageDto[] {
        if (!completedStages) {
            return [];
        }

        return Object.entries(completedStages).map(([stage, status]) => ({
            stage,
            status
        }));
    }

    // Utility method to convert error format
    private convertErrors(errors: any): ErrorDto[] {
        if (!errors) {
            return [];
        }

        // Handle object format like {"stage": "error"}
        if (typeof errors === 'object' && !Array.isArray(errors)) {
            return Object.entries(errors).map(([stage, error]) => ({
                stage: stage || 'Unknown',
                error: String(error) || 'Unknown error'
            }));
        }

        // Handle array of error objects
        if (Array.isArray(errors)) {
            return errors.map(errorItem => {
                if (typeof errorItem === 'object' && errorItem !== null) {
                    const entries = Object.entries(errorItem);
                    if (entries.length > 0) {
                        const [stage, error] = entries[0];
                        return {
                            stage: stage || 'Unknown',
                            error: String(error) || 'Unknown error'
                        };
                    }
                }
                return {
                    stage: 'Unknown',
                    error: 'Invalid error format'
                };
            });
        }

        // Handle single error string (fallback)
        if (typeof errors === 'string') {
            const [stage, error] = errors.split(':');
            return [{
                stage: stage || 'Unknown',
                error: error || 'Unknown error'
            }];
        }

        return [];
    }

    // Event status tracking
    async getEventStatus(eventId: string): Promise<EventStatusResponseDto | null> {
        try {
            const kafkaEntry = await this.databaseService.getKafkaEntryByReferenceId(eventId);

            if (!kafkaEntry) {
                return null;
            }

            const response: EventStatusResponseDto = {
                event_id: kafkaEntry.eventId,
                status: kafkaEntry?.child?.status || kafkaEntry.status,
                attempts: kafkaEntry.retryCount,
                completed_stages: this.convertCompletedStages(kafkaEntry.completedStages),
                errors: this.convertErrors(kafkaEntry.error)
            };

            return response;
        } catch (error) {
            console.error(`Failed to get event status for event ${eventId}:`, error);
            throw error;
        }
    }

    // System health monitoring
    async getSystemHealth(): Promise<HealthResponseDto> {
        try {
            // 1. Get queue statistics from database
            const queueStats = await this.getQueueStats();

            // 2. Get worker statistics
            const workerStats = await this.getWorkerStats();

            // 3. Get circuit breaker states
            const circuitBreakers = await this.getCircuitBreakerStates();


            // 4. Determine overall health status
            const status = this.determineHealthStatus(queueStats, workerStats, circuitBreakers);

            return {
                status,
                queue_stats: queueStats,
                worker_stats: workerStats,
                circuit_breakers: circuitBreakers
            };
        } catch (error) {
            console.error('Failed to get system health:', error);
            // Return unhealthy status if health check fails
            return {
                status: HealthStatus.UNHEALTHY,
                queue_stats: { pending: 0, dead_letter: 0 },
                worker_stats: { active_workers: 0, success_rate: 0 },
                circuit_breakers: {
                    email_service: 'unknown',
                    sms_service: 'unknown',
                    test_runner_service: 'unknown',
                    analytics_service: 'unknown'
                }
            };
        }
    }

    private async getQueueStats(): Promise<QueueStatsDto> {
        try {
            // Get pending events (QUEUE, PROCESSING, FAILED statuses)
            const pendingCount = await this.kafkaEntryRepository.count({
                where: {
                    status: In([KafkaStatusEnum.QUEUE, KafkaStatusEnum.PROCESSING, KafkaStatusEnum.FAILED]),
                    topicName: this.kafkaTopic
                }
            });

            // Get dead letter queue events
            const deadLetterCount = await this.kafkaEntryRepository.count({
                where: {
                    status: In([KafkaStatusEnum.DLQ, KafkaStatusEnum.DLQ_FAILED]),
                    topicName: this.dlqKafkaTopic
                }
            });


            return {
                pending: pendingCount,
                dead_letter: deadLetterCount
            };
        } catch (error) {
            console.error('Failed to get queue stats:', error);
            return { pending: 0, dead_letter: 0 };
        }
    }

    private async getWorkerStats(): Promise<WorkerStatsDto> {
        try {
            // Get total events processed in the last hour (using IST)
            const now = new Date();
            const eightHourAgo = new Date(now.getTime() - 60 * 60 * 8000);


            const totalEvents = await this.kafkaEntryRepository
                .createQueryBuilder('kafkaEntry')
                .where('kafkaEntry.createdAt >= :eightHourAgo', { eightHourAgo: eightHourAgo })
                .getCount();

            const completedEvents = await this.kafkaEntryRepository
                .createQueryBuilder('kafkaEntry')
                .where('kafkaEntry.status = :status', { status: KafkaStatusEnum.COMPLETED })
                .andWhere('kafkaEntry.createdAt >= :eightHourAgo', { eightHourAgo: eightHourAgo })
                .getCount();

            const successRate = totalEvents > 0 ? completedEvents / totalEvents : 1.0;

            // Get actual number of active Kafka consumers
            const activeWorkers = await this.getActiveKafkaConsumers();

            return {
                active_workers: activeWorkers,
                success_rate: Math.round(successRate * 100) / 100
            };
        } catch (error) {
            console.error('Failed to get worker stats:', error);
            return { active_workers: 0, success_rate: 0 };
        }
    }

    private async getActiveKafkaConsumers(): Promise<number> {
        try {
            // Use the proper method from KafkaConsumerService
            return await this.kafkaConsumerService.getActiveConsumerCount();
        } catch (error) {
            console.error('Failed to get active Kafka consumers:', error);
            return 1; // Fallback to 1 on error
        }
    }

    private async getCircuitBreakerStates(): Promise<CircuitBreakerDto> {
        try {
            // Get all circuit breaker states from the service
            const allStates = this.circuitBreakerService.getAllCircuitBreakerStates();

            // Check individual service stats
            const services = ['email_service', 'sms_service', 'test_runner_service', 'analytics_service'];
            for (const service of services) {
                const stats = this.circuitBreakerService.getStats(service);
            }

            const circuitBreakers: CircuitBreakerDto = {
                email_service: allStates['email_service'] || allStates['email-service'] || 'closed',
                sms_service: allStates['sms_service'] || allStates['sms-service'] || 'closed',
                test_runner_service: allStates['test_runner_service'] || allStates['test-runner-service'] || 'closed',
                analytics_service: allStates['analytics_service'] || allStates['analytics-service'] || 'closed'
            };

            return circuitBreakers;
        } catch (error) {
            console.error('Failed to get circuit breaker states:', error);
            return {
                email_service: 'unknown',
                sms_service: 'unknown',
                test_runner_service: 'unknown',
                analytics_service: 'unknown'
            };
        }
    }

    private determineHealthStatus(
        queueStats: QueueStatsDto,
        workerStats: WorkerStatsDto,
        circuitBreakers: CircuitBreakerDto
    ): HealthStatus {
        // Check for critical issues
        if (queueStats.dead_letter > 10 || workerStats.success_rate < 0.8) {
            return HealthStatus.UNHEALTHY;
        }

        // Check for degraded conditions
        if (
            queueStats.pending > 1000 ||
            workerStats.success_rate < 0.9 ||
            queueStats.dead_letter > 5 ||
            Object.values(circuitBreakers).some(state => state === 'open')
        ) {
            return HealthStatus.DEGRADED;
        }

        return HealthStatus.HEALTHY;
    }

}
