# fs-object-storage 使用例

このドキュメントでは、`fs-object-storage`ライブラリの実際的な使用例を紹介します。

## 1. 基本セットアップ

```javascript
import { ObjectStorage } from 'fs-object-storage';

// クライアント作成
const fs = new ObjectStorage({
  endpoint: 'localhost:9000',
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123',
  bucket: 'my-app-storage',
  useSSL: false,
  prefix: 'app-data'
});

// 初期化
await fs.initialize();
```

## 2. ファイル管理システム

### ファイルアップロード
```javascript
async function uploadFile(filePath, fileContent) {
  try {
    await fs.writeFile(filePath, fileContent);
    console.log(`ファイル ${filePath} をアップロードしました`);
  } catch (error) {
    console.error('アップロードエラー:', error.message);
  }
}

// テキストファイル
await uploadFile('/documents/readme.txt', 'このファイルはMinIOに保存されています');

// JSONデータ
const userData = { name: 'ずんだもん', age: 3, hobby: 'ずんだ餅作り' };
await uploadFile('/data/user.json', JSON.stringify(userData, null, 2));
```

### ファイルダウンロード
```javascript
async function downloadFile(filePath) {
  try {
    if (await fs.exists(filePath)) {
      const content = await fs.readFile(filePath, 'utf8');
      console.log(`ファイル内容: ${content}`);
      return content;
    } else {
      console.log('ファイルが見つかりません');
    }
  } catch (error) {
    console.error('ダウンロードエラー:', error.message);
  }
}

await downloadFile('/documents/readme.txt');
```

## 3. 画像ストレージシステム

### 画像アップロード
```javascript
import fs from 'fs';

async function uploadImage(imagePath, localPath) {
  try {
    // ローカルファイルを読み込み
    const imageBuffer = fs.readFileSync(localPath);
    
    // MinIOにアップロード
    await fs.writeFile(imagePath, imageBuffer);
    
    console.log(`画像 ${imagePath} をアップロードしました`);
    
    // 画像情報を取得
    const stats = await fs.stat(imagePath);
    console.log(`ファイルサイズ: ${stats.size} bytes`);
    
  } catch (error) {
    console.error('画像アップロードエラー:', error.message);
  }
}

await uploadImage('/images/profile/avatar.jpg', './local-avatar.jpg');
```

### サムネイル管理
```javascript
async function createThumbnailStructure(userId) {
  const userDir = `/images/users/${userId}`;
  
  try {
    // ユーザー画像ディレクトリ作成
    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(`${userDir}/thumbnails`, { recursive: true });
    await fs.mkdir(`${userDir}/originals`, { recursive: true });
    
    console.log(`ユーザー ${userId} の画像フォルダを作成しました`);
  } catch (error) {
    console.error('フォルダ作成エラー:', error.message);
  }
}

await createThumbnailStructure('user123');
```

## 4. ログ管理システム

### ログ書き込み
```javascript
async function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}\n`;
  
  const today = new Date().toISOString().split('T')[0];
  const logPath = `/logs/${today}.log`;
  
  try {
    // 既存ログがあるかチェック
    let existingLog = '';
    if (await fs.exists(logPath)) {
      existingLog = await fs.readFile(logPath, 'utf8');
    }
    
    // ログエントリを追加
    await fs.writeFile(logPath, existingLog + logEntry);
    
  } catch (error) {
    console.error('ログ書き込みエラー:', error.message);
  }
}

