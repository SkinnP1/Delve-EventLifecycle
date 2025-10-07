import { IsString, IsObject, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PriorityEnum } from 'src/entities/enums/priority.enum';
import { EventTypeEnum } from 'src/entities/enums/event-type.enum';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';


export class WebhookRequestDto {
    @ApiProperty({ description: 'Type of event', example: 'user.created' })
    @IsEnum(EventTypeEnum)
    event_type: EventTypeEnum;

    @ApiProperty({ description: 'Unique event identifier', example: 'evt_123' })
    @IsString()
    event_id: string;

    @ApiProperty({ description: 'Event timestamp', example: '2024-01-01T12:00:00Z' })
    @IsDateString()
    timestamp: string;

    @ApiProperty({ description: 'Event priority', enum: PriorityEnum, example: 'high' })
    @IsEnum(PriorityEnum)
    priority: PriorityEnum;

    @ApiProperty({ description: 'Event data payload', example: { user_id: 'usr_123', email: 'user@example.com' } })
    @IsObject()
    data: Record<string, any>;
}

export class WebhookResponseDto {
    @ApiProperty({ description: 'Event identifier', example: 'evt_123' })
    event_id: string;

    @ApiProperty({ description: 'Processing status', example: 'queued' })
    status: KafkaStatusEnum;

    @ApiProperty({ description: 'Timestamp when event was queued', example: '2024-01-01T12:00:00Z' })
    queued_at: string;
}
