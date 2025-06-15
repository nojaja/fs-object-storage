// fs-object-storage - fs-compatible API for MinIO/S3 object storage
// Main entry point

import ObjectStorage from './lib/ObjectStorage.js';
import PathConverter from './lib/PathConverter.js';
import StreamConverter from './lib/StreamConverter.js';
import ErrorHandler from './lib/ErrorHandler.js';

export {
  ObjectStorage,
  PathConverter,
  StreamConverter,
  ErrorHandler
};

// Default export for convenience
export default ObjectStorage;
