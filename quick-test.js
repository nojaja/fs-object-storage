// quick-test.js - Quick test of fs-minio library

console.log('Starting fs-minio quick test...');

import { FsMinioClient } from './src/index.js';

async function quickTest() {
  try {
    console.log('Creating client...');    const client = new FsMinioClient({
      endpoint: 'localhost:9000',
      accessKey: 'minioadmin',
      secretKey: 'minioadmin123',
      bucket: 'fs-minio-test',
      useSSL: false
    });

    console.log('Initializing client...');
    await client.initialize();
    console.log('Client initialized!');

    console.log('Writing test file...');
    await client.writeFile('/test.txt', 'Hello World!', 'utf8');
    console.log('File written!');

    console.log('Reading test file...');
    const content = await client.readFile('/test.txt', 'utf8');
    console.log('File content:', content);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

quickTest();
