# Circuit Breaker Implementation

This document describes the circuit breaker implementation for external services in the Delve application, designed to prevent cascading failures and improve system resilience.

## Overview

The circuit breaker pattern is implemented to protect external service calls from failures. It monitors the success/failure rate of service calls and automatically opens the circuit when failure conditions are met.

## Circuit Breaker Conditions

### Opening Conditions
- **Minimum Requests**: ≥10 requests must be made before checking failure rate
- **Failure Rate Threshold**: ≥50% failure rate triggers circuit opening
- **Monitoring Window**: 5-minute sliding window for request history

### State Transitions
1. **CLOSED** → **OPEN**: When failure conditions are met
2. **OPEN** → **HALF_OPEN**: After 10 minutes timeout
3. **HALF_OPEN** → **CLOSED**: On first successful request
4. **HALF_OPEN** → **OPEN**: On first failed request

## Implementation Details

### Circuit Breaker Service

The `CircuitBreakerService` provides the core functionality:

```typescript
// Execute a function with circuit breaker protection
await circuitBreakerService.execute('service-name', async () => {
    // Your service call here
    return await externalServiceCall();
});
```

### Configuration

Default configuration values:
```typescript
{
    failureThreshold: 10,        // ≥10 requests
    failureRateThreshold: 0.5,   // ≥50% failure rate
    timeout: 10 * 60 * 1000,     // 10 minutes
    resetTimeout: 10 * 60 * 1000, // 10 minutes
    monitoringPeriod: 5 * 60 * 1000 // 5 minutes
}
```

### Service Integration

All external services are integrated with circuit breakers:

1. **Analytics Service** (`analytics-service`)
2. **Email Service** (`email-service`)
3. **SMS Service** (`sms-service`)
4. **Test Runner Service** (`test-runner-service`)

## API Endpoints

### Get All Circuit Breaker Statistics
```http
GET /api/circuit-breaker/stats
```

Response:
```json
{
  "analytics-service": {
    "state": "CLOSED",
    "totalRequests": 15,
    "successfulRequests": 12,
    "failedRequests": 3,
    "failureRate": 0.2,
    "lastFailureTime": "2024-01-15T10:30:00.000Z",
    "nextAttemptTime": null,
    "consecutiveFailures": 0
  }
}
```

### Get Service-Specific Statistics
```http
GET /api/circuit-breaker/stats/{serviceName}
```

### Reset Circuit Breaker for Specific Service
```http
POST /api/circuit-breaker/reset/{serviceName}
```

### Reset All Circuit Breakers
```http
POST /api/circuit-breaker/reset
```

## Circuit Breaker States

### CLOSED State
- **Behavior**: All requests are allowed through
- **Monitoring**: Tracks success/failure rates
- **Transition**: Moves to OPEN when failure conditions are met

### OPEN State
- **Behavior**: All requests are immediately rejected
- **Error Message**: "Circuit breaker is OPEN for service: {serviceName}"
- **Transition**: Moves to HALF_OPEN after timeout period

### HALF_OPEN State
- **Behavior**: Allows limited requests to test service health
- **Success**: Moves to CLOSED on successful request
- **Failure**: Moves back to OPEN on failed request

## Monitoring and Logging

### Key Log Messages

#### Normal Operation
```
Circuit breaker success for analytics-service (150ms)
```

#### Circuit Opening
```
Circuit breaker opened for service: analytics-service
```

#### Circuit State Changes
```
Circuit breaker moved to HALF_OPEN state for service: analytics-service
Circuit breaker moved to CLOSED state for service: analytics-service
```

#### Request Blocking
```
Circuit breaker blocked request for analytics-service
```

### Metrics Tracked

- **Total Requests**: Total number of requests made
- **Successful Requests**: Number of successful requests
- **Failed Requests**: Number of failed requests
- **Failure Rate**: Percentage of failed requests
- **Consecutive Failures**: Number of consecutive failures
- **Last Failure Time**: Timestamp of last failure
- **Next Attempt Time**: When circuit will try half-open state

## Testing

### Manual Testing

1. **Start the application**:
   ```bash
   npm run start:dev
   ```

