/**
 * Unit tests for ErrorHandler
 */
import ErrorHandler from '../../src/lib/ErrorHandler.js';
import { strict as assert } from 'assert';
import { test, describe } from 'node:test';

describe('ErrorHandler', () => {
  describe('convertMinioError', () => {
    test('should convert NoSuchKey error to ENOENT', () => {
      const minioError = new Error('NoSuchKey: The specified key does not exist.');
      minioError.code = 'NoSuchKey';
      
      const fsError = ErrorHandler.convertMinioError(minioError, '/test/file.txt');
      
      assert.strictEqual(fsError.code, 'ENOENT');
      assert.strictEqual(fsError.errno, -2);
      assert.strictEqual(fsError.path, '/test/file.txt');
      assert.ok(fsError.message.includes('ENOENT'));
    });

    test('should convert NoSuchBucket error to ENOENT', () => {
      const minioError = new Error('NoSuchBucket: The specified bucket does not exist.');
      minioError.code = 'NoSuchBucket';
      
      const fsError = ErrorHandler.convertMinioError(minioError, '/bucket/file.txt');
      
      assert.strictEqual(fsError.code, 'ENOENT');
      assert.strictEqual(fsError.errno, -2);
    });

    test('should convert AccessDenied error to EACCES', () => {
      const minioError = new Error('AccessDenied: Access Denied.');
      minioError.code = 'AccessDenied';
      
      const fsError = ErrorHandler.convertMinioError(minioError, '/test/file.txt');
      
      assert.strictEqual(fsError.code, 'EACCES');
      assert.strictEqual(fsError.errno, -13);
    });

    test('should convert BucketAlreadyExists error to EEXIST', () => {
      const minioError = new Error('BucketAlreadyExists: The requested bucket name is not available.');
      minioError.code = 'BucketAlreadyExists';
      
      const fsError = ErrorHandler.convertMinioError(minioError, '/bucket');
      
      assert.strictEqual(fsError.code, 'EEXIST');
      assert.strictEqual(fsError.errno, -17);
    });

    test('should handle unknown MinIO errors as generic errors', () => {
      const minioError = new Error('UnknownError: Something went wrong.');
      minioError.code = 'UnknownError';
      
      const fsError = ErrorHandler.convertMinioError(minioError, '/test/file.txt');
      
      assert.strictEqual(fsError.code, 'EUNKNOWN');
      assert.strictEqual(fsError.errno, -1);
    });

    test('should handle errors without MinIO code', () => {
      const genericError = new Error('Network error');
      
      const fsError = ErrorHandler.convertMinioError(genericError, '/test/file.txt');
      
      assert.strictEqual(fsError.code, 'EUNKNOWN');
      assert.strictEqual(fsError.errno, -1);
      assert.ok(fsError.message.includes('Network error'));
    });

    test('should preserve original stack trace', () => {
      const minioError = new Error('Test error');
      minioError.code = 'TestError';
      
      const fsError = ErrorHandler.convertMinioError(minioError, '/test');
      
      assert.ok(fsError.stack);
      assert.ok(fsError.stack.includes('Test error'));
    });
  });

  describe('createFileSystemError', () => {
    test('should create ENOENT error correctly', () => {
      const error = ErrorHandler.createFileSystemError('ENOENT', '/test/file.txt', 'open');
      
      assert.strictEqual(error.code, 'ENOENT');
      assert.strictEqual(error.errno, -2);
      assert.strictEqual(error.path, '/test/file.txt');
      assert.strictEqual(error.syscall, 'open');
      assert.ok(error.message.includes('ENOENT'));
      assert.ok(error.message.includes('/test/file.txt'));
    });

    test('should create EACCES error correctly', () => {
      const error = ErrorHandler.createFileSystemError('EACCES', '/test/file.txt', 'read');
      
      assert.strictEqual(error.code, 'EACCES');
      assert.strictEqual(error.errno, -13);
      assert.strictEqual(error.syscall, 'read');
    });

    test('should create EEXIST error correctly', () => {
      const error = ErrorHandler.createFileSystemError('EEXIST', '/test/dir', 'mkdir');
      
      assert.strictEqual(error.code, 'EEXIST');
      assert.strictEqual(error.errno, -17);
    });

    test('should handle unknown error codes', () => {
      const error = ErrorHandler.createFileSystemError('UNKNOWN', '/test', 'test');
      
      assert.strictEqual(error.code, 'UNKNOWN');
      assert.strictEqual(error.errno, -1);
    });
  });
});
