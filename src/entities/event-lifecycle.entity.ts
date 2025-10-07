import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { KafkaEntryEntity } from './kafka-entry.entity';
import { EventStageEnum } from './enums/event-stage.enum';
import { LifecycleStatusEnum } from './enums/lifecycle-status.enum';

@Entity('event_lifecycle')
export class EventLifecycleEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => KafkaEntryEntity, (object) => object.eventLifecycles)
    kafkaEntry: KafkaEntryEntity;

    @CreateDateColumn()
    createdAt: Date;

    @Column({
        type: 'enum',
        enum: LifecycleStatusEnum
    })
    status: LifecycleStatusEnum;

    @Column({
        type: 'enum',
        enum: EventStageEnum,
        nullable: true
    })
    eventStage?: EventStageEnum;
}
