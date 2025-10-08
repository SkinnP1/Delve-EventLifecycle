import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { EventLifecycleEntity } from '../../entities/event-lifecycle.entity';
import { KafkaEntryEntity } from '../../entities/kafka-entry.entity';
import { EventStageEnum } from '../../entities/enums/event-stage.enum';
import { LifecycleStatusEnum } from '../../entities/enums/lifecycle-status.enum';
import { EventTypeEnum } from '../../entities/enums/event-type.enum';
import { PriorityEnum } from '../../entities/enums/priority.enum';
import { KafkaMessageDto } from 'src/api/dto/kafka-message.dto';
import { KafkaStatusEnum } from 'src/entities/enums/kafka-status.enum';
import { v4 as uuidv4 } from 'uuid';
import { ConfigurationService } from '../configurations/configuration.service';
import { KafkaConfigDto } from '../configurations/dtos/kafka-config.dto';

export interface CreateEventLifecycleDto {
    kafkaEntryId: number;
    status: LifecycleStatusEnum;
    eventStage: EventStageEnum;
}

export interface UpdateEventLifecycleDto {
    status?: LifecycleStatusEnum;
    eventStage?: EventStageEnum;
}


export interface EventLifecycleFilters {
    kafkaEntryId?: number;
    status?: LifecycleStatusEnum;
    eventStage?: EventStageEnum;
    createdAtFrom?: Date;
    createdAtTo?: Date;
}

@Injectable()
export class DatabaseService {
    private readonly kafkaConfig: KafkaConfigDto;
    constructor(
        @InjectRepository(EventLifecycleEntity)
        private readonly eventLifecycleRepository: Repository<EventLifecycleEntity>,
        @InjectRepository(KafkaEntryEntity)
        private readonly kafkaEntryRepository: Repository<KafkaEntryEntity>,
        private readonly configurationService: ConfigurationService
    ) { this.kafkaConfig = this.configurationService.getKafkaConfig() }

    /**
     * Create a new event lifecycle entry
     */
    async updateKafkaEntry(kafkaEntry: KafkaEntryEntity, newStage: EventStageEnum): Promise<KafkaEntryEntity> {
        // Verify that the kafka entry exists
        if (kafkaEntry.eventStage !== newStage) {
            kafkaEntry.status = KafkaStatusEnum.PROCESSING;
            kafkaEntry.eventStage = newStage;
            kafkaEntry.retryCount = 0;
            kafkaEntry.error = null;
            await this.kafkaEntryRepository.save(kafkaEntry);
        }
        return kafkaEntry;
    }

    async getKafkaEntryByReferenceId(referenceId: string): Promise<KafkaEntryEntity> {
        return await this.kafkaEntryRepository.findOne({
            where: { referenceId: referenceId }
        });
    }

    async markKafkaEntrySuccess(kafkaEntry: KafkaEntryEntity): Promise<KafkaEntryEntity> {
        // Verify that the kafka entry exists
        kafkaEntry.status = KafkaStatusEnum.COMPLETED;
        kafkaEntry.retryCount = 0;
        kafkaEntry.completedStages = {
            ...kafkaEntry.completedStages,
            [kafkaEntry.eventStage]: KafkaStatusEnum.COMPLETED
        }
        kafkaEntry.error = null;
        await this.kafkaEntryRepository.save(kafkaEntry);
        return kafkaEntry;
    }

    async updateEventLifecycle(kafkaEntry: KafkaEntryEntity, status: LifecycleStatusEnum, errorMessage?: string): Promise<KafkaEntryEntity> {
        // Verify that the kafka entry exists
        const eventLifecycle = this.eventLifecycleRepository.create({
            status: status,
            kafkaEntry: kafkaEntry,
            eventStage: kafkaEntry.eventStage,
            errorMessage: errorMessage
        });
        await this.eventLifecycleRepository.save(eventLifecycle);
        if (status === LifecycleStatusEnum.FAIL) {
            kafkaEntry.nextRetryAt = new Date(Date.now() + Math.min(300, 1 * Math.pow(2, kafkaEntry.retryCount)));
            kafkaEntry.status = KafkaStatusEnum.FAILED;
            kafkaEntry.retryCount += 1;
            kafkaEntry.error = { [`${kafkaEntry.eventStage}`]: `${errorMessage}` };
        }
        else {
            kafkaEntry.completedStages = {
                ...kafkaEntry.completedStages,
                [kafkaEntry.eventStage]: KafkaStatusEnum.COMPLETED
            }
        }
        await this.kafkaEntryRepository.save(kafkaEntry);
        return kafkaEntry;

    }

