# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install kafka tools and wget for health checks
RUN apk add --no-cache kafka kafka-tools wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy startup script
COPY scripts/startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application with Kafka readiness check
CMD ["/app/startup.sh"]
