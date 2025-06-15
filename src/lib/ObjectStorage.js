// ObjectStorage.js - Main fs-compatible client for MinIO/S3 operations

import { Client as MinioClient } from 'minio';
import PathConverter from './PathConverter.js';
import StreamConverter from './StreamConverter.js';
import ErrorHandler from './ErrorHandler.js';

class ObjectStorage {
  /**
   * Create ObjectStorage instance
   * @param {Object} options - Configuration options
   * @param {string} options.endpoint - MinIO endpoint (e.g., 'localhost:9000')
   * @param {string} options.accessKey - Access key
   * @param {string} options.secretKey - Secret key
   * @param {string} options.bucket - Bucket name
   * @param {boolean} [options.useSSL=false] - Use SSL
   * @param {string} [options.region='us-east-1'] - Region
   * @param {string} [options.prefix=''] - Key prefix for all operations
   */
  constructor(options = {}) {
    // Validate required options
    if (!options.endpoint) throw new Error('endpoint is required');
    if (!options.accessKey) throw new Error('accessKey is required');
    if (!options.secretKey) throw new Error('secretKey is required');
    if (!options.bucket) throw new Error('bucket is required');

    // Initialize MinIO client
    this.minioClient = new MinioClient({
      endPoint: options.endpoint.split(':')[0],
      port: parseInt(options.endpoint.split(':')[1]) || (options.useSSL ? 443 : 80),
      useSSL: options.useSSL || false,
      accessKey: options.accessKey,
      secretKey: options.secretKey,
      region: options.region || 'us-east-1'
    });

    // Initialize path converter
    this.pathConverter = new PathConverter({
      bucket: options.bucket,
      prefix: options.prefix
    });

    this.bucket = options.bucket;
    this._initialized = false;
  }

  /**
   * Initialize client (create bucket if it doesn't exist)
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) return;

    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucket);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucket);
      }
      this._initialized = true;
    } catch (error) {
      throw ErrorHandler.convertError(error, null, 'initialize');
    }
  }

  /**
   * Read file content
   * @param {string} filePath - File path
   * @param {Object|string} [options] - Options or encoding string
   * @param {string} [options.encoding] - Text encoding ('utf8', 'base64', etc.)
   * @returns {Promise<Buffer|string>} File content
   */
  async readFile(filePath, options = {}) {
    await this.initialize();

    try {
      // Handle options parameter
      if (typeof options === 'string') {
        options = { encoding: options };
      }

      this.pathConverter.validatePath(filePath);
      const { bucket, key } = this.pathConverter.pathToMinIO(filePath);

      // Get object stream
      const stream = await this.minioClient.getObject(bucket, key);
      
      // Convert stream to buffer
      const buffer = await StreamConverter.streamToBuffer(stream);

      // Return string if encoding specified, otherwise buffer
      if (options.encoding) {
        return buffer.toString(options.encoding);
      }
      
      return buffer;

    } catch (error) {
      throw ErrorHandler.convertError(error, filePath, 'open');
    }
  }

