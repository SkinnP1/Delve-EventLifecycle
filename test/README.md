# Delve Unit Tests

This directory contains comprehensive unit tests for the Delve application, covering validation, retry delay calculation, circuit breaker logic, and stage processing.

## Test Structure

```
test/
├── jest.config.js              # Jest configuration
├── setup.ts                    # Test setup and global utilities
├── run-tests.sh                # Test runner script
├── README.md                   # This file
└── unit/                       # Unit test files
    ├── circuit-breaker.service.spec.ts
    ├── retry-delay.service.spec.ts
    ├── validation.service.spec.ts
    ├── stage-processing.service.spec.ts
    └── kafka-producer.service.spec.ts
```

## Test Categories

### 1. Circuit Breaker Logic (`circuit-breaker.service.spec.ts`)
Tests the circuit breaker pattern implementation including:
- **State Management**: CLOSED, OPEN, HALF_OPEN transitions
- **Failure Threshold**: Opening circuit when failure rate exceeds threshold
- **Timeout Handling**: Transitioning from OPEN to HALF_OPEN after timeout
- **Success Recovery**: Closing circuit on successful requests
- **Statistics**: Tracking request counts, failure rates, and state changes
- **Configuration**: Custom circuit breaker configurations

### 2. Retry Delay Calculation (`retry-delay.service.spec.ts`)
Tests the exponential backoff retry mechanism including:
- **Exponential Backoff**: `Math.min(300, 1 * Math.pow(2, retryCount))`
- **Retry Limits**: Maximum retry count of 3
- **Delay Capping**: Maximum delay of 300ms
- **Database Integration**: Updating retry counts and next retry times
- **Error Handling**: Proper error message storage and retry triggering

### 3. Validation Logic (`validation.service.spec.ts`)
Tests data validation across different stages including:
- **Data Validation**: User data format validation
- **Email Validation**: Email format and required field validation
- **Field Validation**: Required fields, data types, and format validation
- **Error Handling**: Validation error handling and retry mechanisms
- **Edge Cases**: Null, undefined, and empty string handling

### 4. Stage Processing (`stage-processing.service.spec.ts`)
Tests the event processing pipeline including:
- **User Created Flow**: VALIDATE_DATA → SEND_WELCOME_EMAIL → CREATE_PROFILE → PUBLISH_ANALYTICS
- **User Updated Flow**: VALIDATE_PAYLOAD → SYNC_ANALYTICS → UPDATE_SEARCH_INDEX → INVALIDATE_CACHE
- **User Deleted Flow**: SOFT_DELETE → QUEUE_DATA_EXPORT → REMOVE_FROM_INDICES → SEND_CONFIRMATION
- **Stage Resumption**: Processing from specific event stages
- **Error Handling**: Stage failure handling and retry mechanisms

### 5. Kafka Producer Service (`kafka-producer.service.spec.ts`)
Tests Kafka message production and retry logic including:
- **Message Production**: Basic message sending with proper formatting
- **Retry Logic**: Retry message handling with exponential backoff
- **DLQ Handling**: Dead letter queue processing for failed messages
- **Batch Processing**: Batch message sending
- **Partition Handling**: Message sending with specific partitions
- **Graceful Shutdown**: Active operation tracking and shutdown handling

## Running Tests

### Prerequisites
- Node.js 18+
- npm or yarn
- All dependencies installed (`npm install`)

### Running All Tests
```bash
# Run all tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run tests once
npm run test
```

### Using the Test Runner Script
```bash
# Make script executable (if not already)
chmod +x test/run-tests.sh

# Run tests with the script
./test/run-tests.sh
```

### Running Specific Test Files
```bash
# Run only circuit breaker tests
npm test -- circuit-breaker.service.spec.ts

# Run only validation tests
npm test -- validation.service.spec.ts

# Run only stage processing tests
npm test -- stage-processing.service.spec.ts
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Test Environment**: Node.js
- **Coverage**: Comprehensive coverage reporting
- **Setup**: Global test utilities and environment variables
- **Module Mapping**: Proper module resolution for imports

### Test Setup (`setup.ts`)
- **Environment Variables**: Test-specific configuration
- **Global Utilities**: Mock data generators and test helpers
- **Mock Objects**: Pre-configured mock objects for consistent testing

## Mock Data and Utilities

### Global Test Utilities
The test setup provides global utilities accessible via `global.testUtils`:

```typescript
// Mock Kafka Entry
const mockKafkaEntry = global.testUtils.createMockKafkaEntry({
  id: 1,
  referenceId: 'test-ref-123',
  eventStage: 'VALIDATE_DATA',
  retryCount: 0,
  // ... other properties
});

// Mock Kafka Message
const mockKafkaMessage = global.testUtils.createMockKafkaMessage({
  headers: {
    eventType: 'USER_CREATED',
    eventStage: null,
  },
  data: { userId: '123', email: 'test@example.com' }
});

// Mock Circuit Breaker
const mockCircuitBreaker = global.testUtils.createMockCircuitBreaker({
  state: 'CLOSED',
  totalRequests: 0,
  // ... other properties
});
```

## Coverage Reports

After running tests with coverage, you can view detailed coverage reports:

1. **HTML Report**: Open `./coverage/lcov-report/index.html` in your browser
2. **Terminal Output**: Coverage summary is displayed in the terminal
3. **LCOV Format**: Coverage data is available in `./coverage/lcov.info`

## Test Best Practices

### 1. Test Isolation
- Each test is independent and doesn't affect others
- Proper setup and teardown for each test
- Mock external dependencies consistently

### 2. Comprehensive Coverage
- Test happy path scenarios
- Test error conditions and edge cases
- Test boundary conditions and limits

### 3. Clear Test Names
- Descriptive test names that explain what is being tested
- Grouped tests by functionality
- Consistent naming conventions

### 4. Mock Management
- Use consistent mock objects across tests
- Proper mock setup and verification
- Clean up mocks after each test

## Adding New Tests

### 1. Create Test File
Create a new `.spec.ts` file in the `test/unit/` directory following the naming convention:
`{service-name}.spec.ts`

### 2. Test Structure
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from '../../src/path/to/your-service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    // Setup test module
  });

  describe('Feature Group', () => {
    it('should test specific functionality', async () => {
      // Test implementation
    });
  });
});
```

### 3. Use Global Utilities
Leverage the global test utilities for consistent mock data:
```typescript
const mockData = global.testUtils.createMockKafkaEntry({
  // Override specific properties
});
```

### 4. Follow Naming Conventions
- Test files: `{service-name}.spec.ts`
- Test descriptions: Clear, descriptive names
- Group related tests with `describe` blocks

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure proper module mapping in jest.config.js
2. **Mock Issues**: Verify mock setup and cleanup
3. **Async Tests**: Use proper async/await patterns
4. **Environment Variables**: Check test environment setup

### Debug Mode
Run tests in debug mode for detailed output:
```bash
npm run test:debug
```

### Watch Mode
Use watch mode for development:
```bash
npm run test:watch
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Consistent test environment
- Comprehensive coverage reporting
- Clear pass/fail indicators

## Performance Considerations

- Tests run in parallel where possible
- Mock external services to avoid network calls
- Use efficient test data structures
- Clean up resources after each test
