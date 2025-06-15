// fs-minio - fs-compatible API for MinIO/S3 object storage
// Main entry point

import FsMinioClient from './lib/FsMinioClient.js';
import PathConverter from './lib/PathConverter.js';
import StreamConverter from './lib/StreamConverter.js';
import ErrorHandler from './lib/ErrorHandler.js';

export {
  FsMinioClient,
  PathConverter,
  StreamConverter,
  ErrorHandler
};

// Default export for convenience
export default FsMinioClient;