    /**
     * Find event lifecycle by ID
     */
    async findEventLifecycleById(id: number): Promise<EventLifecycleEntity | null> {
        return await this.eventLifecycleRepository.findOne({
            where: { id },
            relations: ['kafkaEntry']
        });
    }

    /**
     * Find all event lifecycles with optional filters
     */
    async findEventLifecycles(filters?: EventLifecycleFilters): Promise<EventLifecycleEntity[]> {
        const where: FindOptionsWhere<EventLifecycleEntity> = {};

        if (filters?.kafkaEntryId) {
            where.kafkaEntry = { id: filters.kafkaEntryId };
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.eventStage) {
            where.eventStage = filters.eventStage;
        }

        const findOptions: FindManyOptions<EventLifecycleEntity> = {
            where,
            relations: ['kafkaEntry'],
            order: { createdAt: 'DESC' }
        };

        if (filters?.createdAtFrom || filters?.createdAtTo) {
            findOptions.where = {
                ...where,
                createdAt: undefined
            };
        }

        let query = this.eventLifecycleRepository.createQueryBuilder('eventLifecycle')
            .leftJoinAndSelect('eventLifecycle.kafkaEntry', 'kafkaEntry')
            .orderBy('eventLifecycle.createdAt', 'DESC');

        if (filters?.kafkaEntryId) {
            query = query.andWhere('kafkaEntry.id = :kafkaEntryId', { kafkaEntryId: filters.kafkaEntryId });
        }

        if (filters?.status) {
            query = query.andWhere('eventLifecycle.status = :status', { status: filters.status });
        }

        if (filters?.eventStage) {
            query = query.andWhere('eventLifecycle.eventStage = :eventStage', { eventStage: filters.eventStage });
        }

        if (filters?.createdAtFrom) {
            query = query.andWhere('eventLifecycle.createdAt >= :createdAtFrom', { createdAtFrom: filters.createdAtFrom });
        }

        if (filters?.createdAtTo) {
            query = query.andWhere('eventLifecycle.createdAt <= :createdAtTo', { createdAtTo: filters.createdAtTo });
        }

        return await query.getMany();
    }



    /**
     * Delete an event lifecycle entry
     */
    async deleteEventLifecycle(id: number): Promise<boolean> {
        const result = await this.eventLifecycleRepository.delete(id);
        return result.affected > 0;
    }

    /**
     * Get event lifecycles by kafka entry ID
     */
    async getEventLifecyclesByKafkaEntryId(kafkaEntryId: number): Promise<EventLifecycleEntity[]> {
        return await this.findEventLifecycles({ kafkaEntryId });
    }

    /**
     * Get event lifecycles by status
     */
    async getEventLifecyclesByStatus(status: LifecycleStatusEnum): Promise<EventLifecycleEntity[]> {
        return await this.findEventLifecycles({ status });
    }

    /**
     * Get event lifecycles by event stage
     */
    async getEventLifecyclesByEventStage(eventStage: EventStageEnum): Promise<EventLifecycleEntity[]> {
        return await this.findEventLifecycles({ eventStage });
    }

    /**
     * Get event lifecycles by date range
     */
    async getEventLifecyclesByDateRange(from: Date, to: Date): Promise<EventLifecycleEntity[]> {
        return await this.findEventLifecycles({ createdAtFrom: from, createdAtTo: to });
    }

    /**
     * Count event lifecycles with filters
     */
    async countEventLifecycles(filters?: EventLifecycleFilters): Promise<number> {
        let query = this.eventLifecycleRepository.createQueryBuilder('eventLifecycle')
            .leftJoin('eventLifecycle.kafkaEntry', 'kafkaEntry');

        if (filters?.kafkaEntryId) {
            query = query.andWhere('kafkaEntry.id = :kafkaEntryId', { kafkaEntryId: filters.kafkaEntryId });
        }

        if (filters?.status) {
            query = query.andWhere('eventLifecycle.status = :status', { status: filters.status });
        }

        if (filters?.eventStage) {
            query = query.andWhere('eventLifecycle.eventStage = :eventStage', { eventStage: filters.eventStage });
        }

        if (filters?.createdAtFrom) {
            query = query.andWhere('eventLifecycle.createdAt >= :createdAtFrom', { createdAtFrom: filters.createdAtFrom });
        }

        if (filters?.createdAtTo) {
            query = query.andWhere('eventLifecycle.createdAt <= :createdAtTo', { createdAtTo: filters.createdAtTo });
        }

        return await query.getCount();
    }

