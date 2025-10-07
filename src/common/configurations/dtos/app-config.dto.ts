import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class AppConfigDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    version: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    port: number;

    @IsNotEmpty()
    @IsString()
    environment: string;
}
