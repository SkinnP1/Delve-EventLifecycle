# Multiple Topic Subscription Example

This document demonstrates how to configure and use multiple Kafka topic subscriptions in your application.

## Configuration

### Environment Variables

Add the following environment variable to support multiple topics:

```bash
# Main topic (required)
KAFKA_TOPIC=main-events

# Additional topics (comma-separated, optional)
KAFKA_ADDITIONAL_TOPICS=user-events,notification-events,analytics-events,dlq-events
```

### Configuration Service

The `ConfigurationService` now supports multiple topics through the `additionalTopics` field:

```typescript
const kafkaConfig = this.configService.getKafkaConfig();
// kafkaConfig.topicName = "main-events"
// kafkaConfig.additionalTopics = ["user-events", "notification-events", "analytics-events", "dlq-events"]
```

## Usage Examples

### 1. Subscribe to All Configured Topics

```typescript
// Automatically subscribes to main topic + all additional topics
await kafkaConsumer.subscribeToAllConfiguredTopics(true);
```

### 2. Subscribe to Multiple Topics Manually

```typescript
const topics = ['user-events', 'notification-events', 'analytics-events'];
await kafkaConsumer.subscribeToMultipleTopics(topics, true);
```

### 3. Subscribe to Individual Topics

```typescript
// Subscribe to a single topic
await kafkaConsumer.subscribeToTopic('user-events', true);

// Add a new topic subscription dynamically
await kafkaConsumer.addTopicSubscription('new-topic', false);

// Remove a topic subscription
await kafkaConsumer.removeTopicSubscription('old-topic');
```

### 4. Get Currently Subscribed Topics

```typescript
const subscribedTopics = await kafkaConsumer.getSubscribedTopics();
console.log('Currently subscribed to:', subscribedTopics);
```

## Dynamic Topic Management

### Adding Topics at Runtime

```typescript
@Controller('kafka')
export class KafkaController {
    constructor(private readonly kafkaConsumer: KafkaConsumerService) {}

    @Post('subscribe/:topic')
    async subscribeToTopic(@Param('topic') topic: string) {
        await this.kafkaConsumer.addTopicSubscription(topic);
        return { message: `Subscribed to topic: ${topic}` };
    }

    @Delete('unsubscribe/:topic')
    async unsubscribeFromTopic(@Param('topic') topic: string) {
        await this.kafkaConsumer.removeTopicSubscription(topic);
        return { message: `Unsubscribed from topic: ${topic}` };
    }

    @Get('topics')
    async getSubscribedTopics() {
        const topics = await this.kafkaConsumer.getSubscribedTopics();
        return { topics };
    }
}
```

### Batch Topic Management

```typescript
// Subscribe to multiple topics at once
const newTopics = ['topic1', 'topic2', 'topic3'];
await kafkaConsumer.subscribeToMultipleTopics(newTopics, false);

// Remove multiple topics
for (const topic of ['old-topic1', 'old-topic2']) {
    await kafkaConsumer.removeTopicSubscription(topic);
}
```

## Message Processing

The message processing remains the same regardless of which topic the message comes from:

```typescript
await kafkaConsumer.startConsuming(async (payload) => {
    console.log(`Message from topic: ${payload.topic}`);
    console.log(`Message key: ${payload.message.key?.toString()}`);
    console.log(`Message value: ${payload.message.value?.toString()}`);
    
    // Process the message
    await kafkaConsumer.processMessage(payload);
});
```

## Configuration Examples

### Development Environment

```bash
KAFKA_TOPIC=dev-events
KAFKA_ADDITIONAL_TOPICS=dev-user-events,dev-notification-events
```

### Production Environment

```bash
KAFKA_TOPIC=prod-events
KAFKA_ADDITIONAL_TOPICS=prod-user-events,prod-notification-events,prod-analytics-events,prod-audit-events
```

### Testing Environment

```bash
KAFKA_TOPIC=test-events
KAFKA_ADDITIONAL_TOPICS=test-user-events,test-notification-events,test-dlq-events
```

## Best Practices

1. **Topic Naming**: Use consistent naming conventions (e.g., `{environment}-{service}-events`)

2. **Error Handling**: Always wrap topic subscription calls in try-catch blocks

3. **Monitoring**: Log topic subscriptions and unsubscriptions for debugging

4. **Resource Management**: Be mindful of the number of topics to avoid overwhelming the consumer

5. **Configuration**: Use environment-specific topic configurations

## Troubleshooting

### Common Issues

1. **Topic Not Found**: Ensure topics exist in Kafka before subscribing
2. **Permission Denied**: Check Kafka ACLs for topic access
3. **Consumer Group Conflicts**: Use unique group IDs for different environments
4. **Memory Issues**: Limit the number of concurrent topic subscriptions

### Debugging

```typescript
// Check current subscriptions
const topics = await kafkaConsumer.getSubscribedTopics();
console.log('Active subscriptions:', topics);

// Monitor consumer group
const groupInfo = await kafkaConsumer.consumer.describeGroup();
console.log('Consumer group info:', groupInfo);
```
