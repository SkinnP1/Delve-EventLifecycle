#!/bin/bash

# Startup script for Delve application with Kafka
echo "🚀 Starting Delve application with Kafka..."

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka to be ready..."
until kafka-broker-api-versions --bootstrap-server kafka:29092; do
    echo "Kafka is not ready yet, waiting..."
    sleep 5
done

echo "✅ Kafka is ready!"

# Wait for the topic to be created
echo "⏳ Waiting for Kafka topic to be created..."
until kafka-topics --bootstrap-server kafka:29092 --list | grep -q "delve-kafka-topic"; do
    echo "Topic not ready yet, waiting..."
    sleep 5
done

echo "✅ Kafka topic 'delve-kafka-topic' is ready!"

# Start the application
echo "🚀 Starting Delve application..."
exec npm run start:prod
