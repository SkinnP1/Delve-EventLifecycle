import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class DatabaseConfigDto {
    @IsNotEmpty()
    @IsString()
    host: string;

    @IsNotEmpty()
    @IsNumber()
    port: number;

    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsString()
    database: string;

    @IsOptional()
    @IsString()
    url?: string;
}
