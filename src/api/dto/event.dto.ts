import { ApiProperty } from '@nestjs/swagger';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';


export class CompletedStageDto {
    @ApiProperty({ description: 'Stage name', example: 'Validate' })
    stage: string;

    @ApiProperty({ description: 'Stage status', example: 'completed' })
    status: string;
}

export class CompletedStagesDto {
    @ApiProperty({
        description: 'Completed stages in key-value format',
        example: { "VALIDATE_TEMPLATE": "COMPLETED", "RENDER_CONTENT": "COMPLETED", "SEND_EMAIL": "COMPLETED" },
        type: 'object',
        additionalProperties: { type: 'string' }
    })
    stages: Record<string, string>;
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

    @ApiProperty({ description: 'Current processing status', enum: KafkaStatusEnum, example: 'completed' })
    status: KafkaStatusEnum;

    @ApiProperty({ description: 'Number of processing attempts', example: 2 })
    attempts: number;

    @ApiProperty({ description: 'Completed processing stages', type: [CompletedStageDto] })
    completed_stages: CompletedStageDto[];

    @ApiProperty({ description: 'Processing errors', type: [ErrorDto] })
    errors: ErrorDto[];
}
