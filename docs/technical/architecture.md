# fs-object-storage アーキテクチャ設計

## 概要
Node.js fsモジュール互換のAPIを提供しながら、バックエンドでMinIO/S3オブジェクトストレージを使用するライブラリ。

## アーキテクチャ

### レイヤー構造
```
┌─────────────────────────────────────┐
│        fs 互換 API レイヤー          │
│  (readFile, writeFile, exists, etc.) │
├─────────────────────────────────────┤
│        パス変換レイヤー              │
│  (/path/to/file → bucket/key)       │
├─────────────────────────────────────┤
│        ストリーム変換レイヤー         │
│  (Buffer/String ↔ MinIO Stream)     │
├─────────────────────────────────────┤
│        エラー変換レイヤー            │
│  (MinIO Error → fs Error)           │
├─────────────────────────────────────┤
│        MinIO クライアント            │
│  (Low-level object operations)      │
└─────────────────────────────────────┘
```

## 主要コンポーネント

### 1. ObjectStorage
- メインのクライアントクラス
- fs互換APIの提供
- 設定管理（bucket名、接続情報等）

### 2. PathConverter
- ファイルシステムパス → MinIOオブジェクトキー変換
- 仮想ディレクトリ実装（プレフィックスベース）
- パス正規化

### 3. StreamConverter
- Buffer/String → MinIO readable stream
- MinIO readable stream → Buffer/String
- 非同期ストリーム処理

### 4. ErrorHandler
- MinIOエラー → fs-style エラー変換
- 適切なerror.codeの設定
- エラーメッセージの正規化

### 5. MetadataManager
- ファイルメタデータの管理
- 仮想ディレクトリ情報
- タイムスタンプ、サイズ等の stat 情報

## API設計

### 基本原則
- fs モジュールとの完全互換性
- 同期/非同期両方のAPIサポート
- Promise ベースの実装
- TypeScript サポート

### 実装対象メソッド（優先度順）

#### Phase 1: 基本ファイル操作
- [x] `readFile(path, options)` - ファイル読み込み
- [x] `writeFile(path, data, options)` - ファイル書き込み
- [x] `exists(path)` - ファイル存在確認
- [x] `stat(path)` - ファイル情報取得
- [x] `unlink(path)` - ファイル削除

#### Phase 2: ディレクトリ操作
- [ ] `readdir(path)` - ディレクトリ一覧
- [ ] `mkdir(path)` - ディレクトリ作成
- [ ] `rmdir(path)` - ディレクトリ削除

#### Phase 3: ストリーム操作
- [ ] `createReadStream(path)` - 読み込みストリーム
- [ ] `createWriteStream(path)` - 書き込みストリーム

#### Phase 4: 高度な操作
- [ ] `copyFile(src, dest)` - ファイルコピー
- [ ] `rename(oldPath, newPath)` - ファイル移動/リネーム

## パス変換仕様

### ファイルシステムパス → MinIOキー
```javascript
// 例：
'/data/users/123/profile.json' 
→ bucket: 'myapp', key: 'data/users/123/profile.json'

'/images/avatar.png'
→ bucket: 'myapp', key: 'images/avatar.png'
```

### 仮想ディレクトリ実装
- MinIOにディレクトリ概念はないため、プレフィックスベースで実装
- 空の「ディレクトリマーカー」オブジェクトを作成
- readdir では共通プレフィックスでオブジェクト一覧を取得

## エラーハンドリング

### MinIOエラー → fsエラー変換マッピング
```javascript
const errorMapping = {
  'NoSuchKey': { code: 'ENOENT', errno: -2 },
  'AccessDenied': { code: 'EACCES', errno: -13 },
  'BucketNotFound': { code: 'ENOENT', errno: -2 },
  'InvalidBucketName': { code: 'EINVAL', errno: -22 },
};
```

## 設定例
```javascript
const fs = new ObjectStorage({
  endpoint: 'localhost:9000',
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
  bucket: 'myapp',
  useSSL: false
});

// fs互換API
await fs.writeFile('/data/test.txt', 'Hello World');
const content = await fs.readFile('/data/test.txt', 'utf8');
```

## 実装フェーズ計画

### Phase 1: 基本実装 (目標: 2-3日)
1. プロジェクト構造セットアップ
2. FsMinioClient基本クラス作成
3. 基本ファイル操作（read/write/exists/stat/unlink）実装
4. 基本的なエラーハンドリング

### Phase 2: ディレクトリ機能 (目標: 1-2日)
1. PathConverter実装
2. 仮想ディレクトリ機能
3. readdir, mkdir, rmdir実装

### Phase 3: ストリーム機能 (目標: 1-2日)
1. StreamConverter実装
2. createReadStream, createWriteStream実装
3. 大きなファイル対応

### Phase 4: 完成 (目標: 1日)
1. 高度な機能（copy, rename等）
2. TypeScript型定義
3. 詳細テスト
4. ドキュメント整備

## テスト戦略

### 単体テスト
- 各コンポーネントの独立テスト
- モックを使用したMinIOクライアント分離

### 統合テスト
- 実際のMinIOコンテナを使用
- End-to-endテストシナリオ

### パフォーマンステスト
- 大きなファイルの読み書き
- 同時接続数の確認
- メモリ使用量の監視

### `new ObjectStorage(options)`
```javascript
const fs = new ObjectStorage({
  endpoint: 'localhost:9000',
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
  bucket: 'myapp',
  useSSL: false
});

// 以降のclientをfsに統一
```
