export declare class KafkaConfigDto {
    brokers: string[];
    clientId: string;
    groupId: string;
    topicName: string;
    autoOffsetReset: string;
    sessionTimeout: number;
    heartbeatInterval: number;
    maxPollRecords: number;
    enableAutoCommit: boolean;
    retryBackoff: number;
    retryAttempts: number;
    sslEnabled: boolean;
    saslMechanism: string;
    saslUsername?: string;
    saslPassword?: string;
    securityProtocol: string;
    consumerTimeout: number;
    producerAcks: string;
    producerRetries: number;
    producerBatchSize: number;
    producerLingerMs: number;
    producerBufferMemory: number;
    producerCompressionType: string;
    dlqTopicName: string;
}
