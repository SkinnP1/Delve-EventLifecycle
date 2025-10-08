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

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        transformer: {
            to: (value: Date) => value,
            from: (value: string) => new Date(value)
        }
    })
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

    @Column({
        type: 'varchar',
        nullable: true
    })
    errorMessage?: string;
}
