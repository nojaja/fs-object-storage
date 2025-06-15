# fs-object-storage

Node.js fs互換APIでオブジェクトストレージ（MinIO/S3）を操作するライブラリです。

既存のファイルシステムコードを最小限の変更でオブジェクトストレージに対応させることができます。

## 🚀 特徴

- **fs互換API**: 標準のNode.js fsモジュールと同じインターフェース
- **MinIO/S3対応**: MinIOおよびAmazon S3と互換性
- **型安全性**: TypeScriptサポート（型定義含む）
- **ES Modules**: モダンなES Modules形式
- **ストリーミング**: 大容量ファイルのストリーミング処理対応
- **エラーハンドリング**: fs互換のエラーコード変換

## 📦 インストール

```bash
npm install fs-object-storage
```

## 🏃‍♂️ クイックスタート

### 基本的な使用方法

```javascript
import { FsMinioClient } from 'fs-object-storage';

// MinIO/S3クライアントの設定
const client = new FsMinioClient({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123'
});

// ファイル操作（fs互換）
try {
  // ファイル書き込み
  await client.writeFile('/mybucket/path/to/file.txt', 'Hello, World!');
  
  // ファイル読み込み
  const data = await client.readFile('/mybucket/path/to/file.txt', 'utf8');
  console.log(data); // "Hello, World!"
  
  // ファイル存在確認
  const exists = await client.exists('/mybucket/path/to/file.txt');
  console.log(exists); // true
  
  // ディレクトリ一覧
  const files = await client.readdir('/mybucket/path');
  console.log(files); // ['to/']
  
} catch (error) {
  console.error('エラー:', error.message);
}
```

### ストリーミング操作

```javascript
import fs from 'fs';

// 大容量ファイルのアップロード
const readStream = fs.createReadStream('./large-file.zip');
const writeStream = await client.createWriteStream('/mybucket/uploads/large-file.zip');
readStream.pipe(writeStream);

// ダウンロードストリーム
const downloadStream = await client.createReadStream('/mybucket/uploads/large-file.zip');
const localWriteStream = fs.createWriteStream('./downloaded-file.zip');
downloadStream.pipe(localWriteStream);
```

## 🔧 開発環境のセットアップ

### MinIO開発環境（Docker）

```bash
# リポジトリをクローン
git clone <repository-url>
cd fs-object-storage

# 依存関係のインストール
npm install

# MinIO開発環境の起動
docker-compose up -d

# MinIO管理画面: http://localhost:9001
# ユーザー名: minioadmin
# パスワード: minioadmin123
```

### テスト実行

```bash
# 単体テスト
npm run test

# 統合テスト（MinIO必須）
npm run test:integration

# 全テスト
npm run test:all
```

## 📚 API リファレンス

### コンストラクタ

```javascript
new FsMinioClient(options)
```

**options**:
- `endPoint`: MinIO/S3エンドポイント
- `port`: ポート番号
- `useSSL`: SSL使用フラグ
- `accessKey`: アクセスキー
- `secretKey`: シークレットキー

### ファイル操作メソッド

#### `readFile(path, encoding?)`
ファイルを読み込みます。

```javascript
const data = await client.readFile('/bucket/file.txt', 'utf8');
```

#### `writeFile(path, data, options?)`
ファイルを書き込みます。

```javascript
await client.writeFile('/bucket/file.txt', 'データ');
```

#### `exists(path)`
ファイル/ディレクトリの存在を確認します。

```javascript
const exists = await client.exists('/bucket/file.txt');
```

#### `stat(path)`
ファイル/ディレクトリの統計情報を取得します。

```javascript
const stats = await client.stat('/bucket/file.txt');
console.log(stats.size, stats.isFile(), stats.isDirectory());
```

#### `unlink(path)`
ファイルを削除します。

```javascript
await client.unlink('/bucket/file.txt');
```

#### `copyFile(src, dest)`
ファイルをコピーします。

```javascript
await client.copyFile('/bucket/src.txt', '/bucket/dest.txt');
```

### ディレクトリ操作メソッド

#### `readdir(path)`
ディレクトリの内容を一覧します。

```javascript
const files = await client.readdir('/bucket/directory');
```

#### `mkdir(path, options?)`
ディレクトリを作成します。

```javascript
await client.mkdir('/bucket/new-directory', { recursive: true });
```

#### `rmdir(path)`
空のディレクトリを削除します。

```javascript
await client.rmdir('/bucket/empty-directory');
```

### ストリーム操作メソッド

#### `createReadStream(path)`
読み込みストリームを作成します。

```javascript
const stream = await client.createReadStream('/bucket/file.txt');
```

#### `createWriteStream(path)`
書き込みストリームを作成します。

```javascript
const stream = await client.createWriteStream('/bucket/file.txt');
```

## 🗺️ パス形式

ファイルパスは `/bucket/path/to/file.txt` 形式で指定します：

- 先頭の `/` は必須
- 最初のセグメントがバケット名
- それ以降がオブジェクトキー

例：
- `/mybucket/documents/report.pdf` → バケット: `mybucket`, キー: `documents/report.pdf`
- `/photos/2023/vacation.jpg` → バケット: `photos`, キー: `2023/vacation.jpg`

## 🚨 エラーハンドリング

MinIOのエラーは自動的にfs互換のエラーコードに変換されます：

```javascript
try {
  await client.readFile('/bucket/nonexistent.txt');
} catch (error) {
  console.log(error.code); // 'ENOENT'
  console.log(error.errno); // -2
  console.log(error.path); // '/bucket/nonexistent.txt'
}
```

## 📋 対応エラーコード

| MinIOエラー | fsエラーコード | 説明 |
|-------------|----------------|------|
| NoSuchKey | ENOENT | ファイルが存在しない |
| NoSuchBucket | ENOENT | バケットが存在しない |
| AccessDenied | EACCES | アクセス権限がない |
| BucketAlreadyExists | EEXIST | バケットが既に存在 |

## 🔍 使用例

詳細な使用例は以下のファイルを参照してください：

- [`docs/technical/usage-examples.md`](./docs/technical/usage-examples.md) - 包括的な使用例
- [`samples/fs-minio-test.js`](./samples/fs-minio-test.js) - 統合テストサンプル
- [`quick-test.js`](./quick-test.js) - 基本動作確認

## 🏗️ アーキテクチャ

本ライブラリは以下のコンポーネントで構成されています：

- **FsMinioClient**: メインのfs互換クライアント
- **ErrorHandler**: MinIO→fs エラー変換
- **PathConverter**: ファイルパス⇔バケット/キー変換
- **StreamConverter**: ストリーム/データ形式変換

詳細は [`docs/technical/architecture.md`](./docs/technical/architecture.md) を参照してください。

## 🧪 テスト

```bash
# 単体テスト（3つのコンポーネント）
npm run test

# 統合テスト（MinIO接続必須）
npm run test:integration

# 全テスト実行
npm run test:all
```

## 📄 ライセンス

MIT

## 🤝 コントリビューション

バグ報告や機能提案は Issue からお願いします。プルリクエストも歓迎します。

## 📞 サポート

- **ドキュメント**: [`docs/`](./docs/) フォルダ
- **GitHub Issues**: バグ報告・機能要求
- **サンプルコード**: [`samples/`](./samples/) フォルダ"