2. **Run the test script**:
   ```bash
   node test-circuit-breaker.js
   ```

3. **Monitor circuit breaker states**:
   ```bash
   curl http://localhost:3000/api/circuit-breaker/stats
   ```

### Test Scenarios

#### Scenario 1: Normal Operation
- Make requests with low failure rate
- Circuit breaker should remain CLOSED
- All requests should be allowed through

#### Scenario 2: Circuit Opening
- Make ≥10 requests with ≥50% failure rate
- Circuit breaker should open
- Subsequent requests should be blocked

#### Scenario 3: Half-Open Testing
- Wait for timeout period (10 minutes)
- Circuit should move to HALF_OPEN
- Test requests should be allowed

#### Scenario 4: Circuit Recovery
- Make successful request in HALF_OPEN state
- Circuit should move to CLOSED
- Normal operation should resume

## Configuration Options

### Custom Configuration

You can provide custom configuration when creating circuit breakers:

```typescript
const customConfig = {
    failureThreshold: 15,        // Custom minimum requests
    failureRateThreshold: 0.3,   // 30% failure rate threshold
    timeout: 5 * 60 * 1000,      // 5 minutes timeout
    resetTimeout: 5 * 60 * 1000, // 5 minutes reset
    monitoringPeriod: 3 * 60 * 1000 // 3 minutes monitoring
};

await circuitBreakerService.execute('service-name', operation, customConfig);
```

## Best Practices

### 1. Service Naming
- Use consistent, descriptive service names
- Include environment or version if needed
- Examples: `analytics-service`, `email-service-v2`

### 2. Error Handling
- Always handle circuit breaker exceptions
- Implement fallback mechanisms
- Log circuit breaker state changes

### 3. Monitoring
- Set up alerts for circuit breaker state changes
- Monitor failure rates and recovery times
- Track circuit breaker effectiveness

### 4. Testing
- Test circuit breaker behavior in staging
- Simulate failure scenarios
- Verify recovery mechanisms

## Troubleshooting

### Common Issues

#### Circuit Breaker Not Opening
- **Cause**: Failure rate below threshold
- **Solution**: Check service failure rates, adjust thresholds

#### Circuit Breaker Not Recovering
- **Cause**: Service still failing in HALF_OPEN state
- **Solution**: Check service health, adjust timeout values

#### False Positives
- **Cause**: Temporary network issues
- **Solution**: Adjust failure rate threshold, increase monitoring period

### Debug Commands

```bash
# Check all circuit breaker states
curl http://localhost:3000/api/circuit-breaker/stats

# Check specific service
curl http://localhost:3000/api/circuit-breaker/stats/analytics-service

# Reset specific service
curl -X POST http://localhost:3000/api/circuit-breaker/reset/analytics-service

# Reset all circuit breakers
curl -X POST http://localhost:3000/api/circuit-breaker/reset
```

## Production Considerations

### 1. Monitoring
- Set up alerts for circuit breaker state changes
- Monitor failure rates and recovery times
- Track service health metrics

### 2. Configuration
- Adjust thresholds based on service characteristics
- Consider different configurations for different services
- Monitor and tune timeout values

### 3. Fallback Strategies
- Implement fallback mechanisms for critical services
- Use cached data when services are unavailable
- Provide degraded functionality when possible

### 4. Load Testing
- Test circuit breaker behavior under load
- Verify recovery mechanisms
- Ensure proper resource cleanup

## Future Enhancements

### 1. Advanced Metrics
- Add latency percentiles
- Track response time distributions
- Monitor throughput metrics

### 2. Dynamic Configuration
- Runtime configuration changes
- A/B testing of circuit breaker settings
- Automatic threshold adjustment

### 3. Integration
- Prometheus metrics export
- Grafana dashboards
- Alert manager integration

### 4. Advanced Features
- Circuit breaker hierarchies
- Bulkhead isolation
- Retry mechanisms with backoff

## Conclusion

The circuit breaker implementation provides robust protection against external service failures while maintaining system availability. It automatically detects and responds to service degradation, preventing cascading failures and improving overall system resilience.

The implementation follows industry best practices and provides comprehensive monitoring and management capabilities through REST APIs and detailed logging.
