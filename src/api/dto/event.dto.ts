import { ApiProperty } from '@nestjs/swagger';

export enum EventStatus {
    COMPLETED = 'completed',
    PROCESSING = 'processing',
    FAILED = 'failed',
    DEAD_LETTER = 'dead_letter'
}

export class CompletedStageDto {
    @ApiProperty({ description: 'Stage name', example: 'Validate' })
    stage: string;

    @ApiProperty({ description: 'Stage status', example: 'completed' })
    status: string;
}

export class ErrorDto {
    @ApiProperty({ description: 'Stage where error occurred', example: 'Send email' })
    stage: string;

    @ApiProperty({ description: 'Error message', example: 'timeout' })
    error: string;
}

export class EventStatusResponseDto {
    @ApiProperty({ description: 'Event identifier', example: 'evt_123' })
    event_id: string;

    @ApiProperty({ description: 'Current processing status', enum: EventStatus, example: 'completed' })
    status: EventStatus;

    @ApiProperty({ description: 'Number of processing attempts', example: 2 })
    attempts: number;

    @ApiProperty({ description: 'Completed processing stages', type: [CompletedStageDto] })
    completed_stages: CompletedStageDto[];

    @ApiProperty({ description: 'Processing errors', type: [ErrorDto] })
    errors: ErrorDto[];
}