  /**
   * Write file content
   * @param {string} filePath - File path
   * @param {string|Buffer|Uint8Array} data - Data to write
   * @param {Object|string} [options] - Options or encoding string
   * @param {string} [options.encoding='utf8'] - Text encoding for string data
   * @returns {Promise<void>}
   */
  async writeFile(filePath, data, options = {}) {
    await this.initialize();

    try {
      // Handle options parameter
      if (typeof options === 'string') {
        options = { encoding: options };
      }

      this.pathConverter.validatePath(filePath);
      const { bucket, key } = this.pathConverter.pathToMinIO(filePath);

      // Convert data to stream
      const stream = StreamConverter.toReadableStream(data);
      const size = StreamConverter.getDataSize(data);

      // Upload object
      if (size !== undefined) {
        await this.minioClient.putObject(bucket, key, stream, size);
      } else {
        await this.minioClient.putObject(bucket, key, stream);
      }

    } catch (error) {
      throw ErrorHandler.convertError(error, filePath, 'open');
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path
   * @returns {Promise<boolean>} True if file exists
   */
  async exists(filePath) {
    try {
      await this.stat(filePath);
      return true;
    } catch (error) {
      if (ErrorHandler.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file statistics
   * @param {string} filePath - File path
   * @returns {Promise<Object>} File stats object
   */
  async stat(filePath) {
    await this.initialize();

    try {
      this.pathConverter.validatePath(filePath);
      const { bucket, key } = this.pathConverter.pathToMinIO(filePath);

      // Get object stats
      const objInfo = await this.minioClient.statObject(bucket, key);

      // Convert to fs.Stats-like object
      return {
        isFile: () => true,
        isDirectory: () => false,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isSymbolicLink: () => false,
        isFIFO: () => false,
        isSocket: () => false,
        size: objInfo.size,
        mode: 0o644, // Default file permissions
        uid: 0,
        gid: 0,
        atime: objInfo.lastModified,
        mtime: objInfo.lastModified,
        ctime: objInfo.lastModified,
        birthtime: objInfo.lastModified,
        dev: 0,
        ino: 0,
        nlink: 1,
        rdev: 0,
        blocks: Math.ceil(objInfo.size / 512),
        blksize: 4096,
        etag: objInfo.etag
      };

    } catch (error) {
      throw ErrorHandler.convertError(error, filePath, 'stat');
    }
  }

  /**
   * Delete file
   * @param {string} filePath - File path
   * @returns {Promise<void>}
   */
  async unlink(filePath) {
    await this.initialize();

    try {
      this.pathConverter.validatePath(filePath);
      const { bucket, key } = this.pathConverter.pathToMinIO(filePath);

      // Check if file exists first
      try {
        await this.minioClient.statObject(bucket, key);
      } catch (error) {
        // If file doesn't exist, throw ENOENT error
        throw ErrorHandler.convertError(error, filePath, 'unlink');
      }

      // Remove object
      await this.minioClient.removeObject(bucket, key);

    } catch (error) {
      if (!ErrorHandler.isNotFoundError(error)) {
        throw ErrorHandler.convertError(error, filePath, 'unlink');
      }
      throw error;
    }
  }

  /**
   * Read directory contents
   * @param {string} dirPath - Directory path
   * @param {Object} [options] - Options
   * @param {boolean} [options.withFileTypes=false] - Return Dirent objects
   * @returns {Promise<string[]|Object[]>} Directory contents
   */
  async readdir(dirPath, options = {}) {
    await this.initialize();

    try {
      this.pathConverter.validatePath(dirPath);
      const { bucket, prefix } = this.pathConverter.getListPrefix(dirPath);

      const objects = [];
      const objectStream = this.minioClient.listObjectsV2(bucket, prefix, false);

      // Collect all objects
      await new Promise((resolve, reject) => {
        objectStream.on('data', (obj) => {
          objects.push(obj);
        });
        objectStream.on('end', resolve);
        objectStream.on('error', reject);
      });      // Extract filenames and remove prefix
      const filenames = objects
        .map(obj => {
          // Handle both regular objects and prefix objects
          let name = obj.name || obj.prefix;
          if (!name) {
            console.log('Warning: Object missing name/prefix property:', obj);
            return null;
          }
          if (prefix && name.startsWith(prefix)) {
            name = name.substring(prefix.length);
          }
          // Remove trailing slash from directory names
          if (name.endsWith('/')) {
            name = name.slice(0, -1);
          }
          return name;
        })
        .filter(name => name !== null && name.length > 0) // Remove null and empty names
        .filter(name => !name.includes('/')) // Only direct children
        .sort();

      // Return Dirent objects if requested
      if (options.withFileTypes) {
        return filenames.map(name => ({
          name,
          isFile: () => true,
          isDirectory: () => false,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false
        }));
      }

      return filenames;

    } catch (error) {
      throw ErrorHandler.convertError(error, dirPath, 'scandir');
    }
  }

  /**
   * Create directory (creates directory marker object)
   * @param {string} dirPath - Directory path
   * @param {Object} [options] - Options
   * @param {boolean} [options.recursive=false] - Create parent directories
   * @returns {Promise<void>}
   */
  async mkdir(dirPath, options = {}) {
    await this.initialize();

    try {
      this.pathConverter.validatePath(dirPath);
        // Create parent directories if recursive option is enabled
      if (options.recursive) {
        const parent = this.pathConverter.getParentPath(dirPath);
        if (parent !== '/' && parent !== dirPath) {
          // Recursively create parent directory without checking if it exists first
          await this.mkdir(parent, { recursive: true });
        }
      }

      const { bucket, key } = this.pathConverter.createDirectoryMarker(dirPath);      // Check if directory already exists
      try {
        await this.minioClient.statObject(bucket, key);
        // Directory already exists
        if (!options.recursive) {
          throw ErrorHandler.createError('EEXIST', dirPath, 'mkdir');
        }
        return;
      } catch (error) {
        // If error is not "Not Found", re-throw it
        if (error.code !== 'NotFound' && 
            !error.message.includes('Not Found') && 
            !ErrorHandler.isNotFoundError(error)) {
          throw ErrorHandler.convertError(error, dirPath, 'mkdir');
        }
        // Otherwise, directory doesn't exist, continue to create it
      }

      // Create empty directory marker object
      const emptyStream = StreamConverter.toReadableStream('');
      await this.minioClient.putObject(bucket, key, emptyStream, 0);

    } catch (error) {
      if (!ErrorHandler.isExistsError(error)) {
        throw ErrorHandler.convertError(error, dirPath, 'mkdir');
      }
      throw error;
    }
  }

  /**
   * Remove directory
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  async rmdir(dirPath) {
    await this.initialize();

    try {
      this.pathConverter.validatePath(dirPath);

      // Check if directory is empty
      const contents = await this.readdir(dirPath);
      if (contents.length > 0) {
        throw ErrorHandler.createError('ENOTEMPTY', dirPath, 'rmdir');
      }

      // Remove directory marker
      const { bucket, key } = this.pathConverter.createDirectoryMarker(dirPath);
      await this.minioClient.removeObject(bucket, key);

    } catch (error) {
      if (!ErrorHandler.isNotFoundError(error) && error.code !== 'ENOTEMPTY') {
        throw ErrorHandler.convertError(error, dirPath, 'rmdir');
      }
      throw error;
    }
  }

  /**
   * Create read stream
   * @param {string} filePath - File path
   * @param {Object} [options] - Stream options
   * @returns {Promise<Readable>} Read stream
   */
  async createReadStream(filePath, options = {}) {
    await this.initialize();

    try {
      this.pathConverter.validatePath(filePath);
      const { bucket, key } = this.pathConverter.pathToMinIO(filePath);

      // Get object stream
      const stream = await this.minioClient.getObject(bucket, key);
      return stream;

    } catch (error) {
      throw ErrorHandler.convertError(error, filePath, 'open');
    }
  }

  /**
   * Create write stream
   * @param {string} filePath - File path
   * @param {Object} [options] - Stream options
   * @returns {Writable} Write stream
   */
  createWriteStream(filePath, options = {}) {
    const passThrough = StreamConverter.createPassThrough();
    
    // Handle the upload asynchronously
    this.initialize()
      .then(() => {
        this.pathConverter.validatePath(filePath);
        const { bucket, key } = this.pathConverter.pathToMinIO(filePath);
        
        return this.minioClient.putObject(bucket, key, passThrough);
      })
      .catch(error => {
        passThrough.destroy(ErrorHandler.convertError(error, filePath, 'open'));
      });

    return passThrough;
  }

  /**
   * Copy file
   * @param {string} srcPath - Source file path
   * @param {string} destPath - Destination file path
   * @returns {Promise<void>}
   */
  async copyFile(srcPath, destPath) {
    await this.initialize();

    try {
      this.pathConverter.validatePath(srcPath);
      this.pathConverter.validatePath(destPath);
      
      const srcMinIO = this.pathConverter.pathToMinIO(srcPath);
      const destMinIO = this.pathConverter.pathToMinIO(destPath);

      // Copy object within MinIO
      const copyConditions = new this.minioClient.CopyConditions();
      await this.minioClient.copyObject(
        destMinIO.bucket, 
        destMinIO.key, 
        `/${srcMinIO.bucket}/${srcMinIO.key}`, 
        copyConditions
      );

    } catch (error) {
      throw ErrorHandler.convertError(error, srcPath, 'open');
    }
  }

  /**
   * Get MinIO client instance for advanced operations
   * @returns {MinioClient} MinIO client
   */
  getMinioClient() {
    return this.minioClient;
  }

  /**
   * Get bucket name
   * @returns {string} Bucket name
   */
  getBucket() {
    return this.bucket;
  }

  /**
   * Get path converter instance
   * @returns {PathConverter} Path converter
   */
  getPathConverter() {
    return this.pathConverter;
  }
}

export default ObjectStorage;
