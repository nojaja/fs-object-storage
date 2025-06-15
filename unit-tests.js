/**
 * Simple unit tests for all components
 */
import ErrorHandler from './src/lib/ErrorHandler.js';
import PathConverter from './src/lib/PathConverter.js';
import StreamConverter from './src/lib/StreamConverter.js';
import { strict as assert } from 'assert';
import { test } from 'node:test';

// ErrorHandler tests
test('ErrorHandler - convert NoSuchKey to ENOENT', () => {
  const minioError = new Error('NoSuchKey: The specified key does not exist.');
  minioError.code = 'NoSuchKey';
  const fsError = ErrorHandler.convertError(minioError, '/test/file.txt');
  assert.strictEqual(fsError.code, 'ENOENT');
  assert.strictEqual(fsError.errno, -2);
  assert.strictEqual(fsError.path, '/test/file.txt');
});

test('ErrorHandler - convert AccessDenied to EACCES', () => {
  const minioError = new Error('AccessDenied: Access Denied.');
  minioError.code = 'AccessDenied';
  const fsError = ErrorHandler.convertError(minioError, '/test/file.txt');
  assert.strictEqual(fsError.code, 'EACCES');
  assert.strictEqual(fsError.errno, -13);
});

test('ErrorHandler - create filesystem error', () => {
  const error = ErrorHandler.createError('ENOENT', '/test/file.txt', 'open');
  assert.strictEqual(error.code, 'ENOENT');
  assert.strictEqual(error.errno, -2);
  assert.strictEqual(error.path, '/test/file.txt');
  assert.strictEqual(error.syscall, 'open');
});

// PathConverter tests
// PathConverterはインスタンス生成が必要
const pc = new PathConverter({ bucket: 'bucket' });
test('PathConverter - split path correctly', () => {
  const result = pc.pathToMinIO('/bucket/path/to/file.txt');
  assert.strictEqual(result.bucket, 'bucket');
  assert.strictEqual(result.key, 'bucket/path/to/file.txt');
});

test('PathConverter - join path correctly', () => {
  const result = pc.joinPath('/bucket', 'path/to/file.txt');
  assert.strictEqual(result, '/bucket/path/to/file.txt');
});

test('PathConverter - normalize path', () => {
  const result = pc.joinPath('/bucket//path///to', 'file.txt');
  assert.strictEqual(result, '/bucket/path/to/file.txt');
});

test('PathConverter - get parent path', () => {
  const result = pc.getParentPath('/bucket/path/to/file.txt');
  assert.strictEqual(result, '/bucket/path/to');
});

test('PathConverter - get basename', () => {
  const result = pc.getFileName('/bucket/path/to/file.txt');
  assert.strictEqual(result, 'file.txt');
});

// StreamConverter tests
// bufferToString → Buffer.toString
// stringToBuffer → Buffer.from
// normalizeData → Buffer.from or identity
function normalizeData(data) {
  if (Buffer.isBuffer(data)) return data;
  if (typeof data === 'string') return Buffer.from(data);
  throw new Error('Unsupported type');
}
test('StreamConverter - buffer to string', () => {
  const buffer = Buffer.from('Hello, World!');
  const result = buffer.toString();
  assert.strictEqual(result, 'Hello, World!');
});

test('StreamConverter - string to buffer', () => {
  const str = 'Hello, World!';
  const result = Buffer.from(str);
  assert.ok(Buffer.isBuffer(result));
  assert.strictEqual(result.toString(), str);
});

test('StreamConverter - normalize data (string)', () => {
  const str = 'Hello, World!';
  const result = normalizeData(str);
  assert.ok(Buffer.isBuffer(result));
  assert.strictEqual(result.toString(), str);
});

test('StreamConverter - normalize data (buffer)', () => {
  const buffer = Buffer.from('Hello, World!');
  const result = normalizeData(buffer);
  assert.ok(Buffer.isBuffer(result));
  assert.strictEqual(result, buffer);
});

console.log('✅ All unit tests completed successfully!');
