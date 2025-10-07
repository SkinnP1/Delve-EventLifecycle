import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class LoggingConfigDto {
    @IsNotEmpty()
    @IsString()
    level: string;

    @IsNotEmpty()
    @IsString()
    format: string;

    @IsOptional()
    @IsString()
    file?: string;

    @IsOptional()
    @IsString()
    maxSize?: string;

    @IsOptional()
    @IsNumber()
    maxFiles?: number;
}
