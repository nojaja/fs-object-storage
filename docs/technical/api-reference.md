# fs-object-storage API リファレンス

## 概要
`fs-object-storage`は、Node.js標準の`fs`モジュールと互換性のあるAPIを提供しながら、バックエンドでMinIO/S3オブジェクトストレージを使用するライブラリです。

## インストール・セットアップ

### 依存関係
```bash
npm install minio
```

### 基本的な使用方法
```javascript
import { ObjectStorage } from './src/index.js';

const fs = new ObjectStorage({
  endpoint: 'localhost:9000',
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123',
  bucket: 'my-app-bucket',
  useSSL: false,
  prefix: 'app-data'  // オプション：全てのキーにプレフィックスを追加
});

// 初期化（バケット作成など）
await fs.initialize();
```

## コンストラクター

### `new ObjectStorage(options)`

MinIOクライアントインスタンスを作成します。

**パラメーター:**
- `options` (Object) - 設定オプション
  - `endpoint` (string) - MinIOエンドポイント (例: 'localhost:9000')
  - `accessKey` (string) - アクセスキー
  - `secretKey` (string) - シークレットキー
  - `bucket` (string) - 使用するバケット名
  - `useSSL` (boolean, optional) - SSL使用フラグ（デフォルト: false）
  - `region` (string, optional) - リージョン（デフォルト: 'us-east-1'）
  - `prefix` (string, optional) - 全キーに追加するプレフィックス

## ファイル操作メソッド

### `readFile(filePath, options)`

ファイルの内容を読み取ります。

```javascript
// テキストファイルを読む
const content = await fs.readFile('/data/hello.txt', 'utf8');

// バイナリファイルを読む
const buffer = await fs.readFile('/images/photo.jpg');
```

**パラメーター:**
- `filePath` (string) - ファイルパス
- `options` (string|Object, optional) - エンコーディングまたはオプション
  - `encoding` (string) - テキストエンコーディング

**戻り値:** `Promise<Buffer|string>` - ファイル内容

### `writeFile(filePath, data, options)`

ファイルにデータを書き込みます。

```javascript
// テキストファイルを書く
await fs.writeFile('/data/hello.txt', 'Hello World!', 'utf8');

// バイナリファイルを書く
const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
await fs.writeFile('/images/test.png', buffer);
```

**パラメーター:**
- `filePath` (string) - ファイルパス
- `data` (string|Buffer|Uint8Array) - 書き込むデータ
- `options` (string|Object, optional) - エンコーディングまたはオプション

**戻り値:** `Promise<void>`

### `exists(filePath)`

ファイルの存在を確認します。

```javascript
const fileExists = await fs.exists('/data/hello.txt');
console.log(fileExists); // true または false
```

**パラメーター:**
- `filePath` (string) - ファイルパス

**戻り値:** `Promise<boolean>` - ファイル存在フラグ

### `stat(filePath)`

ファイルの統計情報を取得します。

```javascript
const stats = await fs.stat('/data/hello.txt');
console.log('ファイルサイズ:', stats.size);
console.log('更新日時:', stats.mtime);
console.log('ファイルかどうか:', stats.isFile());
```

**パラメーター:**
- `filePath` (string) - ファイルパス

**戻り値:** `Promise<Object>` - fs.Stats風オブジェクト

### `unlink(filePath)`

ファイルを削除します。

```javascript
await fs.unlink('/data/old-file.txt');
```

**パラメーター:**
- `filePath` (string) - ファイルパス

**戻り値:** `Promise<void>`

## ディレクトリ操作メソッド

### `readdir(dirPath, options)`

ディレクトリの内容を一覧表示します。

```javascript
// ファイル名の配列を取得
const files = await fs.readdir('/data');

// Direntオブジェクトの配列を取得
const entries = await fs.readdir('/data', { withFileTypes: true });
```

**パラメーター:**
- `dirPath` (string) - ディレクトリパス
- `options` (Object, optional) - オプション
  - `withFileTypes` (boolean) - Direntオブジェクトを返すかどうか

**戻り値:** `Promise<string[]|Object[]>` - ファイル名またはDirentオブジェクトの配列

