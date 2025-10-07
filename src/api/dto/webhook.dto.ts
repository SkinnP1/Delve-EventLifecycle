import { IsString, IsObject, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Priority {
    HIGH = 'high',
    NORMAL = 'normal',
    LOW = 'low'
}

export class WebhookRequestDto {
    @ApiProperty({ description: 'Type of event', example: 'user.created' })
    @IsString()
    event_type: string;

    @ApiProperty({ description: 'Unique event identifier', example: 'evt_123' })
    @IsString()
    event_id: string;

    @ApiProperty({ description: 'Event timestamp', example: '2024-01-01T12:00:00Z' })
    @IsDateString()
    timestamp: string;

    @ApiProperty({ description: 'Event priority', enum: Priority, example: 'high' })
    @IsEnum(Priority)
    priority: Priority;

    @ApiProperty({ description: 'Event data payload', example: { user_id: 'usr_123', email: 'user@example.com' } })
    @IsObject()
    data: Record<string, any>;
}

export class WebhookResponseDto {
    @ApiProperty({ description: 'Event identifier', example: 'evt_123' })
    event_id: string;

    @ApiProperty({ description: 'Processing status', example: 'queued' })
    status: string;

    @ApiProperty({ description: 'Timestamp when event was queued', example: '2024-01-01T12:00:00Z' })
    queued_at: string;
}
