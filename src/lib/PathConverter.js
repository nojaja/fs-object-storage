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
    let normalizedPath = path.posix.normalize(filePath).replace(/^\/+/, '');

    // バケット名が先頭に含まれている場合は除去
    if (normalizedPath.startsWith(this.bucket + '/')) {
      normalizedPath = normalizedPath.substring(this.bucket.length + 1);
    } else if (normalizedPath === this.bucket) {
      normalizedPath = '';
    }
    
    // Combine prefix and path
    let key;
    if (this.prefix) {
      key = this.prefix + this.separator + normalizedPath;
    } else {
      key = normalizedPath;
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
    // bucketとkeyを結合して絶対パスを返す
    let filePath = '';
    if (bucket && key) {
      filePath = '/' + bucket + '/' + key.replace(/^\/+/, '');
    } else if (bucket) {
      filePath = '/' + bucket;
    } else if (key) {
      filePath = '/' + key.replace(/^\/+/, '');
    } else {
      filePath = '/';
    }
    return PathConverter.normalizePath(filePath);
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
   * Split a path into bucket and key
   * @param {string} filePath - Path like '/bucket/path/to/file.txt'
   * @returns {{bucket: string, key: string}}
   */
  static splitPath(filePath) {
    const normalized = PathConverter.normalizePath(filePath);
    if (normalized === '/') return { bucket: '', key: '' };
    const parts = normalized.slice(1).split('/');
    const bucket = parts.shift() || '';
    const key = parts.join('/') || '';
    return { bucket, key };
  }

  /**
   * Join bucket and key into a path
   * @param {string} bucket
   * @param {string} key
   * @returns {string}
   */
  static joinPath(bucket, key) {
    let pathStr = '';
    if (bucket && key) {
      pathStr = '/' + bucket + '/' + key.replace(/^\/+/, '');
    } else if (bucket) {
      pathStr = '/' + bucket;
    } else if (key) {
      pathStr = '/' + key.replace(/^\/+/, '');
    } else {
      pathStr = '/';
    }
    // 正規化して余分なスラッシュを除去
    return PathConverter.normalizePath(pathStr);
  }

  /**
   * Normalize a path (remove duplicate slashes, ensure leading slash, remove trailing slash except root)
   * @param {string} filePath
   * @returns {string}
   */
  static normalizePath(filePath) {
    if (!filePath) return '/';
    let norm = path.posix.normalize(filePath).replace(/\/+/g, '/');
    if (!norm.startsWith('/')) norm = '/' + norm;
    if (norm.length > 1 && norm.endsWith('/')) norm = norm.slice(0, -1);
    return norm;
  }

  /**
   * Check if path is directory (trailing slash or root)
   * @param {string} filePath
   * @returns {boolean}
   */
  static isDirectory(filePath) {
    const norm = PathConverter.normalizePath(filePath);
    return norm === '/' || filePath.endsWith('/');
  }

  /**
   * Get parent path (static)
   * @param {string} filePath
   * @returns {string}
   */
  static getParentPath(filePath) {
    const norm = PathConverter.normalizePath(filePath);
    const parent = path.posix.dirname(norm);
    return parent === '.' ? '/' : parent;
    }

  /**
   * Get basename (static)
   * @param {string} filePath
   * @returns {string}
   */
  static getBasename(filePath) {
    const norm = PathConverter.normalizePath(filePath);
    if (norm === '/') return '';
    return path.posix.basename(norm);
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

  // --- staticユーティリティをインスタンスからも呼べるようラップ ---
  normalizePath(filePath) {
    return PathConverter.normalizePath(filePath);
  }
  getBasename(filePath) {
    return PathConverter.getBasename(filePath);
  }
}

export default PathConverter;