await writeLog('info', 'アプリケーションが開始されました');
await writeLog('error', 'データベース接続に失敗しました');
```

### ログ読み取り
```javascript
async function readLogs(date) {
  const logPath = `/logs/${date}.log`;
  
  try {
    if (await fs.exists(logPath)) {
      const logContent = await fs.readFile(logPath, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      console.log(`${date}のログ (${lines.length}エントリ):`);
      lines.forEach(line => console.log(line));
    } else {
      console.log(`${date}のログファイルは存在しません`);
    }
  } catch (error) {
    console.error('ログ読み取りエラー:', error.message);
  }
}

await readLogs('2025-06-04');
```

## 5. バックアップシステム

### データバックアップ
```javascript
async function backupData(sourceDir, backupDir) {
  try {
    // バックアップディレクトリ作成
    await fs.mkdir(backupDir, { recursive: true });
    
    // ソースディレクトリのファイル一覧取得
    const files = await fs.readdir(sourceDir);
    
    console.log(`${files.length}ファイルをバックアップします...`);
    
    for (const file of files) {
      const sourcePath = `${sourceDir}/${file}`;
      const backupPath = `${backupDir}/${file}`;
      
      // ファイルコピー
      await fs.copyFile(sourcePath, backupPath);
      console.log(`✓ ${file} をバックアップしました`);
    }
    
    console.log('バックアップ完了');
    
  } catch (error) {
    console.error('バックアップエラー:', error.message);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
await backupData('/important-data', `/backups/${timestamp}`);
```

## 6. ストリーミング処理

### 大きなファイルのストリーミング
```javascript
async function streamLargeFile(filePath) {
  try {
    const readStream = await fs.createReadStream(filePath);
    
    let totalBytes = 0;
    
    readStream.on('data', (chunk) => {
      totalBytes += chunk.length;
      console.log(`受信: ${chunk.length} bytes (合計: ${totalBytes})`);
    });
    
    readStream.on('end', () => {
      console.log(`ストリーミング完了: 合計 ${totalBytes} bytes`);
    });
    
    readStream.on('error', (error) => {
      console.error('ストリーミングエラー:', error.message);
    });
    
  } catch (error) {
    console.error('ストリーム作成エラー:', error.message);
  }
}

await streamLargeFile('/videos/large-movie.mp4');
```

### ストリーミングアップロード
```javascript
function streamUpload(filePath, dataGenerator) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    
    writeStream.on('finish', () => {
      console.log('アップロード完了');
      resolve();
    });
    
    writeStream.on('error', reject);
    
    // データを段階的に書き込み
    for (const data of dataGenerator()) {
      writeStream.write(data);
    }
    
    writeStream.end();
  });
}

// 大きなCSVファイルの生成例
function* generateCsvData() {
  yield 'id,name,email\n';
  for (let i = 1; i <= 10000; i++) {
    yield `${i},User${i},user${i}@example.com\n`;
  }
}

await streamUpload('/data/users.csv', generateCsvData);
```

## 7. ファイル管理ユーティリティ

### ディレクトリサイズ計算
```javascript
async function calculateDirectorySize(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = `${dirPath}/${file}`;
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
    
    console.log(`${dirPath} のサイズ: ${totalSize} bytes`);
    return totalSize;
    
  } catch (error) {
    console.error('サイズ計算エラー:', error.message);
    return 0;
  }
}

await calculateDirectorySize('/documents');
```

### ファイルクリーンアップ
```javascript
async function cleanupOldFiles(dirPath, daysOld = 30) {
  try {
    const files = await fs.readdir(dirPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = `${dirPath}/${file}`;
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        console.log(`削除: ${file}`);
        deletedCount++;
      }
    }
    
    console.log(`${deletedCount}ファイルを削除しました`);
    
  } catch (error) {
    console.error('クリーンアップエラー:', error.message);
  }
}

await cleanupOldFiles('/temp', 7); // 7日以上古いファイルを削除
```

## 8. エラーハンドリングのベストプラクティス

```javascript
async function robustFileOperation(filePath, data) {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await fs.writeFile(filePath, data);
      console.log('ファイル操作成功');
      return;
      
    } catch (error) {
      retries++;
      
      if (error.code === 'ENOENT') {
        // ディレクトリが存在しない場合は作成
        const dir = filePath.substring(0, filePath.lastIndexOf('/'));
        await fs.mkdir(dir, { recursive: true });
        
      } else if (error.code === 'EACCES') {
        console.error('アクセス権限エラー:', error.message);
        break;
        
      } else if (retries < maxRetries) {
        console.log(`リトライ ${retries}/${maxRetries}: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        
      } else {
        console.error('最大リトライ数に達しました:', error.message);
        throw error;
      }
    }
  }
}

await robustFileOperation('/new-dir/important-file.txt', 'Important data');
```

## 9. パフォーマンス最適化

### 並列処理
```javascript
async function parallelUpload(files) {
  const uploadPromises = files.map(async ({ path, content }) => {
    try {
      await fs.writeFile(path, content);
      return { path, success: true };
    } catch (error) {
      return { path, success: false, error: error.message };
    }
  });
  
  const results = await Promise.all(uploadPromises);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`アップロード完了: 成功 ${successful}, 失敗 ${failed}`);
  
  return results;
}

const filesToUpload = [
  { path: '/batch/file1.txt', content: 'Content 1' },
  { path: '/batch/file2.txt', content: 'Content 2' },
  { path: '/batch/file3.txt', content: 'Content 3' }
];

await parallelUpload(filesToUpload);
```

これらの例を参考に、MinIOをファイルシステムとして活用したアプリケーションを開発できます。`fs-minio`ライブラリにより、従来のファイルシステム操作をクラウドストレージ環境でも同じように実行できるのだ！
