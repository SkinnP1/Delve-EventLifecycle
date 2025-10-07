import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class KafkaProducerConfigDto {
    @IsNotEmpty()
    @IsString()
    acks: string;

    @IsNotEmpty()
    @IsNumber()
    retries: number;

    @IsNotEmpty()
    @IsNumber()
    batchSize: number;

    @IsNotEmpty()
    @IsNumber()
    lingerMs: number;

    @IsNotEmpty()
    @IsNumber()
    bufferMemory: number;

    @IsNotEmpty()
    @IsString()
    compressionType: string;
}
