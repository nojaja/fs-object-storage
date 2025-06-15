// StreamConverter.js - Convert between different stream/data formats for MinIO operations

import { Readable, PassThrough } from 'stream';
import { promisify } from 'util';
import stream from 'stream';
const pipeline = promisify(stream.pipeline);

class StreamConverter {
  /**
   * Convert various data types to readable stream for MinIO upload
   * @param {string|Buffer|Uint8Array|Readable} data - Data to convert
   * @returns {Readable} Readable stream
   */
  static toReadableStream(data) {
    if (data instanceof Readable) {
      return data;
    }
    
    if (typeof data === 'string') {
      return Readable.from([Buffer.from(data, 'utf8')]);
    }
    
    if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
      return Readable.from([data]);
    }
    
    throw new Error('Unsupported data type for stream conversion');
  }

  /**
   * Convert readable stream to buffer
   * @param {Readable} stream - Readable stream
   * @returns {Promise<Buffer>} Buffer containing all stream data
   */
  static async streamToBuffer(stream) {
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Convert readable stream to string
   * @param {Readable} stream - Readable stream
   * @param {string} [encoding='utf8'] - Text encoding
   * @returns {Promise<string>} String containing all stream data
   */
  static async streamToString(stream, encoding = 'utf8') {
    const buffer = await this.streamToBuffer(stream);
    return buffer.toString(encoding);
  }

  /**
   * Create a pass-through stream for piping operations
   * @returns {PassThrough} PassThrough stream
   */
  static createPassThrough() {
    return new PassThrough();
  }

  /**
   * Get data size for Content-Length header
   * @param {string|Buffer|Uint8Array|Readable} data - Data to measure
   * @returns {number|undefined} Size in bytes, undefined if unknown (stream)
   */
  static getDataSize(data) {
    if (typeof data === 'string') {
      return Buffer.byteLength(data, 'utf8');
    }
    
    if (Buffer.isBuffer(data)) {
      return data.length;
    }
    
    if (data instanceof Uint8Array) {
      return data.byteLength;
    }
    
    // For streams, size is unknown
    if (data instanceof Readable) {
      return undefined;
    }
    
    throw new Error('Unsupported data type for size calculation');
  }

  /**
   * Create readable stream from string with specified encoding
   * @param {string} content - String content
   * @param {string} [encoding='utf8'] - Text encoding
   * @returns {Readable} Readable stream
   */
  static stringToStream(content, encoding = 'utf8') {
    const buffer = Buffer.from(content, encoding);
    return Readable.from([buffer]);
  }

  /**
   * Create readable stream from buffer
   * @param {Buffer} buffer - Buffer data
   * @returns {Readable} Readable stream
   */
  static bufferToStream(buffer) {
    return Readable.from([buffer]);
  }

  /**
   * Pipe stream with error handling
   * @param {Readable} source - Source stream
   * @param {Writable} destination - Destination stream
   * @returns {Promise<void>} Promise that resolves when piping is complete
   */
  static async pipeStream(source, destination) {
    try {
      await pipeline(source, destination);
    } catch (error) {
      throw new Error(`Stream pipeline failed: ${error.message}`);
    }
  }

  /**
   * Clone a readable stream (create multiple consumers)
   * @param {Readable} source - Source stream
   * @param {number} [count=2] - Number of clones to create
   * @returns {Readable[]} Array of cloned streams
   */
  static cloneStream(source, count = 2) {
    const streams = [];
    
    for (let i = 0; i < count; i++) {
      streams.push(new PassThrough());
    }
    
    source.on('data', (chunk) => {
      streams.forEach(stream => stream.write(chunk));
    });
    
    source.on('end', () => {
      streams.forEach(stream => stream.end());
    });
    
    source.on('error', (error) => {
      streams.forEach(stream => stream.destroy(error));
    });
    
    return streams;
  }

  /**
   * Transform stream data with a function
   * @param {Readable} source - Source stream
   * @param {Function} transformer - Transform function (chunk) => transformedChunk
   * @returns {Readable} Transformed stream
   */
  static transformStream(source, transformer) {
    const passThrough = new PassThrough();
    
    source.on('data', (chunk) => {
      try {
        const transformed = transformer(chunk);
        passThrough.write(transformed);
      } catch (error) {
        passThrough.destroy(error);
      }
    });
    
    source.on('end', () => {
      passThrough.end();
    });
    
    source.on('error', (error) => {
      passThrough.destroy(error);
    });
    
    return passThrough;
  }

  /**
   * Limit stream size
   * @param {Readable} source - Source stream
   * @param {number} maxSize - Maximum size in bytes
   * @returns {Readable} Size-limited stream
   */
  static limitStreamSize(source, maxSize) {
    const passThrough = new PassThrough();
    let totalSize = 0;
    
    source.on('data', (chunk) => {
      totalSize += chunk.length;
      
      if (totalSize > maxSize) {
        const error = new Error(`Stream size exceeds limit of ${maxSize} bytes`);
        error.code = 'EFBIG';
        passThrough.destroy(error);
        return;
      }
      
      passThrough.write(chunk);
    });
    
    source.on('end', () => {
      passThrough.end();
    });
    
    source.on('error', (error) => {
      passThrough.destroy(error);
    });
    
    return passThrough;
  }

  /**
   * Convert stream to async iterator
   * @param {Readable} stream - Source stream
   * @returns {AsyncIterable<Buffer>} Async iterable of chunks
   */
  static streamToAsyncIterable(stream) {
    return {
      [Symbol.asyncIterator]: async function* () {
        let resolve, reject;
        const chunks = [];
        let finished = false;
        
        stream.on('readable', () => {
          let chunk;
          while (null !== (chunk = stream.read())) {
            chunks.push(chunk);
            if (resolve) {
              resolve(chunk);
              resolve = null;
            }
          }
        });
        
        stream.on('end', () => {
          finished = true;
          if (resolve) {
            resolve(null);
            resolve = null;
          }
        });
        
        stream.on('error', (error) => {
          if (reject) {
            reject(error);
            reject = null;
          }
        });
        
        while (true) {
          if (chunks.length > 0) {
            yield chunks.shift();
          } else if (finished) {
            break;
          } else {
            await new Promise((res, rej) => {
              resolve = res;
              reject = rej;
            });
            if (resolve === null && reject === null) {
              break; // Stream ended
            }
          }
        }
      }
    };
  }
}

export default StreamConverter;
