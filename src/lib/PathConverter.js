// PathConverter.js - Filesystem path to MinIO bucket/key conversion

import path from 'path';

class PathConverter {
  /**
   * Create PathConverter instance
   * @param {Object} options - Configuration options
   * @param {string} options.bucket - Default bucket name
   * @param {string} [options.prefix=''] - Key prefix for all objects
   * @param {string} [options.separator='/'] - Path separator for object keys
   */
  constructor(options = {}) {
    this.bucket = options.bucket;
    this.prefix = options.prefix || '';
    this.separator = options.separator || '/';
    
    if (!this.bucket) {
      throw new Error('Bucket name is required');
    }
  }

  /**
   * Convert filesystem path to MinIO bucket and key
   * @param {string} filePath - Filesystem path (e.g., '/data/file.txt')
   * @returns {Object} {bucket: string, key: string}
   */
  pathToMinIO(filePath) {
    // Normalize path and remove leading slash
    const normalizedPath = path.posix.normalize(filePath).replace(/^\/+/, '');
    
    // Combine prefix and path
    let key = normalizedPath;
    if (this.prefix) {
      key = this.prefix + this.separator + normalizedPath;
    }
    
    // Ensure we don't have double separators
    key = key.replace(/\/+/g, '/');
    
    return {
      bucket: this.bucket,
      key: key
    };
  }

  /**
   * Convert MinIO bucket and key back to filesystem path
   * @param {string} bucket - Bucket name
   * @param {string} key - Object key
   * @returns {string} Filesystem path
   */
  minIOToPath(bucket, key) {
    let filePath = key;
    
    // Remove prefix if it exists
    if (this.prefix && key.startsWith(this.prefix + this.separator)) {
      filePath = key.substring(this.prefix.length + this.separator.length);
    }
    
    // Ensure leading slash for absolute path
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath;
    }
    
    return path.posix.normalize(filePath);
  }

  /**
   * Get parent directory path
   * @param {string} filePath - File path
   * @returns {string} Parent directory path
   */
  getParentPath(filePath) {
    const normalized = path.posix.normalize(filePath);
    const parent = path.posix.dirname(normalized);
    return parent === '.' ? '/' : parent;
  }

  /**
   * Check if path represents a directory (ends with separator)
   * @param {string} filePath - Path to check
   * @returns {boolean} True if directory path
   */
  isDirectoryPath(filePath) {
    return filePath.endsWith(this.separator);
  }

  /**
   * Convert path to directory path (ensure trailing separator)
   * @param {string} filePath - Path to convert
   * @returns {string} Directory path with trailing separator
   */
  toDirectoryPath(filePath) {
    const normalized = path.posix.normalize(filePath);
    return normalized.endsWith(this.separator) ? normalized : normalized + this.separator;
  }

  /**
   * Get MinIO key for directory listing
   * @param {string} dirPath - Directory path
   * @returns {Object} {bucket: string, prefix: string}
   */
  getListPrefix(dirPath) {
    const { bucket, key } = this.pathToMinIO(dirPath);
    
    // For directory listing, we need a prefix that ends with separator
    let prefix = key;
    if (prefix && !prefix.endsWith(this.separator)) {
      prefix += this.separator;
    }
    
    return {
      bucket,
      prefix
    };
  }

  /**
   * Create directory marker key (empty object representing directory)
   * @param {string} dirPath - Directory path
   * @returns {Object} {bucket: string, key: string}
   */
  createDirectoryMarker(dirPath) {
    const dirPathWithSeparator = this.toDirectoryPath(dirPath);
    return this.pathToMinIO(dirPathWithSeparator);
  }

  /**
   * Extract filename from path
   * @param {string} filePath - Full file path
   * @returns {string} Filename
   */
  getFileName(filePath) {
    return path.posix.basename(filePath);
  }

  /**
   * Join path segments
   * @param {...string} segments - Path segments to join
   * @returns {string} Joined path
   */
  joinPath(...segments) {
    return path.posix.join(...segments);
  }

  /**
   * Check if path is absolute
   * @param {string} filePath - Path to check
   * @returns {boolean} True if absolute path
   */
  isAbsolute(filePath) {
    return path.posix.isAbsolute(filePath);
  }

  /**
   * Resolve relative path to absolute
   * @param {string} basePath - Base path
   * @param {string} relativePath - Relative path
   * @returns {string} Absolute path
   */
  resolve(basePath, relativePath) {
    if (this.isAbsolute(relativePath)) {
      return relativePath;
    }
    return this.joinPath(basePath, relativePath);
  }

  /**
   * Validate path format
   * @param {string} filePath - Path to validate
   * @throws {Error} If path is invalid
   */
  validatePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Path must be a non-empty string');
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(filePath)) {
      throw new Error('Path contains invalid characters');
    }
    
    // Check length limits (S3 has 1024 byte limit for keys)
    const { key } = this.pathToMinIO(filePath);
    if (Buffer.byteLength(key, 'utf8') > 1024) {
      throw new Error('Path too long (exceeds 1024 bytes when converted to key)');
    }
  }

  /**
   * Get bucket name
   * @returns {string} Bucket name
   */
  getBucket() {
    return this.bucket;
  }

  /**
   * Get prefix
   * @returns {string} Prefix
   */
  getPrefix() {
    return this.prefix;
  }
}

export default PathConverter;