    /**
     * Get paginated event lifecycles
     */
    async getPaginatedEventLifecycles(
        page: number = 1,
        limit: number = 10,
        filters?: EventLifecycleFilters
    ): Promise<{ data: EventLifecycleEntity[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;

        let query = this.eventLifecycleRepository.createQueryBuilder('eventLifecycle')
            .leftJoinAndSelect('eventLifecycle.kafkaEntry', 'kafkaEntry')
            .orderBy('eventLifecycle.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (filters?.kafkaEntryId) {
            query = query.andWhere('kafkaEntry.id = :kafkaEntryId', { kafkaEntryId: filters.kafkaEntryId });
        }

        if (filters?.status) {
            query = query.andWhere('eventLifecycle.status = :status', { status: filters.status });
        }

        if (filters?.eventStage) {
            query = query.andWhere('eventLifecycle.eventStage = :eventStage', { eventStage: filters.eventStage });
        }

        if (filters?.createdAtFrom) {
            query = query.andWhere('eventLifecycle.createdAt >= :createdAtFrom', { createdAtFrom: filters.createdAtFrom });
        }

        if (filters?.createdAtTo) {
            query = query.andWhere('eventLifecycle.createdAt <= :createdAtTo', { createdAtTo: filters.createdAtTo });
        }

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            total,
            page,
            limit
        };
    }

    /**
     * Mark Kafka entry as DLQ (Dead Letter Queue)
     */
    async markKafkaEntryAsDLQ(kafkaEntry: KafkaEntryEntity, reason?: string): Promise<KafkaEntryEntity> {
        kafkaEntry.status = KafkaStatusEnum.DLQ;
        kafkaEntry.error = {
            ...kafkaEntry.error,
            dlqReason: reason || 'Retry limit exhausted'
        };
        const childKafkaEntry = await this.createChildKafkaEntry(kafkaEntry);
        kafkaEntry.child = childKafkaEntry;
        await this.kafkaEntryRepository.save(kafkaEntry);
        return kafkaEntry;
    }

    /**
     * Mark Kafka entry as DLQ-FAILED (Dead Letter Queue Failed)
     */
    async markKafkaEntryAsDLQFailed(kafkaEntry: KafkaEntryEntity, reason?: string): Promise<KafkaEntryEntity> {
        kafkaEntry.status = KafkaStatusEnum.DLQ_FAILED;
        kafkaEntry.error = {
            ...kafkaEntry.error,
            dlqReason: reason || 'DLQ processing failed',
        };
        await this.kafkaEntryRepository.save(kafkaEntry);
        return kafkaEntry;
    }

    /**
     * Create a child KafkaEntryEntity and save it with parent relationship
     */
    async createChildKafkaEntry(
        parentKafkaEntry: KafkaEntryEntity,
    ): Promise<KafkaEntryEntity> {
        // Create the child entity
        const childKafkaEntry = this.kafkaEntryRepository.create({
            referenceId: uuidv4(),
            eventId: parentKafkaEntry.eventId,
            topicName: this.kafkaConfig.dlqTopicName,
            eventType: parentKafkaEntry.eventType,
            priority: parentKafkaEntry.priority,
            status: KafkaStatusEnum.QUEUE,
            retryCount: 0,
            eventStage: parentKafkaEntry.eventStage,
            data: parentKafkaEntry.data,
            error: null
        });

        // Save the child entity
        const savedChild = await this.kafkaEntryRepository.save(childKafkaEntry);
        return savedChild;
    }

    /**
     * Get event lifecycle statistics
     */
    async getEventLifecycleStats(): Promise<{
        total: number;
        byStatus: Record<LifecycleStatusEnum, number>;
        byEventStage: Record<EventStageEnum, number>;
    }> {
        const total = await this.eventLifecycleRepository.count();

        const statusStats = await this.eventLifecycleRepository
            .createQueryBuilder('eventLifecycle')
            .select('eventLifecycle.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('eventLifecycle.status')
            .getRawMany();

        const eventStageStats = await this.eventLifecycleRepository
            .createQueryBuilder('eventLifecycle')
            .select('eventLifecycle.eventStage', 'eventStage')
            .addSelect('COUNT(*)', 'count')
            .groupBy('eventLifecycle.eventStage')
            .getRawMany();

        const byStatus = statusStats.reduce((acc, stat) => {
            acc[stat.status] = parseInt(stat.count);
            return acc;
        }, {} as Record<LifecycleStatusEnum, number>);

        const byEventStage = eventStageStats.reduce((acc, stat) => {
            acc[stat.eventStage] = parseInt(stat.count);
            return acc;
        }, {} as Record<EventStageEnum, number>);

        return {
            total,
            byStatus,
            byEventStage
        };
    }
}
