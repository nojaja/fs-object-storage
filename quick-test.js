// quick-test.js - Quick test of fs-object-storage library

console.log('Starting fs-object-storage quick test...');

import { ObjectStorage } from './src/index.js';

async function quickTest() {
  try {
    console.log('Creating client...');    
    const fs = new ObjectStorage({
      endpoint: 'localhost:9000',
      accessKey: 'minioadmin',
      secretKey: 'minioadmin123',
    bucket: 'quick-test',
      useSSL: false
    });

    console.log('Initializing client...');
    await fs.initialize();
    console.log('Client initialized!');

    console.log('Writing test file...');
    await fs.writeFile('/test.txt', 'Hello World!', 'utf8');
    console.log('File written!');

    console.log('Reading test file...');
    const content = await fs.readFile('/test.txt', 'utf8');
    console.log('File content:', content);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

quickTest();
