import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';

export class KafkaConsumerConfigDto {
    @IsNotEmpty()
    @IsString()
    groupId: string;

    @IsNotEmpty()
    @IsString()
    autoOffsetReset: string;

    @IsNotEmpty()
    @IsNumber()
    sessionTimeout: number;

    @IsNotEmpty()
    @IsNumber()
    heartbeatInterval: number;

    @IsNotEmpty()
    @IsNumber()
    maxPollRecords: number;

    @IsNotEmpty()
    @IsBoolean()
    enableAutoCommit: boolean;

    @IsNotEmpty()
    @IsNumber()
    consumerTimeout: number;
}
