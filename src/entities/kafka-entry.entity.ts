import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { KafkaStatusEnum } from './enums/kafka-status.enum';
import { EventStageEnum } from './enums/event-stage.enum';
import { EventTypeEnum } from './enums/event-type.enum';
import { PriorityEnum } from './enums/priority.enum';
import { EventLifecycleEntity } from './event-lifecycle.entity';

@Entity('kafka_entry')
export class KafkaEntryEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    referenceId: string;

    @Column({ type: 'varchar', length: 255 })
    eventId: string;

    @Column({
        type: 'enum',
        enum: KafkaStatusEnum,
        default: KafkaStatusEnum.QUEUE
    })
    status: KafkaStatusEnum;

    @Column({ type: 'int', default: 0 })
    retryCount: number;

    @Column({ type: 'varchar', length: 255 })
    topicName: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    nextRetryAt: Date;

    @Column({
        type: 'enum',
        enum: EventStageEnum,
        nullable: true
    })
    eventStage: EventStageEnum;

    @Column({ type: 'json', nullable: true })
    completedStages: Record<string, any>;

    @Column({
        type: 'enum',
        enum: EventTypeEnum
    })
    eventType: EventTypeEnum;

    @Column({
        type: 'enum',
        enum: PriorityEnum,
        default: PriorityEnum.NORMAL
    })
    priority: PriorityEnum;

    @UpdateDateColumn()
    updatedDate: Date;

    @Column({ type: 'json', nullable: true })
    error: Record<string, any>;

    @OneToMany(() => EventLifecycleEntity, obj => obj.kafkaEntry, { cascade: true })
    eventLifecycles: EventLifecycleEntity[];
}