### `mkdir(dirPath, options)`

ディレクトリを作成します。

```javascript
// 単一ディレクトリ作成
await fs.mkdir('/new-folder');

// 再帰的作成（親ディレクトリも作成）
await fs.mkdir('/deep/nested/folder', { recursive: true });
```

**パラメーター:**
- `dirPath` (string) - ディレクトリパス
- `options` (Object, optional) - オプション
  - `recursive` (boolean) - 親ディレクトリも作成するかどうか

**戻り値:** `Promise<void>`

### `rmdir(dirPath)`

空のディレクトリを削除します。

```javascript
await fs.rmdir('/empty-folder');
```

**パラメーター:**
- `dirPath` (string) - ディレクトリパス

**戻り値:** `Promise<void>`

## ストリーム操作メソッド

### `createReadStream(filePath, options)`

読み取りストリームを作成します。

```javascript
const readStream = await fs.createReadStream('/large-file.txt');

readStream.on('data', (chunk) => {
  console.log('受信:', chunk.length, 'バイト');
});

readStream.on('end', () => {
  console.log('読み取り完了');
});
```

**パラメーター:**
- `filePath` (string) - ファイルパス
- `options` (Object, optional) - ストリームオプション

**戻り値:** `Promise<Readable>` - 読み取りストリーム

### `createWriteStream(filePath, options)`

書き込みストリームを作成します。

```javascript
const writeStream = fs.createWriteStream('/output.txt');

writeStream.write('Hello ');
writeStream.write('World!');
writeStream.end();
```

**パラメーター:**
- `filePath` (string) - ファイルパス
- `options` (Object, optional) - ストリームオプション

**戻り値:** `Writable` - 書き込みストリーム

## 高度な操作

### `copyFile(srcPath, destPath)`

ファイルをコピーします。

```javascript
await fs.copyFile('/source.txt', '/destination.txt');
```

**パラメーター:**
- `srcPath` (string) - コピー元ファイルパス
- `destPath` (string) - コピー先ファイルパス

**戻り値:** `Promise<void>`

## エラーハンドリング

ライブラリは標準的なNode.js `fs`モジュールと同じエラーコードを使用します：

```javascript
try {
  await fs.readFile('/nonexistent.txt');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('ファイルが見つかりません');
  } else if (error.code === 'EACCES') {
    console.log('アクセス権限がありません');
  }
}
```

### 主要なエラーコード
- `ENOENT` - ファイル/ディレクトリが存在しない
- `EACCES` - アクセス権限拒否
- `EEXIST` - ファイル/ディレクトリが既に存在
- `ENOTDIR` - ディレクトリではない
- `ENOTEMPTY` - ディレクトリが空でない

## パス変換について

ファイルシステムパスは自動的にMinIOオブジェクトキーに変換されます：

```javascript
// ファイルシステムパス → MinIOキー
'/data/users/123/profile.json' → 'data/users/123/profile.json'

// プレフィックス付きの場合
// prefix: 'app-data'
'/data/file.txt' → 'app-data/data/file.txt'
```

## 仮想ディレクトリ

MinIOにはディレクトリの概念がないため、プレフィックスベースの仮想ディレクトリを実装しています：

- ディレクトリマーカー（空のオブジェクト）を使用
- `readdir()`は共通プレフィックスでオブジェクトを検索
- `mkdir()`はディレクトリマーカーオブジェクトを作成

## パフォーマンス考慮事項

- 大きなファイルにはストリームAPIを使用することを推奨
- 同期APIは提供していません（全て非同期）
- バッチ操作は個別に実装する必要があります

## トラブルシューティング

### よくある問題

1. **接続エラー**
```javascript
// 接続設定を確認
console.log('MinIOエンドポイント:', fs.endpoint);
// MinIOサーバーが起動しているか確認
```

2. **認証エラー**
```javascript
// アクセスキー・シークレットキーを確認
// MinIOコンソールで権限を確認
```

3. **バケット存在エラー**
```javascript
// initialize()を呼び出してバケットを作成
await fs.initialize();
```
