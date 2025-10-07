export declare class KafkaConsumerConfigDto {
    groupId: string;
    autoOffsetReset: string;
    sessionTimeout: number;
    heartbeatInterval: number;
    maxPollRecords: number;
    enableAutoCommit: boolean;
    consumerTimeout: number;
}
