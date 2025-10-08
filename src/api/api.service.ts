import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { WebhookRequestDto, WebhookResponseDto } from './dto/webhook.dto';
import { EventStatusResponseDto, EventStatus, CompletedStageDto, CompletedStagesDto, ErrorDto } from './dto/event.dto';
import { HealthResponseDto, HealthStatus, QueueStatsDto, WorkerStatsDto, CircuitBreakerDto } from './dto/health.dto';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { KafkaProducerService } from 'src/common/kafka/kafka-producer.service';
import { ConfigurationService } from 'src/common/configurations/configuration.service';
import { KafkaMessageDto } from './dto/kafka-message.dto';
import { DatabaseService } from 'src/common/database/database.service';

@Injectable()
export class ApiService {
    private events: Map<string, EventStatusResponseDto> = new Map();
    private kafkaTopic: string;
    constructor(
        @InjectRepository(KafkaEntryEntity)
        private readonly kafkaEntryRepository: Repository<KafkaEntryEntity>,
        private readonly kafkaProducerService: KafkaProducerService,
        private readonly configurationService: ConfigurationService,
        private readonly databaseService: DatabaseService
    ) {
        this.kafkaTopic = this.configurationService.getKafkaConfig().topicName;
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
                status: kafkaEntry.status as unknown as EventStatus,
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
        // In a real implementation, this would:
        // 1. Check database connectivity
        // 2. Check external service health
        // 3. Get queue metrics from message broker
        // 4. Get worker statistics
        // 5. Check circuit breaker states

        const queueStats: QueueStatsDto = {
            pending: 150,
            dead_letter: 3
        };

        const workerStats: WorkerStatsDto = {
            active_workers: 8,
            success_rate: 0.96
        };

        const circuitBreakers: CircuitBreakerDto = {
            email_service: 'closed',
            sms_service: 'closed',
            test_runner_service: 'closed',
            analytics_service: 'closed'
        };

        // Determine overall health status
        let status: HealthStatus;
        if (queueStats.dead_letter > 10 || workerStats.success_rate < 0.9) {
            status = HealthStatus.UNHEALTHY;
        } else if (queueStats.pending > 1000 || workerStats.success_rate < 0.95) {
            status = HealthStatus.DEGRADED;
        } else {
            status = HealthStatus.HEALTHY;
        }

        return {
            status,
            queue_stats: queueStats,
            worker_stats: workerStats,
            circuit_breakers: circuitBreakers
        };
    }

}
