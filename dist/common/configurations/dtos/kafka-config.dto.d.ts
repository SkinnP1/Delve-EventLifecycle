export declare class KafkaConfigDto {
    brokers: string[];
    clientId: string;
    groupId: string;
    topicPrefix: string;
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
}
