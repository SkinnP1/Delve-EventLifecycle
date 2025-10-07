import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('health')
    getHealth(): object {
        return this.appService.getHealth();
    }

    @Post('kafka/:topic')
    async sendMessage(
        @Param('topic') topic: string,
        @Body() body: { message: any }
    ) {
        return await this.appService.sendMessage(topic, body.message);
    }
}
