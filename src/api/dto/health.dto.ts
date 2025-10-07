import { ApiProperty } from '@nestjs/swagger';

export enum HealthStatus {
    HEALTHY = 'healthy',
    DEGRADED = 'degraded',
    UNHEALTHY = 'unhealthy'
}

export class QueueStatsDto {
    @ApiProperty({ description: 'Number of pending events', example: 150 })
    pending: number;

    @ApiProperty({ description: 'Number of events in dead letter queue', example: 3 })
    dead_letter: number;
}

export class WorkerStatsDto {
    @ApiProperty({ description: 'Number of active workers', example: 8 })
    active_workers: number;

    @ApiProperty({ description: 'Success rate as decimal', example: 0.96 })
    success_rate: number;
}

export class CircuitBreakerDto {
    @ApiProperty({ description: 'Circuit breaker status for email service', example: 'closed' })
    email_service: string;

    @ApiProperty({ description: 'Circuit breaker status for SMS service', example: 'closed' })
    sms_service: string;

    @ApiProperty({ description: 'Circuit breaker status for test runner service', example: 'closed' })
    test_runner_service: string;

    @ApiProperty({ description: 'Circuit breaker status for analytics service', example: 'closed' })
    analytics_service: string;
}

export class HealthResponseDto {
    @ApiProperty({ description: 'Overall system health status', enum: HealthStatus, example: 'healthy' })
    status: HealthStatus;

    @ApiProperty({ description: 'Queue statistics', type: QueueStatsDto })
    queue_stats: QueueStatsDto;

    @ApiProperty({ description: 'Worker statistics', type: WorkerStatsDto })
    worker_stats: WorkerStatsDto;

    @ApiProperty({ description: 'Circuit breaker statuses', type: CircuitBreakerDto })
    circuit_breakers: CircuitBreakerDto;
}
