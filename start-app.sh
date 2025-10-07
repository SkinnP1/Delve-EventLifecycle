#!/bin/bash

# Suppress Node.js timeout warnings
export NODE_NO_WARNINGS=1
export KAFKAJS_NO_PARTITIONER_WARNING=1

# Start the application
npm run start:dev
