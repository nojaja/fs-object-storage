/**
 * Unit tests for StreamConverter
 */
import StreamConverter from '../../src/lib/StreamConverter.js';
import { strict as assert } from 'assert';
import { Readable, Writable } from 'stream';

describe('StreamConverter', () => {
  describe('bufferToString', () => {
    it('should convert buffer to string with default encoding', () => {
      const buffer = Buffer.from('Hello, World!');
      const result = StreamConverter.bufferToString(buffer);
      
      assert.strictEqual(result, 'Hello, World!');
    });

    it('should convert buffer to string with specified encoding', () => {
      const buffer = Buffer.from('Hello, World!');
      const result = StreamConverter.bufferToString(buffer, 'base64');
      
      assert.strictEqual(result, buffer.toString('base64'));
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const result = StreamConverter.bufferToString(buffer);
      
      assert.strictEqual(result, '');
    });

    it('should handle UTF-8 characters', () => {
      const buffer = Buffer.from('こんにちは', 'utf8');
      const result = StreamConverter.bufferToString(buffer);
      
      assert.strictEqual(result, 'こんにちは');
    });
  });

  describe('stringToBuffer', () => {
    it('should convert string to buffer with default encoding', () => {
      const str = 'Hello, World!';
      const result = StreamConverter.stringToBuffer(str);
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.toString(), str);
    });

    it('should convert string to buffer with specified encoding', () => {
      const str = 'Hello, World!';
      const result = StreamConverter.stringToBuffer(str, 'base64');
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.toString('base64'), str);
    });

    it('should handle empty string', () => {
      const str = '';
      const result = StreamConverter.stringToBuffer(str);
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.length, 0);
    });

    it('should handle UTF-8 characters', () => {
      const str = 'こんにちは';
      const result = StreamConverter.stringToBuffer(str);
      
      assert.strictEqual(result.toString('utf8'), str);
    });
  });

  describe('streamToBuffer', () => {
    it('should convert readable stream to buffer', async () => {
      const testData = 'Hello, World!';
      const stream = new Readable({
        read() {
          this.push(testData);
          this.push(null);
        }
      });

      const result = await StreamConverter.streamToBuffer(stream);
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.toString(), testData);
    });

    it('should handle empty stream', async () => {
      const stream = new Readable({
        read() {
          this.push(null);
        }
      });

      const result = await StreamConverter.streamToBuffer(stream);
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.length, 0);
    });

    it('should handle chunked data', async () => {
      const chunks = ['Hello, ', 'World!'];
      let chunkIndex = 0;
      
      const stream = new Readable({
        read() {
          if (chunkIndex < chunks.length) {
            this.push(chunks[chunkIndex++]);
          } else {
            this.push(null);
          }
        }
      });

      const result = await StreamConverter.streamToBuffer(stream);
      
      assert.strictEqual(result.toString(), 'Hello, World!');
    });

    it('should handle stream errors', async () => {
      const stream = new Readable({
        read() {
          this.emit('error', new Error('Stream error'));
        }
      });

      try {
        await StreamConverter.streamToBuffer(stream);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Stream error');
      }
    });
  });

  describe('bufferToStream', () => {
    it('should convert buffer to readable stream', async () => {
      const testData = 'Hello, World!';
      const buffer = Buffer.from(testData);
      const stream = StreamConverter.bufferToStream(buffer);
      
      assert.ok(stream instanceof Readable);
      
      const result = await StreamConverter.streamToBuffer(stream);
      assert.strictEqual(result.toString(), testData);
    });

    it('should handle empty buffer', async () => {
      const buffer = Buffer.alloc(0);
      const stream = StreamConverter.bufferToStream(buffer);
      
      const result = await StreamConverter.streamToBuffer(stream);
      assert.strictEqual(result.length, 0);
    });

    it('should create stream that emits data and end events', (done) => {
      const testData = 'Test data';
      const buffer = Buffer.from(testData);
      const stream = StreamConverter.bufferToStream(buffer);
      
      let receivedData = '';
      
      stream.on('data', (chunk) => {
        receivedData += chunk.toString();
      });
      
      stream.on('end', () => {
        assert.strictEqual(receivedData, testData);
        done();
      });
      
      stream.on('error', done);
    });
  });

  describe('createPassThroughStream', () => {
    it('should create a writable stream that collects data', async () => {
      const testData = 'Hello, World!';
      const { stream, promise } = StreamConverter.createPassThroughStream();
      
      assert.ok(stream instanceof Writable);
      
      stream.write(testData);
      stream.end();
      
      const result = await promise;
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.toString(), testData);
    });

    it('should handle multiple writes', async () => {
      const chunks = ['Hello, ', 'World!'];
      const { stream, promise } = StreamConverter.createPassThroughStream();
      
      chunks.forEach(chunk => stream.write(chunk));
      stream.end();
      
      const result = await promise;
      assert.strictEqual(result.toString(), 'Hello, World!');
    });

    it('should handle empty stream', async () => {
      const { stream, promise } = StreamConverter.createPassThroughStream();
      
      stream.end();
      
      const result = await promise;
      assert.strictEqual(result.length, 0);
    });

    it('should handle stream errors', async () => {
      const { stream, promise } = StreamConverter.createPassThroughStream();
      
      stream.emit('error', new Error('Write error'));
      
      try {
        await promise;
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.strictEqual(error.message, 'Write error');
      }
    });
  });

  describe('normalizeData', () => {
    it('should normalize string data', () => {
      const str = 'Hello, World!';
      const result = StreamConverter.normalizeData(str);
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.toString(), str);
    });

    it('should normalize buffer data', () => {
      const buffer = Buffer.from('Hello, World!');
      const result = StreamConverter.normalizeData(buffer);
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result, buffer);
    });

    it('should normalize Uint8Array data', () => {
      const uint8Array = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = StreamConverter.normalizeData(uint8Array);
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.toString(), 'Hello');
    });

    it('should handle empty string', () => {
      const result = StreamConverter.normalizeData('');
      
      assert.ok(Buffer.isBuffer(result));
      assert.strictEqual(result.length, 0);
    });

    it('should handle undefined/null', () => {
      const resultUndefined = StreamConverter.normalizeData(undefined);
      const resultNull = StreamConverter.normalizeData(null);
      
      assert.ok(Buffer.isBuffer(resultUndefined));
      assert.ok(Buffer.isBuffer(resultNull));
      assert.strictEqual(resultUndefined.length, 0);
      assert.strictEqual(resultNull.length, 0);
    });
  });
});
