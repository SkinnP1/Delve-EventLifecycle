import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { WebhookRequestDto, WebhookResponseDto } from './dto/webhook.dto';
import { EventStatusResponseDto, EventStatus, CompletedStageDto, ErrorDto } from './dto/event.dto';
import { HealthResponseDto, HealthStatus, QueueStatsDto, WorkerStatsDto, CircuitBreakerDto } from './dto/health.dto';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';
import { KafkaEntryEntity } from 'src/entities/kafka-entry.entity';
import { KafkaProducerService } from 'src/common/kafka/kafka-producer.service';
import { ConfigurationService } from 'src/common/configurations/configuration.service';
import { KafkaMessageDto } from './dto/kafka-message.dto';

@Injectable()
export class ApiService {
    private events: Map<string, EventStatusResponseDto> = new Map();
    private kafkaTopic: string;
    constructor(
        @InjectRepository(KafkaEntryEntity)
        private readonly kafkaEntryRepository: Repository<KafkaEntryEntity>,
        private readonly kafkaProducerService: KafkaProducerService,
        private readonly configurationService: ConfigurationService
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

    // Event status tracking
    async getEventStatus(eventId: string): Promise<EventStatusResponseDto | null> {
        return this.events.get(eventId) || null;
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
