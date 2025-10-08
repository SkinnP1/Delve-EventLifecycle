import { Injectable, Logger } from '@nestjs/common';

export enum CircuitBreakerState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
    failureThreshold: number;        // Minimum number of requests before checking failure rate
    failureRateThreshold: number;     // Failure rate threshold (0.5 = 50%)
    timeout: number;                  // Time in milliseconds to wait before trying half-open
    resetTimeout: number;            // Time in milliseconds to wait before resetting to closed
    monitoringPeriod: number;        // Time window for monitoring requests
}

export interface CircuitBreakerStats {
    state: CircuitBreakerState;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    failureRate: number;
    lastFailureTime: Date | null;
    nextAttemptTime: Date | null;
    consecutiveFailures: number;
}

@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger(CircuitBreakerService.name);
    private readonly circuitBreakers = new Map<string, {
        state: CircuitBreakerState;
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        lastFailureTime: Date | null;
        nextAttemptTime: Date | null;
        consecutiveFailures: number;
        requestHistory: Array<{ timestamp: Date; success: boolean }>;
        config: CircuitBreakerConfig;
    }>();

    private readonly defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 10,        // ≥10 requests
        failureRateThreshold: 0.5,   // ≥50% failure rate
        timeout: 10 * 60 * 1000,     // 10 minutes
        resetTimeout: 10 * 60 * 1000, // 10 minutes
        monitoringPeriod: 5 * 60 * 1000 // 5 minutes
    };

    /**
     * Execute a function with circuit breaker protection
     */
    async execute<T>(
        serviceName: string,
        operation: () => Promise<T>,
        config?: Partial<CircuitBreakerConfig>
    ): Promise<T> {
        const circuitBreaker = this.getOrCreateCircuitBreaker(serviceName, config);

        // Check if circuit breaker should allow the request
        if (!this.shouldAllowRequest(circuitBreaker)) {
            const error = new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
            this.logger.warn(`Circuit breaker blocked request for ${serviceName}`, {
                state: circuitBreaker.state,
                nextAttemptTime: circuitBreaker.nextAttemptTime
            });
            throw error;
        }

        const startTime = Date.now();
        let success = false;

        try {
            const result = await operation();
            success = true;
            this.recordSuccess(circuitBreaker);
            this.logger.debug(`Circuit breaker success for ${serviceName} (${Date.now() - startTime}ms)`);
            return result;
        } catch (error) {
            this.recordFailure(circuitBreaker);
            this.logger.warn(`Circuit breaker failure for ${serviceName} (${Date.now() - startTime}ms):`, error);
            throw error;
        }
    }

    /**
     * Get circuit breaker statistics for a service
     */
    getStats(serviceName: string): CircuitBreakerStats | null {
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (!circuitBreaker) {
            return null;
        }

        return {
            state: circuitBreaker.state,
            totalRequests: circuitBreaker.totalRequests,
            successfulRequests: circuitBreaker.successfulRequests,
            failedRequests: circuitBreaker.failedRequests,
            failureRate: this.calculateFailureRate(circuitBreaker),
            lastFailureTime: circuitBreaker.lastFailureTime,
            nextAttemptTime: circuitBreaker.nextAttemptTime,
            consecutiveFailures: circuitBreaker.consecutiveFailures
        };
    }

    /**
     * Get all circuit breaker states
     */
    getAllCircuitBreakerStates(): Record<string, string> {
        const states: Record<string, string> = {};
        for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
            states[serviceName] = circuitBreaker.state.toLowerCase();
        }
        return states;
    }

    /**
     * Get all circuit breaker statistics
     */
    getAllStats(): Map<string, CircuitBreakerStats> {
        const stats = new Map<string, CircuitBreakerStats>();
        for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
            stats.set(serviceName, this.getStats(serviceName)!);
        }
        return stats;
    }

    /**
     * Reset circuit breaker for a specific service
     */
    reset(serviceName: string): void {
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (circuitBreaker) {
            circuitBreaker.state = CircuitBreakerState.CLOSED;
            circuitBreaker.totalRequests = 0;
            circuitBreaker.successfulRequests = 0;
            circuitBreaker.failedRequests = 0;
            circuitBreaker.lastFailureTime = null;
            circuitBreaker.nextAttemptTime = null;
            circuitBreaker.consecutiveFailures = 0;
            circuitBreaker.requestHistory = [];

            this.logger.log(`Circuit breaker reset for service: ${serviceName}`);
        }
    }

    /**
     * Reset all circuit breakers
     */
    resetAll(): void {
        for (const serviceName of this.circuitBreakers.keys()) {
            this.reset(serviceName);
        }
        this.logger.log('All circuit breakers reset');
    }

    private getOrCreateCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>) {
        let circuitBreaker = this.circuitBreakers.get(serviceName);

        if (!circuitBreaker) {
            const finalConfig = { ...this.defaultConfig, ...config };
            circuitBreaker = {
                state: CircuitBreakerState.CLOSED,
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                lastFailureTime: null,
                nextAttemptTime: null,
                consecutiveFailures: 0,
                requestHistory: [],
                config: finalConfig
            };
            this.circuitBreakers.set(serviceName, circuitBreaker);
            this.logger.log(`Circuit breaker created for service: ${serviceName}`, finalConfig);
        }

        return circuitBreaker;
    }

    private shouldAllowRequest(circuitBreaker: any): boolean {
        const now = new Date();

        switch (circuitBreaker.state) {
            case CircuitBreakerState.CLOSED:
                return true;

            case CircuitBreakerState.OPEN:
                // Check if timeout period has passed
                if (circuitBreaker.nextAttemptTime && now >= circuitBreaker.nextAttemptTime) {
                    circuitBreaker.state = CircuitBreakerState.HALF_OPEN;
                    circuitBreaker.nextAttemptTime = null;
                    this.logger.log(`Circuit breaker moved to HALF_OPEN state for service: ${circuitBreaker.serviceName}`);
                    return true;
                }
                return false;

            case CircuitBreakerState.HALF_OPEN:
                return true;

            default:
                return true;
        }
    }

    private recordSuccess(circuitBreaker: any): void {
        const now = new Date();
        circuitBreaker.totalRequests++;
        circuitBreaker.successfulRequests++;
        circuitBreaker.consecutiveFailures = 0;

        // Add to request history
        circuitBreaker.requestHistory.push({ timestamp: now, success: true });
        this.cleanupRequestHistory(circuitBreaker);

        // If in HALF_OPEN state and we have a successful request, move to CLOSED
        if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
            circuitBreaker.state = CircuitBreakerState.CLOSED;
            this.logger.log(`Circuit breaker moved to CLOSED state for service: ${circuitBreaker.serviceName}`);
        }
    }

    private recordFailure(circuitBreaker: any): void {
        const now = new Date();
        circuitBreaker.totalRequests++;
        circuitBreaker.failedRequests++;
        circuitBreaker.consecutiveFailures++;
        circuitBreaker.lastFailureTime = now;

        // Add to request history
        circuitBreaker.requestHistory.push({ timestamp: now, success: false });
        this.cleanupRequestHistory(circuitBreaker);

        // Check if we should open the circuit breaker
        if (this.shouldOpenCircuitBreaker(circuitBreaker)) {
            circuitBreaker.state = CircuitBreakerState.OPEN;
            circuitBreaker.nextAttemptTime = new Date(now.getTime() + circuitBreaker.config.timeout);
            this.logger.warn(`Circuit breaker opened for service: ${circuitBreaker.serviceName}`, {
                totalRequests: circuitBreaker.totalRequests,
                failedRequests: circuitBreaker.failedRequests,
                failureRate: this.calculateFailureRate(circuitBreaker),
                nextAttemptTime: circuitBreaker.nextAttemptTime
            });
        }
    }

    private shouldOpenCircuitBreaker(circuitBreaker: any): boolean {
        // Must have at least the minimum number of requests
        if (circuitBreaker.totalRequests < circuitBreaker.config.failureThreshold) {
            return false;
        }

        // Calculate failure rate
        const failureRate = this.calculateFailureRate(circuitBreaker);

        // Open if failure rate exceeds threshold
        return failureRate >= circuitBreaker.config.failureRateThreshold;
    }

    private calculateFailureRate(circuitBreaker: any): number {
        if (circuitBreaker.totalRequests === 0) {
            return 0;
        }
        return circuitBreaker.failedRequests / circuitBreaker.totalRequests;
    }

    private cleanupRequestHistory(circuitBreaker: any): void {
        const cutoffTime = new Date(Date.now() - circuitBreaker.config.monitoringPeriod);
        circuitBreaker.requestHistory = circuitBreaker.requestHistory.filter(
            (entry: any) => entry.timestamp >= cutoffTime
        );
    }
}
