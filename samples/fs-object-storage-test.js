// fs-object-storage-test.js - Test the fs-object-storage library implementation

import { ObjectStorage } from '../src/index.js';

async function testObjectStorageLibrary() {
  console.log('🧪 Testing fs-object-storage library implementation...\n');

  // Create client instance
  const fs = new ObjectStorage({
    endpoint: 'localhost:9000',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin123',
    bucket: 'fs-minio-test',
    useSSL: false,
    prefix: 'test'
  });

  try {
    console.log('📝 Initializing client...');
    await fs.initialize();
    console.log('✅ Client initialized successfully\n');

    // Test 1: Write file
    console.log('📝 Test 1: writeFile()');
    const testContent = 'Hello from fs-minio library!\nThis is a test file.\n今日は良い天気ですね。';
    await fs.writeFile('/data/hello.txt', testContent, 'utf8');
    console.log('✅ File written successfully\n');

    // Test 2: Check if file exists
    console.log('📝 Test 2: exists()');
    const fileExists = await fs.exists('/data/hello.txt');
    console.log(`✅ File exists: ${fileExists}\n`);

    // Test 3: Read file
    console.log('📝 Test 3: readFile()');
    const readContent = await fs.readFile('/data/hello.txt', 'utf8');
    console.log(`✅ File content: "${readContent}"\n`);
    
    // Verify content matches
    if (readContent === testContent) {
      console.log('✅ Content matches original\n');
    } else {
      console.log('❌ Content does not match!\n');
    }

    // Test 4: Get file stats
    console.log('📝 Test 4: stat()');
    const stats = await fs.stat('/data/hello.txt');
    console.log('✅ File stats:');
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime}`);
    console.log(`   Is file: ${stats.isFile()}`);
    console.log(`   Is directory: ${stats.isDirectory()}\n`);

    // Test 5: Write binary file
    console.log('📝 Test 5: writeFile() with binary data');
    const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
    await fs.writeFile('/images/test.png', binaryData);
    console.log('✅ Binary file written successfully\n');

    // Test 6: Read binary file
    console.log('📝 Test 6: readFile() binary data');
    const readBinary = await fs.readFile('/images/test.png');
    console.log(`✅ Binary data read: ${readBinary.length} bytes`);
    console.log(`   First 8 bytes: ${Array.from(readBinary.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}\n`);

    // Test 7: Create directory
    console.log('📝 Test 7: mkdir()');
    await fs.mkdir('/documents/projects', { recursive: true });
    console.log('✅ Directory created successfully\n');

    // Test 8: List files in root
    console.log('📝 Test 8: readdir()');
    const rootFiles = await fs.readdir('/');
    console.log(`✅ Root directory contents: ${JSON.stringify(rootFiles)}\n`);

    // Test 9: Test error handling (non-existent file)
    console.log('📝 Test 9: Error handling');
    try {
      await fs.readFile('/nonexistent/file.txt');
      console.log('❌ Should have thrown error');
    } catch (error) {
      console.log(`✅ Correctly threw error: ${error.code} - ${error.message}\n`);
    }

    // Test 10: Delete file
    console.log('📝 Test 10: unlink()');
    await fs.unlink('/data/hello.txt');
    console.log('✅ File deleted successfully\n');

    // Test 11: Verify file is deleted
    console.log('📝 Test 11: Verify deletion');
    const fileExistsAfterDelete = await fs.exists('/data/hello.txt');
    console.log(`✅ File exists after delete: ${fileExistsAfterDelete}\n`);

    // Test 12: Test streams
    console.log('📝 Test 12: createReadStream()');
    const streamContent = 'This is stream test content\nLine 2\nLine 3';
    await fs.writeFile('/streams/test.txt', streamContent);
    const readStream = await fs.createReadStream('/streams/test.txt');
    const chunks = [];
    readStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    await new Promise((resolve, reject) => {
      readStream.on('end', () => {
        const streamData = Buffer.concat(chunks).toString('utf8');
        console.log(`✅ Stream content: "${streamData}"`);
        if (streamData === streamContent) {
          console.log('✅ Stream content matches original\n');
        } else {
          console.log('❌ Stream content does not match!\n');
        }
        resolve();
      });
      readStream.on('error', reject);
    });

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.originalError) {
      console.error('Original error:', error.originalError.message);
    }
    console.error('Stack:', error.stack);
  }
}

// Run tests
testObjectStorageLibrary().catch(console.error);
