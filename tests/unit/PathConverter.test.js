/**
 * Unit tests for PathConverter
 */
import PathConverter from '../../src/lib/PathConverter.js';
import { strict as assert } from 'assert';

describe('PathConverter', () => {
  describe('splitPath', () => {
    it('should split absolute path correctly', () => {
      const result = PathConverter.splitPath('/bucket/path/to/file.txt');
      
      assert.strictEqual(result.bucket, 'bucket');
      assert.strictEqual(result.key, 'path/to/file.txt');
    });

    it('should handle path without leading slash', () => {
      const result = PathConverter.splitPath('bucket/path/to/file.txt');
      
      assert.strictEqual(result.bucket, 'bucket');
      assert.strictEqual(result.key, 'path/to/file.txt');
    });

    it('should handle bucket-only path', () => {
      const result = PathConverter.splitPath('/bucket');
      
      assert.strictEqual(result.bucket, 'bucket');
      assert.strictEqual(result.key, '');
    });

    it('should handle bucket-only path without slash', () => {
      const result = PathConverter.splitPath('bucket');
      
      assert.strictEqual(result.bucket, 'bucket');
      assert.strictEqual(result.key, '');
    });

    it('should handle root path', () => {
      const result = PathConverter.splitPath('/');
      
      assert.strictEqual(result.bucket, '');
      assert.strictEqual(result.key, '');
    });

    it('should handle empty path', () => {
      const result = PathConverter.splitPath('');
      
      assert.strictEqual(result.bucket, '');
      assert.strictEqual(result.key, '');
    });

    it('should handle bucket with trailing slash', () => {
      const result = PathConverter.splitPath('/bucket/');
      
      assert.strictEqual(result.bucket, 'bucket');
      assert.strictEqual(result.key, '');
    });

    it('should handle nested directory structure', () => {
      const result = PathConverter.splitPath('/mybucket/dir1/dir2/dir3/file.txt');
      
      assert.strictEqual(result.bucket, 'mybucket');
      assert.strictEqual(result.key, 'dir1/dir2/dir3/file.txt');
    });
  });

  describe('joinPath', () => {
    it('should join bucket and key correctly', () => {
      const result = PathConverter.joinPath('bucket', 'path/to/file.txt');
      
      assert.strictEqual(result, '/bucket/path/to/file.txt');
    });

    it('should handle empty key', () => {
      const result = PathConverter.joinPath('bucket', '');
      
      assert.strictEqual(result, '/bucket');
    });

    it('should handle empty bucket', () => {
      const result = PathConverter.joinPath('', 'path/to/file.txt');
      
      assert.strictEqual(result, '/path/to/file.txt');
    });

    it('should handle both empty', () => {
      const result = PathConverter.joinPath('', '');
      
      assert.strictEqual(result, '/');
    });

    it('should remove leading slash from key', () => {
      const result = PathConverter.joinPath('bucket', '/path/to/file.txt');
      
      assert.strictEqual(result, '/bucket/path/to/file.txt');
    });

    it('should handle complex paths', () => {
      const result = PathConverter.joinPath('my-bucket', 'documents/2023/report.pdf');
      
      assert.strictEqual(result, '/my-bucket/documents/2023/report.pdf');
    });
  });

  describe('normalizePath', () => {
    it('should normalize standard path', () => {
      const result = PathConverter.normalizePath('/bucket/path/to/file.txt');
      
      assert.strictEqual(result, '/bucket/path/to/file.txt');
    });

    it('should remove double slashes', () => {
      const result = PathConverter.normalizePath('/bucket//path///to/file.txt');
      
      assert.strictEqual(result, '/bucket/path/to/file.txt');
    });

    it('should handle trailing slash', () => {
      const result = PathConverter.normalizePath('/bucket/path/');
      
      assert.strictEqual(result, '/bucket/path');
    });

    it('should preserve root slash', () => {
      const result = PathConverter.normalizePath('/');
      
      assert.strictEqual(result, '/');
    });

    it('should add leading slash if missing', () => {
      const result = PathConverter.normalizePath('bucket/path/file.txt');
      
      assert.strictEqual(result, '/bucket/path/file.txt');
    });

    it('should handle empty string', () => {
      const result = PathConverter.normalizePath('');
      
      assert.strictEqual(result, '/');
    });

    it('should handle relative path components', () => {
      const result = PathConverter.normalizePath('/bucket/./path/../file.txt');
      
      assert.strictEqual(result, '/bucket/file.txt');
    });
  });

  describe('isDirectory', () => {
    it('should identify directory by trailing slash', () => {
      assert.strictEqual(PathConverter.isDirectory('/bucket/path/'), true);
    });

    it('should identify file by no trailing slash', () => {
      assert.strictEqual(PathConverter.isDirectory('/bucket/path/file.txt'), false);
    });

    it('should identify root as directory', () => {
      assert.strictEqual(PathConverter.isDirectory('/'), true);
    });

    it('should identify bucket as directory', () => {
      assert.strictEqual(PathConverter.isDirectory('/bucket'), false);
      assert.strictEqual(PathConverter.isDirectory('/bucket/'), true);
    });
  });

  describe('getParentPath', () => {
    it('should get parent directory', () => {
      const result = PathConverter.getParentPath('/bucket/path/to/file.txt');
      
      assert.strictEqual(result, '/bucket/path/to');
    });

    it('should get bucket for top-level file', () => {
      const result = PathConverter.getParentPath('/bucket/file.txt');
      
      assert.strictEqual(result, '/bucket');
    });

    it('should get root for bucket', () => {
      const result = PathConverter.getParentPath('/bucket');
      
      assert.strictEqual(result, '/');
    });

    it('should return root for root', () => {
      const result = PathConverter.getParentPath('/');
      
      assert.strictEqual(result, '/');
    });

    it('should handle nested directories', () => {
      const result = PathConverter.getParentPath('/bucket/dir1/dir2/dir3');
      
      assert.strictEqual(result, '/bucket/dir1/dir2');
    });
  });

  describe('getBasename', () => {
    it('should get filename', () => {
      const result = PathConverter.getBasename('/bucket/path/to/file.txt');
      
      assert.strictEqual(result, 'file.txt');
    });

    it('should get directory name', () => {
      const result = PathConverter.getBasename('/bucket/path/to/dir');
      
      assert.strictEqual(result, 'dir');
    });

    it('should get bucket name', () => {
      const result = PathConverter.getBasename('/bucket');
      
      assert.strictEqual(result, 'bucket');
    });

    it('should return empty for root', () => {
      const result = PathConverter.getBasename('/');
      
      assert.strictEqual(result, '');
    });
  });
});
