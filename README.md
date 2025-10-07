# Delve

A simple NestJS application called Delve.

## Description

Delve is a basic NestJS application that demonstrates the fundamental structure and features of a NestJS project. It includes:

- A main application module
- A controller with basic routes
- A service with business logic
- Health check endpoint

## Features

- **GET /** - Returns a welcome message
- **GET /health** - Returns application health status

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

### Debug mode
```bash
npm run start:debug
```

## Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start the application in development mode with hot reload
- `npm run start:debug` - Start the application in debug mode
- `npm run start:prod` - Start the application in production mode
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:cov` - Run unit tests with coverage
- `npm run test:e2e` - Run end-to-end tests

## API Endpoints

Once the application is running, you can access:

- **http://localhost:3000** - Welcome message
- **http://localhost:3000/health** - Health check

## Project Structure

```
src/
├── app.controller.ts    # Main application controller
├── app.module.ts        # Root application module
├── app.service.ts       # Application service
└── main.ts              # Application entry point
```

## License

This project is licensed under the UNLICENSED License.
