# Simple Docker Setup for Delve

This setup provides PostgreSQL and Kafka with a single topic called `delve-kafka-topic`.

## Services

- **PostgreSQL**: Database on port 5432
- **Kafka**: Message broker on port 9092
- **Zookeeper**: Kafka dependency on port 2181

## Quick Start

1. **Start services:**
   ```bash
   docker-compose up -d
   ```

2. **Check status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## Connection Details

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: delve_db
- **Username**: postgres
- **Password**: password

### Kafka
- **Host**: localhost
- **Port**: 9092
- **Topic**: delve-kafka-topic

## Test Connections

Run the connection test script:
```bash
node test-connections.js
```

## Environment Variables

Use the `docker.env` file for your application configuration:
- Database connection settings
- Kafka broker settings
- Topic name: `delve-kafka-topic`

## Topic Creation

The `delve-kafka-topic` is automatically created when you start the services. It has:
- 3 partitions
- 1 replication factor
- Auto-creation enabled
