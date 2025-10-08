# Delve

A comprehensive NestJS application with Kafka integration, PostgreSQL database, and microservices architecture.

## 🚀 Overview

Delve is a robust NestJS application that demonstrates enterprise-level patterns including:
- **Event-driven architecture** with Apache Kafka
- **Database integration** with PostgreSQL and TypeORM
- **Circuit breaker pattern** for external service resilience
- **Graceful shutdown** handling
- **Health checks** and monitoring
- **API documentation** with Swagger
- **Docker containerization** with multi-service orchestration

## ✨ Features

### Core Features
- **RESTful API** with comprehensive endpoints
- **Event streaming** with Kafka producer/consumer
- **Database persistence** with PostgreSQL
- **Health monitoring** with detailed status checks
- **API documentation** with Swagger UI
- **Graceful shutdown** with proper resource cleanup

### Architecture Features
- **Circuit breaker pattern** for external service resilience
- **Event lifecycle management** with database tracking
- **Kafka message processing** with retry mechanisms
- **Configuration management** with environment variables
- **Logging and monitoring** with structured logs

### External Services
- **Analytics Service** - Event analytics and reporting
- **Email Service** - Email notifications and alerts
- **SMS Service** - SMS notifications
- **Test Runner Service** - Automated testing capabilities

## 🛠 Prerequisites

### System Requirements
- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose** (for containerized deployment)
- **Git** for version control

### Optional (for local development)
- **PostgreSQL** (version 15 or higher)
- **Apache Kafka** (version 7.4 or higher)

## 📦 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Delve
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment file and configure your settings:
```bash
cp docker.env .env
```

Edit the `.env` file with your specific configuration:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=delve_db

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=delve-app
KAFKA_GROUP_ID=delve-group
KAFKA_TOPIC=delve-kafka-topic
```

## 🚀 Running the Application

### Local Development

#### Option 1: Using Docker Compose (Recommended)
This is the easiest way to run the entire stack:

```bash
# Start all services (PostgreSQL, Kafka, Zookeeper, and the app)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down -v 
```

#### Option 2: Manual Setup
If you prefer to run services locally:

1. **Start PostgreSQL**:
```bash
# Using Docker
docker run -d --name postgres \
  -e POSTGRES_DB=delve_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

# Or install PostgreSQL locally and create the database
createdb delve_db
```

2. **Start Kafka** (using Docker):
```bash
# Start Zookeeper
docker run -d --name zookeeper \
  -p 2181:2181 \
  confluentinc/cp-zookeeper:7.4.0

# Start Kafka
docker run -d --name kafka \
  --link zookeeper \
  -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  confluentinc/cp-kafka:7.4.0
```

3. **Run the Application**:
```bash
# Development mode with hot reload
npm run start:dev

# Or using the startup script
./start-app.sh
```

### Production Deployment

#### Using Docker Compose
```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View application logs
docker-compose logs -f app

# Scale the application (if needed)
docker-compose up --scale app=3 -d
```

#### Manual Docker Build
```bash
# Build the Docker image
docker build -t delve-app .

# Run the container
docker run -d \
  --name delve-app \
  -p 3000:3000 \
  --env-file .env \
  delve-app
```

## 🐳 Docker Services

The application includes the following Docker services:

### Core Services
- **delve-app**: Main NestJS application
- **delve-postgres**: PostgreSQL database
- **delve-kafka**: Apache Kafka broker
- **delve-zookeeper**: Zookeeper for Kafka coordination

### Management Services
- **delve-kafka-topics**: Creates required Kafka topics
- **delve-kafka-ui**: Web UI for Kafka management (http://localhost:8080)

### Service Dependencies
```
delve-app
├── delve-postgres (database)
├── delve-kafka (message broker)
└── delve-kafka-topics (topic initialization)
```

## 📊 Monitoring and Health Checks

### Health Endpoints
- **Application Health**: `GET /api/health`
- **Database Health**: Included in health check
- **Kafka Health**: Included in health check

### Monitoring Tools
- **Kafka UI**: http://localhost:8080 (when using Docker Compose)
- **Application Logs**: Available via Docker Compose logs
- **Database**: Accessible on port 5432

## 🔧 Available Scripts

### Development
```bash
npm run start:dev      # Start with hot reload
npm run start:debug    # Start in debug mode
npm run start          # Start the application
```

### Production
```bash
npm run build          # Build the application
npm run start:prod     # Start in production mode
```

### Testing
```bash
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## 🌐 API Endpoints

