/**
 * Simple unit tests for all components
 */
import ErrorHandler from '../src/lib/ErrorHandler.js';
import PathConverter from '../src/lib/PathConverter.js';
import StreamConverter from '../src/lib/StreamConverter.js';
import { strict as assert } from 'assert';
import { test } from 'node:test';

// ErrorHandler tests
test('ErrorHandler - convert NoSuchKey to ENOENT', () => {
  const minioError = new Error('NoSuchKey: The specified key does not exist.');
  minioError.code = 'NoSuchKey';
  
  const fsError = ErrorHandler.convertMinioError(minioError, '/test/file.txt');
  
  assert.strictEqual(fsError.code, 'ENOENT');
  assert.strictEqual(fsError.errno, -2);
  assert.strictEqual(fsError.path, '/test/file.txt');
});

test('ErrorHandler - convert AccessDenied to EACCES', () => {
  const minioError = new Error('AccessDenied: Access Denied.');
  minioError.code = 'AccessDenied';
  
  const fsError = ErrorHandler.convertMinioError(minioError, '/test/file.txt');
  
  assert.strictEqual(fsError.code, 'EACCES');
  assert.strictEqual(fsError.errno, -13);
});

test('ErrorHandler - create filesystem error', () => {
  const error = ErrorHandler.createFileSystemError('ENOENT', '/test/file.txt', 'open');
  
  assert.strictEqual(error.code, 'ENOENT');
  assert.strictEqual(error.errno, -2);
  assert.strictEqual(error.path, '/test/file.txt');
  assert.strictEqual(error.syscall, 'open');
});

// PathConverter tests
test('PathConverter - split path correctly', () => {
  const result = PathConverter.splitPath('/bucket/path/to/file.txt');
  
  assert.strictEqual(result.bucket, 'bucket');
  assert.strictEqual(result.key, 'path/to/file.txt');
});

test('PathConverter - join path correctly', () => {
  const result = PathConverter.joinPath('bucket', 'path/to/file.txt');
  
  assert.strictEqual(result, '/bucket/path/to/file.txt');
});

test('PathConverter - normalize path', () => {
  const result = PathConverter.normalizePath('/bucket//path///to/file.txt');
  
  assert.strictEqual(result, '/bucket/path/to/file.txt');
});

test('PathConverter - get parent path', () => {
  const result = PathConverter.getParentPath('/bucket/path/to/file.txt');
  
  assert.strictEqual(result, '/bucket/path/to');
});

test('PathConverter - get basename', () => {
  const result = PathConverter.getBasename('/bucket/path/to/file.txt');
  
  assert.strictEqual(result, 'file.txt');
});

// StreamConverter tests
test('StreamConverter - buffer to string', () => {
  const buffer = Buffer.from('Hello, World!');
  const result = StreamConverter.bufferToString(buffer);
  
  assert.strictEqual(result, 'Hello, World!');
});

test('StreamConverter - string to buffer', () => {
  const str = 'Hello, World!';
  const result = StreamConverter.stringToBuffer(str);
  
  assert.ok(Buffer.isBuffer(result));
  assert.strictEqual(result.toString(), str);
});

test('StreamConverter - normalize data (string)', () => {
  const str = 'Hello, World!';
  const result = StreamConverter.normalizeData(str);
  
  assert.ok(Buffer.isBuffer(result));
  assert.strictEqual(result.toString(), str);
});

test('StreamConverter - normalize data (buffer)', () => {
  const buffer = Buffer.from('Hello, World!');
  const result = StreamConverter.normalizeData(buffer);
  
  assert.ok(Buffer.isBuffer(result));
  assert.strictEqual(result, buffer);
});

console.log('✅ All unit tests completed successfully!');
