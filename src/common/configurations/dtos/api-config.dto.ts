import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class ApiConfigDto {
    @IsNotEmpty()
    @IsString()
    prefix: string;

    @IsNotEmpty()
    @IsString()
    version: string;

    @IsNotEmpty()
    @IsNumber()
    timeout: number;

    @IsNotEmpty()
    @IsString()
    corsOrigin: string;

    @IsNotEmpty()
    @IsNumber()
    rateLimit: number;
}
