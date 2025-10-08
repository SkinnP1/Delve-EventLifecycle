#!/bin/bash

# Startup script for Delve application with Kafka
echo "🚀 Starting Delve application with Kafka..."

# Wait for Kafka to be ready using netcat
echo "⏳ Waiting for Kafka to be ready..."
until nc -z kafka 29092; do
    echo "Kafka is not ready yet, waiting..."
    sleep 5
done

echo "✅ Kafka is ready!"

# Wait a bit more for Kafka to fully initialize
echo "⏳ Waiting for Kafka to fully initialize..."
sleep 10

echo "✅ Kafka is fully initialized!"

# Start the application
echo "🚀 Starting Delve application..."
exec npm run start:prod
