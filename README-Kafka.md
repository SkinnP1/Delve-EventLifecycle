# Kafka Startup Guide for Delve

This guide explains how to start the Delve application with Kafka using Docker Compose.

## Quick Start

### 1. Start All Services
```bash
docker-compose up -d
```

### 2. Check Service Status
```bash
docker-compose ps
```

### 3. View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f kafka
```

## Service Architecture

The application includes the following services:

### Core Services
- **PostgreSQL** (port 5432) - Database
- **Zookeeper** (port 2181) - Kafka coordination
- **Kafka** (port 9092) - Message broker
- **App** (port 3000) - NestJS application

### Management Services
- **Kafka UI** (port 8080) - Web interface for Kafka management
- **Kafka Topics** - Creates required topics on startup

## Startup Sequence

1. **PostgreSQL** starts first
2. **Zookeeper** starts and waits for health check
3. **Kafka** starts after Zookeeper is healthy
4. **Kafka Topics** creates the `delve-kafka-topic` topic
5. **App** starts after all dependencies are ready
6. **Kafka UI** provides web interface

## Configuration

### Environment Variables
All configuration is managed through environment variables in `docker-compose.yml`:

- **Application**: `APP_NAME`, `APP_PORT`, `NODE_ENV`
- **Database**: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
- **Kafka**: `KAFKA_BROKERS`, `KAFKA_TOPIC`, `KAFKA_GROUP_ID`

### Kafka Configuration
- **Broker**: `kafka:29092` (internal), `localhost:9092` (external)
- **Topic**: `delve-kafka-topic` (3 partitions, replication factor 1)
- **Auto-create topics**: Enabled
- **Security**: PLAINTEXT (no SSL/SASL)

## Health Checks

### Application Health
```bash
curl http://localhost:3000/health
```

### Kafka Health
```bash
# Check Kafka broker
docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# List topics
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

## Monitoring

### Kafka UI
Access the web interface at: http://localhost:8080

Features:
- View topics and messages
- Monitor consumer groups
- Browse message content
- View broker metrics

### Application Logs
```bash
# Real-time logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

## Troubleshooting

### Common Issues

1. **Kafka not starting**
   ```bash
   # Check Zookeeper logs
   docker-compose logs zookeeper
   
   # Restart Kafka
   docker-compose restart kafka
   ```

2. **App not connecting to Kafka**
   ```bash
   # Check if topic exists
   docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
   
   # Check app logs
   docker-compose logs app
   ```

3. **Port conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :9092
   ```

### Reset Everything
```bash
# Stop and remove all containers
docker-compose down -v

# Remove all volumes (WARNING: This deletes all data)
docker-compose down -v --remove-orphans

# Start fresh
docker-compose up -d
```

## Development

### Local Development
```bash
# Start only infrastructure
docker-compose up -d postgres kafka zookeeper kafka-ui

# Run app locally
npm run start:dev
```

### Testing Kafka
```bash
# Produce a message
docker-compose exec kafka kafka-console-producer --bootstrap-server localhost:9092 --topic delve-kafka-topic

# Consume messages
docker-compose exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic delve-kafka-topic --from-beginning
```

## Production Considerations

1. **Security**: Enable SSL/SASL authentication
2. **Persistence**: Use external volumes for data
3. **Scaling**: Configure multiple Kafka brokers
4. **Monitoring**: Add Prometheus/Grafana for metrics
5. **Backup**: Regular database and Kafka data backups
