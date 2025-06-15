import { Readable, Writable } from 'stream';

export interface Config {
  endPoint: string;
  port?: number;
  useSSL?: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
  sessionToken?: string;
  partSize?: number;
}

export interface StatResult {
  size: number;
  mtime: Date;
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
}

export interface WriteFileOptions {
  encoding?: BufferEncoding;
  mode?: number;
  flag?: string;
}

export interface MkdirOptions {
  recursive?: boolean;
  mode?: number;
}

export interface FileSystemError extends Error {
  code: string;
  errno: number;
  path?: string;
  syscall?: string;
}

export default class ObjectStorage {
  constructor(config: Config);

  // File operations
  readFile(path: string): Promise<Buffer>;
  readFile(path: string, encoding: BufferEncoding): Promise<string>;
  readFile(path: string, encoding?: BufferEncoding): Promise<Buffer | string>;

  writeFile(path: string, data: string | Buffer | Uint8Array, options?: WriteFileOptions): Promise<void>;

  exists(path: string): Promise<boolean>;

  stat(path: string): Promise<StatResult>;

  unlink(path: string): Promise<void>;

  copyFile(src: string, dest: string): Promise<void>;

  // Directory operations
  readdir(path: string): Promise<string[]>;

  mkdir(path: string, options?: MkdirOptions): Promise<void>;

  rmdir(path: string): Promise<void>;

  // Stream operations
  createReadStream(path: string): Promise<Readable>;

  createWriteStream(path: string): Promise<Writable>;
}

export class ErrorHandler {
  static convertMinioError(error: Error, path?: string): FileSystemError;
  static createFileSystemError(code: string, path?: string, syscall?: string): FileSystemError;
}

export class PathConverter {
  static splitPath(path: string): { bucket: string; key: string };
  static joinPath(bucket: string, key: string): string;
  static normalizePath(path: string): string;
  static isDirectory(path: string): boolean;
  static getParentPath(path: string): string;
  static getBasename(path: string): string;
}

export class StreamConverter {
  static bufferToString(buffer: Buffer, encoding?: BufferEncoding): string;
  static stringToBuffer(str: string, encoding?: BufferEncoding): Buffer;
  static streamToBuffer(stream: Readable): Promise<Buffer>;
  static bufferToStream(buffer: Buffer): Readable;
  static createPassThroughStream(): { stream: Writable; promise: Promise<Buffer> };
  static normalizeData(data: any): Buffer;
}

export default ObjectStorage;
