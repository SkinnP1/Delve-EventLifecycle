import { IsString, IsObject, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PriorityEnum } from 'src/entities/enums/priority.enum';
import { EventTypeEnum } from 'src/entities/enums/event-type.enum';
import { EventStageEnum } from 'src/entities/enums/event-stage.enum';

export class KafkaMessageHeadersDto {
    @ApiProperty({ description: 'Event priority', enum: PriorityEnum, example: 'high' })
    @IsEnum(PriorityEnum)
    priority: PriorityEnum;

    @ApiProperty({ description: 'Reference identifier for tracking', example: 'ref_456' })
    @IsString()
    referenceId: string;

    @ApiProperty({ description: 'Event type', enum: EventTypeEnum, example: 'user.created' })
    @IsEnum(EventTypeEnum)
    eventType: EventTypeEnum;

    @ApiProperty({ description: 'Current event stage', enum: EventStageEnum, example: 'VALIDATE', required: false })
    @IsOptional()
    @IsEnum(EventStageEnum)
    eventStage?: EventStageEnum;

    @ApiProperty({ description: 'Retry at', example: '2021-01-01T00:00:00.000Z', required: false })
    @IsOptional()
    @IsDateString()
    retryAt?: Date;

    @ApiProperty({ description: 'Name of the topic', example: 'delve', required: true })
    @IsString()
    topicName: string;
}

export class KafkaMessageDto {
    @ApiProperty({ description: 'Message headers containing metadata', type: KafkaMessageHeadersDto })
    @IsObject()
    headers: KafkaMessageHeadersDto;

    @ApiProperty({ description: 'Message payload data - can be any type', example: { user_id: 'usr_123', email: 'user@example.com' } })
    data: any;
}
