#!/usr/bin/env node

/**
 * Graceful Shutdown Test Script
 * 
 * This script demonstrates the graceful shutdown functionality by:
 * 1. Starting the application
 * 2. Sending some test messages
 * 3. Triggering graceful shutdown
 * 4. Monitoring the shutdown process
 */

const { spawn } = require('child_process');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkHealth() {
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed:', response.data.status);
        return true;
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return false;
    }
}

async function checkShutdownStatus() {
    try {
        const response = await axios.get(`${BASE_URL}/shutdown-status`);
        console.log('📊 Shutdown status:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ Failed to get shutdown status:', error.message);
        return null;
    }
}

async function sendTestWebhook() {
    try {
        const response = await axios.post(`${BASE_URL}/webhook`, {
            eventType: 'USER_CREATED',
            data: {
                userId: 'test-user-' + Date.now(),
                email: 'test@example.com',
                name: 'Test User'
            }
        });
        console.log('📤 Test webhook sent:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Failed to send test webhook:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Graceful Shutdown Test');
    console.log('=====================================\n');

    // Start the application
    console.log('1. Starting the application...');
    const appProcess = spawn('npm', ['run', 'start:dev'], {
        stdio: 'pipe',
        shell: true
    });

    // Wait for application to start
    console.log('⏳ Waiting for application to start...');
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
        await delay(2000);
        if (await checkHealth()) {
            break;
        }
        attempts++;
    }

    if (attempts >= maxAttempts) {
        console.log('❌ Application failed to start within timeout');
        appProcess.kill();
        return;
    }

    console.log('✅ Application started successfully\n');

    // Send some test messages
    console.log('2. Sending test messages...');
    for (let i = 0; i < 5; i++) {
        await sendTestWebhook();
        await delay(1000);
    }
    console.log('✅ Test messages sent\n');

    // Check initial shutdown status
    console.log('3. Checking initial shutdown status...');
    await checkShutdownStatus();
    console.log('');

    // Trigger graceful shutdown
    console.log('4. Triggering graceful shutdown...');
    console.log('📡 Sending SIGTERM signal...');

    // Monitor shutdown status during shutdown
    const monitorInterval = setInterval(async () => {
        const status = await checkShutdownStatus();
        if (status && status.isShuttingDown) {
            console.log('🔄 Shutdown in progress...');
        }
    }, 2000);

    // Send SIGTERM signal
    appProcess.kill('SIGTERM');

    // Wait for process to exit
    appProcess.on('exit', (code, signal) => {
        clearInterval(monitorInterval);
        console.log(`\n✅ Application exited with code ${code} and signal ${signal}`);
        console.log('🎉 Graceful shutdown test completed!');
    });

    // Timeout after 60 seconds
    setTimeout(() => {
        clearInterval(monitorInterval);
        console.log('\n⏰ Test timeout reached, killing process...');
        appProcess.kill('SIGKILL');
    }, 60000);
}

// Handle script termination
process.on('SIGINT', () => {
    console.log('\n🛑 Test interrupted by user');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test terminated');
    process.exit(0);
});

main().catch(console.error);