### Base URL
- **Local**: http://localhost:3000
- **API Prefix**: `/api`

### Available Endpoints
- **GET /** - Welcome message
- **GET /api/health** - Health check with detailed status
- **GET /api/docs** - Swagger API documentation
- **POST /api/webhook** - Create events
- **GET /api/events/{event_id}** - Fetch Event Status


### Kafka Topics
- **delve-kafka-topic**: Main event processing topic
- **delve-kafka-topic-dlq**: Dead letter queue for failed messages

## 🏗 Project Structure

```
src/
├── api/                          # API controllers and DTOs
│   ├── api.controller.ts         # Main API controller
│   ├── api.service.ts            # API business logic
│   └── dto/                      # Data Transfer Objects
├── common/                       # Shared modules
│   ├── circuit-breaker/          # Circuit breaker implementation
│   ├── configurations/           # Configuration management
│   ├── database/                 # Database connection and setup
│   └── kafka/                    # Kafka producer/consumer
├── entities/                     # Database entities
│   ├── enums/                    # Application enums
│   ├── event-lifecycle.entity.ts # Event tracking
│   └── kafka-entry.entity.ts     # Kafka message tracking
├── services/                      # Business services
│   ├── external/                  # External service integrations
│   └── internal/                  # Internal business logic
├── app.module.ts                 # Root application module
├── app.service.ts                # Application service
└── main.ts                       # Application entry point
```

## 🔧 Configuration

### Environment Variables

#### Application Configuration
```bash
APP_NAME=Delve
APP_VERSION=1.0.0
APP_PORT=3000
NODE_ENV=development
```

#### Database Configuration
```bash
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=delve_db
```

#### Kafka Configuration
```bash
KAFKA_BROKERS=kafka:29092
KAFKA_CLIENT_ID=delve-app
KAFKA_GROUP_ID=delve-group
KAFKA_TOPIC=delve-kafka-topic
```

#### External Service Configuration
```bash
# Analytics Service
ANALYTICS_MIN_LATENCY=100
ANALYTICS_MAX_LATENCY=300
ANALYTICS_FAILURE_RATE=0.02

# Email Service
EMAIL_MIN_LATENCY=800
EMAIL_MAX_LATENCY=1200
EMAIL_FAILURE_RATE=0.05

# SMS Service
SMS_MIN_LATENCY=200
SMS_MAX_LATENCY=500
SMS_FAILURE_RATE=0.03
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Restart database service
docker-compose restart postgres
```

#### 2. Kafka Connection Issues
```bash
# Check Kafka status
docker-compose ps kafka

# Check Kafka logs
docker-compose logs kafka

# Verify topics are created
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
```

#### 3. Application Startup Issues
```bash
# Check application logs
docker-compose logs app

# Restart application
docker-compose restart app

# Rebuild and restart
docker-compose up --build -d app
```

#### 4. Port Conflicts
If you encounter port conflicts:
```bash
# Check what's using the ports
lsof -i :3000  # Application port
lsof -i :5432  # PostgreSQL port
lsof -i :9092  # Kafka port
lsof -i :8080  # Kafka UI port
```

### Health Check Commands
```bash
# Check all services
docker-compose ps

# Check service health
curl http://localhost:3000/api/v1/health

# Check Kafka UI
open http://localhost:8080
```

## 📚 Additional Documentation

- [Docker Setup Guide](README-Docker.md)
- [Kafka Configuration](README-Kafka.md)
- [Circuit Breaker Pattern](CIRCUIT-BREAKER.md)
- [Graceful Shutdown](GRACEFUL-SHUTDOWN.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review the logs: `docker-compose logs -f`
- Open an issue in the repository

---

**Happy coding! 🚀**