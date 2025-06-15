// ErrorHandler.js - MinIO errors to fs-compatible errors conversion

class ErrorHandler {
  static errorMapping = {
    // MinIO/S3 specific errors
    'NoSuchKey': { code: 'ENOENT', errno: -2, message: 'no such file or directory' },
    'NoSuchBucket': { code: 'ENOENT', errno: -2, message: 'no such file or directory' },
    'BucketNotFound': { code: 'ENOENT', errno: -2, message: 'no such file or directory' },
    'AccessDenied': { code: 'EACCES', errno: -13, message: 'permission denied' },
    'InvalidBucketName': { code: 'EINVAL', errno: -22, message: 'invalid argument' },
    'BucketAlreadyExists': { code: 'EEXIST', errno: -17, message: 'file already exists' },
    'KeyTooLong': { code: 'ENAMETOOLONG', errno: -36, message: 'file name too long' },
    
    // Network/Connection errors
    'ENOTFOUND': { code: 'ENOTFOUND', errno: -3008, message: 'getaddrinfo ENOTFOUND' },
    'ECONNREFUSED': { code: 'ECONNREFUSED', errno: -61, message: 'connect ECONNREFUSED' },
    'ETIMEDOUT': { code: 'ETIMEDOUT', errno: -60, message: 'operation timed out' },
    
    // Default fallback
    'Unknown': { code: 'EIO', errno: -5, message: 'input/output error' }
  };

  /**
   * Convert MinIO error to fs-compatible error
   * @param {Error} minioError - Original MinIO error
   * @param {string} path - File path for context
   * @param {string} operation - Operation that failed (e.g., 'open', 'read', 'write')
   * @returns {Error} fs-compatible error
   */
  static convertError(minioError, path = null, operation = null) {
    // If it's already an fs-style error, return as-is
    if (minioError.code && minioError.errno) {
      return minioError;
    }

    let errorInfo;
    
    // Try to identify error by MinIO error code
    if (minioError.code && this.errorMapping[minioError.code]) {
      errorInfo = this.errorMapping[minioError.code];
    }    // Try to identify by error message patterns
    else if (minioError.message) {
      if (minioError.message.includes('key does not exist') || 
          minioError.message.includes('NoSuchKey') ||
          minioError.message.includes('Not Found')) {
        errorInfo = this.errorMapping['NoSuchKey'];
      } else if (minioError.message.includes('bucket does not exist') ||
                 minioError.message.includes('NoSuchBucket')) {
        errorInfo = this.errorMapping['NoSuchBucket'];
      } else if (minioError.message.includes('access denied') ||
                 minioError.message.includes('AccessDenied')) {
        errorInfo = this.errorMapping['AccessDenied'];
      } else if (minioError.message.includes('ENOTFOUND')) {
        errorInfo = this.errorMapping['ENOTFOUND'];
      } else if (minioError.message.includes('ECONNREFUSED')) {
        errorInfo = this.errorMapping['ECONNREFUSED'];
      } else if (minioError.message.includes('timeout') ||
                 minioError.message.includes('ETIMEDOUT')) {
        errorInfo = this.errorMapping['ETIMEDOUT'];
      } else {
        errorInfo = this.errorMapping['Unknown'];
      }
    } else {
      errorInfo = this.errorMapping['Unknown'];
    }

    // Create fs-style error
    const error = new Error();
    error.code = errorInfo.code;
    error.errno = errorInfo.errno;
    error.syscall = operation || 'open';
    error.path = path;
    
    // Create message in fs style: "ENOENT: no such file or directory, open '/path/to/file'"
    if (path) {
      error.message = `${errorInfo.code}: ${errorInfo.message}, ${error.syscall} '${path}'`;
    } else {
      error.message = `${errorInfo.code}: ${errorInfo.message}`;
    }

    // Preserve original error information
    error.originalError = minioError;
    
    return error;
  }

  /**
   * Create custom fs-style error
   * @param {string} code - Error code (e.g., 'ENOENT')
   * @param {string} path - File path
   * @param {string} operation - Operation name
   * @returns {Error} fs-compatible error
   */
  static createError(code, path = null, operation = 'open') {
    // ENOENT, EACCES, EEXIST, EINVAL, ENAMETOOLONG など標準エラーコードにも対応
    let errorInfo = this.errorMapping[code];
    if (!errorInfo) {
      // 標準的なfsエラーコードをサポート
      switch (code) {
        case 'ENOENT': errorInfo = { code: 'ENOENT', errno: -2, message: 'no such file or directory' }; break;
        case 'EACCES': errorInfo = { code: 'EACCES', errno: -13, message: 'permission denied' }; break;
        case 'EEXIST': errorInfo = { code: 'EEXIST', errno: -17, message: 'file already exists' }; break;
        case 'EINVAL': errorInfo = { code: 'EINVAL', errno: -22, message: 'invalid argument' }; break;
        case 'ENAMETOOLONG': errorInfo = { code: 'ENAMETOOLONG', errno: -36, message: 'file name too long' }; break;
        default: errorInfo = this.errorMapping['Unknown'];
      }
    }
    const error = new Error();
    error.code = code;
    error.errno = errorInfo.errno;
    error.syscall = operation;
    error.path = path;
    if (path) {
      error.message = `${code}: ${errorInfo.message}, ${operation} '${path}'`;
    } else {
      error.message = `${code}: ${errorInfo.message}`;
    }
    return error;
  }

  /**
   * Check if error indicates file not found
   * @param {Error} error - Error to check
   * @returns {boolean} True if file not found error
   */
  static isNotFoundError(error) {
    return error && error.code === 'ENOENT';
  }

  /**
   * Check if error indicates access denied
   * @param {Error} error - Error to check
   * @returns {boolean} True if access denied error
   */
  static isAccessDeniedError(error) {
    return error && error.code === 'EACCES';
  }

  /**
   * Check if error indicates file already exists
   * @param {Error} error - Error to check
   * @returns {boolean} True if file exists error
   */
  static isExistsError(error) {
    return error && error.code === 'EEXIST';
  }
}

export default ErrorHandler;
