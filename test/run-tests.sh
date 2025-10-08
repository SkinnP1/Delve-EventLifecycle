#!/bin/bash

# Test runner script for Delve application
# This script runs all unit tests with proper configuration

echo "🧪 Running Delve Unit Tests"
echo "=========================="

# Set environment variables for testing
export NODE_ENV=test
export APP_NAME=Delve-Test
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_USERNAME=test
export DATABASE_PASSWORD=test
export DATABASE_NAME=delve_test
export KAFKA_BROKERS=localhost:9092
export KAFKA_CLIENT_ID=delve-test
export KAFKA_TOPIC_NAME=delve-test-topic
export KAFKA_DLQ_TOPIC_NAME=delve-test-dlq-topic

# Run tests with coverage
echo "Running unit tests with coverage..."
npm run test:cov

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed successfully!"
    echo ""
    echo "📊 Coverage report generated in ./coverage/"
    echo "📁 Open ./coverage/lcov-report/index.html to view detailed coverage"
else
    echo "❌ Some tests failed!"
    exit 1
fi
