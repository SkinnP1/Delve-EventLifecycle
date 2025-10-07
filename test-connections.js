const { Client } = require('pg');
const kafka = require('kafkajs');

// Test PostgreSQL Connection
async function testPostgreSQL() {
    console.log('Testing PostgreSQL connection...');

    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'password',
        database: 'delve_db'
    });

    try {
        await client.connect();
        console.log('✅ PostgreSQL connection successful!');

        // Test query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('Database time:', result.rows[0].current_time);

        await client.end();
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
    }
}

// Test Kafka Connection
async function testKafka() {
    console.log('Testing Kafka connection...');

    const kafkaClient = kafka({
        clientId: 'delve-test-client',
        brokers: ['localhost:9092']
    });

    try {
        const admin = kafkaClient.admin();
        await admin.connect();
        console.log('✅ Kafka connection successful!');

        // List topics
        const topics = await admin.listTopics();
        console.log('Available topics:', topics);

        // Check if our topic exists
        if (topics.includes('delve-kafka-topic')) {
            console.log('✅ delve-kafka-topic found!');
        } else {
            console.log('⚠️  delve-kafka-topic not found');
        }

        await admin.disconnect();
    } catch (error) {
        console.error('❌ Kafka connection failed:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting connection tests...\n');

    await testPostgreSQL();
    console.log('');
    await testKafka();

    console.log('\n✨ Connection tests completed!');
}

runTests().catch(console.error);
