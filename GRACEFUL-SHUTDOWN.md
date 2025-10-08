# Graceful Shutdown Implementation

This document describes the graceful shutdown implementation for the Kafka-based NestJS application, ensuring that in-flight events are completed before shutdown.

## Overview

The graceful shutdown implementation ensures that:
- All in-flight Kafka messages are processed before shutdown
- New messages are not accepted during shutdown
- Active operations are tracked and completed
- The application responds to shutdown signals (SIGTERM, SIGINT, SIGHUP)
- A timeout mechanism prevents indefinite waiting

## Architecture

### Components

1. **Signal Handlers** (`main.ts`)
   - Listens for SIGTERM, SIGINT, and SIGHUP signals
   - Coordinates shutdown of Kafka services directly
   - Provides timeout mechanism (30 seconds)
   - Tracks and reports shutdown status

2. **KafkaConsumerService** (Enhanced)
   - Tracks active message processing operations
   - Stops accepting new messages during shutdown
   - Waits for in-flight operations to complete
   - Gracefully disconnects from Kafka
   - Provides shutdown status monitoring

3. **KafkaProducerService** (Enhanced)
   - Tracks active message production operations
   - Prevents new message production during shutdown
   - Waits for in-flight operations to complete
   - Gracefully disconnects from Kafka
   - Provides shutdown status monitoring

## Implementation Details

### Signal Handling

```typescript
// main.ts
process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, starting graceful shutdown...');
    await gracefulShutdown(app, logger);
});

// Direct coordination of Kafka services
const kafkaConsumer = app.get(KafkaConsumerService);
const kafkaProducer = app.get(KafkaProducerService);
```

### Operation Tracking

Each service tracks active operations using a `Set<string>`:

```typescript
private activeOperations = new Set<string>();
private isShuttingDown = false;

// Track operation start
const operationId = `${topic}-${partition}-${offset}`;
this.activeOperations.add(operationId);

// Track operation completion
this.activeOperations.delete(operationId);
```

### Graceful Shutdown Process

1. **Signal Received**: Application receives shutdown signal
2. **Service Coordination**: Main.ts directly coordinates Kafka services
3. **Shutdown Initiated**: `isShuttingDown` flag is set to true in each service
4. **New Operations Blocked**: New messages/operations are rejected
5. **Wait for Completion**: System waits for active operations to complete
6. **Timeout Handling**: After 30 seconds, shutdown proceeds forcefully
7. **Resource Cleanup**: Kafka connections are closed gracefully
8. **Status Reporting**: Final status is logged and reported

### Monitoring

The implementation provides monitoring endpoints:

- `GET /api/shutdown-status`: Returns current shutdown status
- `GET /api/health`: Returns system health including shutdown status

## Configuration

### Timeouts

- **Shutdown Timeout**: 30 seconds (configurable)
- **Operation Check Interval**: 1 second
- **Health Check Interval**: 2 seconds (in test script)

### Environment Variables

No additional environment variables are required. The implementation uses existing Kafka configuration.

## Usage

### Starting the Application

```bash
npm run start:dev
```

### Testing Graceful Shutdown

1. **Manual Testing**:
   ```bash
   # Start the application
   npm run start:dev
   
   # In another terminal, send shutdown signal
   kill -TERM <process_id>
   ```

2. **Automated Testing**:
   ```bash
   # Run the test script
   node graceful-shutdown-test.js
   ```

### Monitoring Shutdown Status

```bash
# Check shutdown status
curl http://localhost:3000/api/shutdown-status

# Check system health
curl http://localhost:3000/api/health
```

## API Endpoints

### GET /api/shutdown-status

Returns the current shutdown status:

```json
{
  "isShuttingDown": false,
  "consumerActiveOps": 0,
  "producerActiveOps": 0,
  "consumerShuttingDown": false,
  "producerShuttingDown": false
}
```

### GET /api/health

Returns system health including shutdown information:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "kafka": {
    "consumer": "connected",
    "producer": "connected"
  }
}
```

## Logging

The implementation provides comprehensive logging:

- **Shutdown Initiation**: Logs when shutdown starts
- **Operation Tracking**: Logs active operation counts
- **Progress Updates**: Logs shutdown progress every second
- **Completion**: Logs successful shutdown completion
- **Errors**: Logs any errors during shutdown

Example log output:
```
[Bootstrap] Graceful shutdown initiated...
[Bootstrap] Initial status - Consumer operations: 3, Producer operations: 1
[KafkaConsumerService] Starting graceful shutdown of Kafka consumer...
[KafkaConsumerService] Waiting for 3 active operations to complete...
[KafkaConsumerService] Kafka consumer stopped
[KafkaConsumerService] Kafka consumer disconnected
[KafkaProducerService] Starting graceful shutdown of Kafka producer...
[KafkaProducerService] Kafka producer disconnected
[Bootstrap] Final status - Consumer operations: 0, Producer operations: 0
[Bootstrap] Application closed successfully
```

## Error Handling

### Timeout Scenarios

If operations don't complete within the timeout:
- A warning is logged
- Shutdown proceeds forcefully
- Active operations are abandoned

### Connection Errors

If Kafka connections fail during shutdown:
- Errors are logged
- Shutdown continues with other services
- Process exits with error code 1

### Signal Handling Errors

If signal handling fails:
- Errors are logged
- Process exits with error code 1
- No graceful shutdown occurs

## Best Practices

1. **Operation Design**: Keep operations short and idempotent
2. **Error Handling**: Implement proper error handling in message processors
3. **Monitoring**: Monitor shutdown status in production
4. **Testing**: Test graceful shutdown regularly
5. **Documentation**: Document any custom shutdown requirements

## Troubleshooting

### Common Issues

1. **Shutdown Hangs**: Check for long-running operations
2. **Messages Lost**: Ensure operations are idempotent
3. **Connection Errors**: Verify Kafka connectivity
4. **Timeout Issues**: Adjust timeout values if needed

### Debugging

Enable debug logging to see detailed operation tracking:

```typescript
// In your service
this.logger.debug(`Active operations: ${this.activeOperations.size}`);
```

## Production Considerations

1. **Load Balancing**: Ensure proper load balancer configuration
2. **Health Checks**: Configure health checks to respect shutdown status
3. **Monitoring**: Set up alerts for shutdown events
4. **Rolling Deployments**: Use rolling deployments to minimize impact
5. **Resource Limits**: Set appropriate memory and CPU limits

## Future Enhancements

1. **Configurable Timeouts**: Make timeouts configurable via environment variables
2. **Metrics**: Add Prometheus metrics for shutdown events
3. **Circuit Breaker**: Integrate with circuit breaker pattern
4. **Database Shutdown**: Add graceful database connection shutdown
5. **Custom Handlers**: Allow custom shutdown handlers for business logic
