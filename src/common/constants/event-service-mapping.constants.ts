import { EventTypeEnum } from 'src/entities/enums/event-type.enum';

export enum ServiceNameEnum {
    NOTIFICATION_SERVICE = 'NotificationService',
    TEST_SERVICE = 'TestService',
    USER_SERVICE = 'UserService'
}

/**
 * Mapping of EventType to ServiceName
 * This constant defines which service should handle each event type
 */
export const EVENT_SERVICE_MAPPING = {
    // User events
    [EventTypeEnum.USER_CREATED]: ServiceNameEnum.USER_SERVICE,
    [EventTypeEnum.USER_UPDATED]: ServiceNameEnum.USER_SERVICE,
    [EventTypeEnum.USER_DELETED]: ServiceNameEnum.USER_SERVICE,

    // Test events
    [EventTypeEnum.TEST_RUN]: ServiceNameEnum.TEST_SERVICE,
    [EventTypeEnum.TEST_FAILED]: ServiceNameEnum.TEST_SERVICE,

    // Notification events
    [EventTypeEnum.NOTIFICATION_EMAIL]: ServiceNameEnum.NOTIFICATION_SERVICE,
    [EventTypeEnum.NOTIFICATION_SMS]: ServiceNameEnum.NOTIFICATION_SERVICE,
} as const;

