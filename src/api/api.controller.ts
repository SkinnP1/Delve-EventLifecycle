import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookRequestDto, WebhookResponseDto } from './dto/webhook.dto';
import { EventStatusResponseDto } from './dto/event.dto';
import { HealthResponseDto } from './dto/health.dto';
import { ApiService } from './api.service';

@ApiTags('API')
@Controller()
export class ApiController {
    constructor(private readonly apiService: ApiService) { }

    @Post('webhook')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({ summary: 'Accept incoming webhook events' })
    @ApiResponse({
        status: 202,
        description: 'Event accepted and queued for processing',
        type: WebhookResponseDto
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid request payload'
    })
    async acceptWebhook(@Body() webhookRequest: WebhookRequestDto): Promise<WebhookResponseDto> {
        return this.apiService.processWebhook(webhookRequest);
    }

    @Get('events/:event_id')
    @ApiOperation({ summary: 'Get event processing status and history' })
    @ApiResponse({
        status: 200,
        description: 'Event status retrieved successfully',
        type: EventStatusResponseDto
    })
    @ApiResponse({
        status: 404,
        description: 'Event not found'
    })
    async getEventStatus(@Param('event_id') eventId: string): Promise<EventStatusResponseDto> {
        const eventStatus = await this.apiService.getEventStatus(eventId);
        if (!eventStatus) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }
        return eventStatus;
    }

    @Get('health')
    @ApiOperation({ summary: 'Get system health and metrics' })
    @ApiResponse({
        status: 200,
        description: 'Health status retrieved successfully',
        type: HealthResponseDto
    })
    async getHealth(): Promise<HealthResponseDto> {
        return this.apiService.getSystemHealth();
    }
}
