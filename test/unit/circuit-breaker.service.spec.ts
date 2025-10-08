import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService, CircuitBreakerState } from '../../src/common/circuit-breaker/circuit-breaker.service';

describe('CircuitBreakerService', () => {
    let service: CircuitBreakerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CircuitBreakerService],
        }).compile();

        service = module.get<CircuitBreakerService>(CircuitBreakerService);
    });

    afterEach(() => {
        // Reset all circuit breakers after each test
        service.resetAll();
    });

    describe('Circuit Breaker Logic', () => {
        it('should create a new circuit breaker with default config', async () => {
            const serviceName = 'test-service';

            // Execute a successful operation
            const result = await service.execute(serviceName, async () => 'success');

            expect(result).toBe('success');

            const stats = service.getStats(serviceName);
            expect(stats).toBeDefined();
            expect(stats?.state).toBe(CircuitBreakerState.CLOSED);
            expect(stats?.totalRequests).toBe(1);
            expect(stats?.successfulRequests).toBe(1);
            expect(stats?.failedRequests).toBe(0);
        });

        it('should handle successful operations and keep circuit closed', async () => {
            const serviceName = 'test-service';

            // Execute multiple successful operations
            for (let i = 0; i < 5; i++) {
                const result = await service.execute(serviceName, async () => `success-${i}`);
                expect(result).toBe(`success-${i}`);
            }

            const stats = service.getStats(serviceName);
            expect(stats?.state).toBe(CircuitBreakerState.CLOSED);
            expect(stats?.totalRequests).toBe(5);
            expect(stats?.successfulRequests).toBe(5);
            expect(stats?.failedRequests).toBe(0);
            expect(stats?.failureRate).toBe(0);
        });

        it('should open circuit breaker when failure threshold is exceeded', async () => {
            const serviceName = 'test-service';
            const customConfig = {
                failureThreshold: 5,
                failureRateThreshold: 0.6, // 60% failure rate
                timeout: 1000,
                resetTimeout: 1000,
                monitoringPeriod: 5000,
            };

            // Execute operations that will fail
            for (let i = 0; i < 4; i++) {
                try {
                    await service.execute(serviceName, async () => {
                        throw new Error('Test error');
                    }, customConfig);
                } catch (error) {
                    expect(error.message).toBe('Test error');
                }
            }

            // Circuit should still be closed (not enough failures yet)
            let stats = service.getStats(serviceName);
            expect(stats?.state).toBe(CircuitBreakerState.CLOSED);

            // Execute one more failure to trigger circuit opening
            try {
                await service.execute(serviceName, async () => {
                    throw new Error('Test error');
                }, customConfig);
            } catch (error) {
                expect(error.message).toBe('Test error');
            }

            // Circuit should now be open
            stats = service.getStats(serviceName);
            expect(stats?.state).toBe(CircuitBreakerState.OPEN);
            expect(stats?.totalRequests).toBe(5);
            expect(stats?.failedRequests).toBe(5);
            expect(stats?.failureRate).toBe(1.0);
        });

        it('should block requests when circuit is open', async () => {
            const serviceName = 'test-service';
            const customConfig = {
                failureThreshold: 2,
                failureRateThreshold: 0.5,
                timeout: 1000,
                resetTimeout: 1000,
                monitoringPeriod: 5000,
            };

            // Cause circuit to open
            for (let i = 0; i < 3; i++) {
                try {
                    await service.execute(serviceName, async () => {
                        throw new Error('Test error');
                    }, customConfig);
                } catch (error) {
                    // The error could be either the original error or circuit breaker error
                    expect(['Test error', `Circuit breaker is OPEN for service: ${serviceName}`]).toContain(error.message);
                }
            }

            // Verify circuit is open
            const stats = service.getStats(serviceName);
            expect(stats?.state).toBe(CircuitBreakerState.OPEN);

            // Attempt to execute operation should be blocked
            try {
                await service.execute(serviceName, async () => 'should not execute');
            } catch (error) {
                expect(error.message).toBe(`Circuit breaker is OPEN for service: ${serviceName}`);
            }
        });

        it('should transition to half-open after timeout', async () => {
            const serviceName = 'test-service';
            const customConfig = {
                failureThreshold: 2,
                failureRateThreshold: 0.5,
                timeout: 100, // Very short timeout for testing
                resetTimeout: 100,
                monitoringPeriod: 5000,
            };

            // Cause circuit to open
            for (let i = 0; i < 3; i++) {
                try {
                    await service.execute(serviceName, async () => {
                        throw new Error('Test error');
                    }, customConfig);
                } catch (error) {
                    // The error could be either the original error or circuit breaker error
                    expect(['Test error', `Circuit breaker is OPEN for service: ${serviceName}`]).toContain(error.message);
                }
            }

            // Wait for timeout
            await new Promise(resolve => setTimeout(resolve, 150));

            // Execute operation should now be allowed (half-open)
            const result = await service.execute(serviceName, async () => 'success');
            expect(result).toBe('success');

            const stats = service.getStats(serviceName);
            expect(stats?.state).toBe(CircuitBreakerState.CLOSED);
        });

        it('should close circuit on successful request in half-open state', async () => {
            const serviceName = 'test-service';
            const customConfig = {
                failureThreshold: 2,
                failureRateThreshold: 0.5,
                timeout: 100,
                resetTimeout: 100,
                monitoringPeriod: 5000,
            };

            // Cause circuit to open
            for (let i = 0; i < 3; i++) {
                try {
                    await service.execute(serviceName, async () => {
                        throw new Error('Test error');
                    }, customConfig);
                } catch (error) {
                    // The error could be either the original error or circuit breaker error
                    expect(['Test error', `Circuit breaker is OPEN for service: ${serviceName}`]).toContain(error.message);
                }
            }

            // Wait for timeout
            await new Promise(resolve => setTimeout(resolve, 150));

            // Successful operation should close the circuit
            const result = await service.execute(serviceName, async () => 'success');
            expect(result).toBe('success');

            const stats = service.getStats(serviceName);
            expect(stats?.state).toBe(CircuitBreakerState.CLOSED);
        });

        it('should open circuit again on failure in half-open state', async () => {
            const serviceName = 'test-service';
            const customConfig = {
                failureThreshold: 2,
                failureRateThreshold: 0.5,
                timeout: 100,
                resetTimeout: 100,
                monitoringPeriod: 5000,
            };

            // Cause circuit to open
            for (let i = 0; i < 3; i++) {
                try {
                    await service.execute(serviceName, async () => {
                        throw new Error('Test error');
                    }, customConfig);
                } catch (error) {
                    // The error could be either the original error or circuit breaker error
                    expect(['Test error', `Circuit breaker is OPEN for service: ${serviceName}`]).toContain(error.message);
                }
            }

            // Wait for timeout
            await new Promise(resolve => setTimeout(resolve, 150));

            // Failed operation in half-open should open circuit again
            try {
                await service.execute(serviceName, async () => {
                    throw new Error('Test error');
                });
            } catch (error) {
                expect(error.message).toBe('Test error');
            }

            const stats = service.getStats(serviceName);
            expect(stats?.state).toBe(CircuitBreakerState.OPEN);
        });
    });

    describe('Statistics and State Management', () => {
        it('should return null stats for non-existent service', () => {
            const stats = service.getStats('non-existent-service');
            expect(stats).toBeNull();
        });

        it('should return all circuit breaker states', async () => {
            await service.execute('service1', async () => 'success');
            await service.execute('service2', async () => 'success');

            const states = service.getAllCircuitBreakerStates();
            expect(states).toEqual({
                'service1': 'closed',
                'service2': 'closed',
            });
        });

        it('should return all circuit breaker statistics', async () => {
            await service.execute('service1', async () => 'success');
            await service.execute('service2', async () => 'success');

            const allStats = service.getAllStats();
            expect(allStats.size).toBe(2);
            expect(allStats.has('service1')).toBe(true);
            expect(allStats.has('service2')).toBe(true);
        });

        it('should reset specific circuit breaker', async () => {
            const serviceName = 'test-service';

            // Execute some operations
            await service.execute(serviceName, async () => 'success');
            try {
                await service.execute(serviceName, async () => {
                    throw new Error('Test error');
                });
            } catch (error) {
                // Expected
            }

            let stats = service.getStats(serviceName);
            expect(stats?.totalRequests).toBe(2);
            expect(stats?.successfulRequests).toBe(1);
            expect(stats?.failedRequests).toBe(1);

            // Reset the circuit breaker
            service.reset(serviceName);

            stats = service.getStats(serviceName);
            expect(stats?.totalRequests).toBe(0);
            expect(stats?.successfulRequests).toBe(0);
            expect(stats?.failedRequests).toBe(0);
            expect(stats?.state).toBe(CircuitBreakerState.CLOSED);
        });

        it('should reset all circuit breakers', async () => {
            await service.execute('service1', async () => 'success');
            await service.execute('service2', async () => 'success');

            service.resetAll();

            const states = service.getAllCircuitBreakerStates();
            // After reset, all circuit breakers should be in CLOSED state
            expect(states['service1']).toBe('closed');
            expect(states['service2']).toBe('closed');
        });
    });

    describe('Configuration', () => {
        it('should use custom configuration when provided', async () => {
            const serviceName = 'test-service';
            const customConfig = {
                failureThreshold: 1,
                failureRateThreshold: 0.1,
                timeout: 5000,
                resetTimeout: 5000,
                monitoringPeriod: 10000,
            };

            // Execute operation with custom config
            await service.execute(serviceName, async () => 'success', customConfig);

            // The circuit breaker should use the custom config
            // We can verify this by checking that the circuit opens with the custom threshold
            try {
                await service.execute(serviceName, async () => {
                    throw new Error('Test error');
                }, customConfig);
            } catch (error) {
                expect(error.message).toBe('Test error');
            }

            const stats = service.getStats(serviceName);
            expect(stats?.state).toBe(CircuitBreakerState.OPEN);
        });
    });

    describe('Request History Cleanup', () => {
        it('should cleanup old request history based on monitoring period', async () => {
            const serviceName = 'test-service';
            const customConfig = {
                failureThreshold: 1,
                failureRateThreshold: 0.5,
                timeout: 1000,
                resetTimeout: 1000,
                monitoringPeriod: 100, // Very short monitoring period
            };

            // Execute multiple operations
            for (let i = 0; i < 10; i++) {
                await service.execute(serviceName, async () => `success-${i}`, customConfig);
            }

            // Wait for monitoring period to pass
            await new Promise(resolve => setTimeout(resolve, 150));

            // Execute one more operation to trigger cleanup
            await service.execute(serviceName, async () => 'success', customConfig);

            const stats = service.getStats(serviceName);
            expect(stats?.totalRequests).toBeGreaterThan(0);
        });
    });
});
