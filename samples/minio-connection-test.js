// MinIO接続テスト用サンプル
import * as Minio from 'minio';

console.log('=== MinIO接続テスト ===');

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin123'
});

async function testMinIOConnection() {
    try {
        console.log('\n1. MinIOサーバーへの接続テスト');
        
        // バケット一覧の取得テスト
        const buckets = await minioClient.listBuckets();
        console.log('✅ 接続成功！現在のバケット数:', buckets.length);
        
        // テスト用バケットの作成
        const testBucket = 'fs-storage-test';
        const bucketExists = await minioClient.bucketExists(testBucket);
        
        if (!bucketExists) {
            await minioClient.makeBucket(testBucket);
            console.log(`✅ テストバケット '${testBucket}' を作成したのだ`);
        } else {
            console.log(`✅ テストバケット '${testBucket}' は既に存在するのだ`);
        }
        
        // テストファイルの書き込み
        const testData = 'Hello MinIO from Node.js!';
        const testFileName = 'test-file.txt';
        
        await minioClient.putObject(testBucket, testFileName, testData);
        console.log(`✅ テストファイル '${testFileName}' を書き込んだのだ`);
        
        // テストファイルの読み込み
        const dataStream = await minioClient.getObject(testBucket, testFileName);
        let result = '';
        
        dataStream.on('data', (chunk) => {
            result += chunk;
        });
        
        dataStream.on('end', () => {
            console.log(`✅ テストファイル読み込み結果: ${result}`);
            console.log('\n🎉 MinIO環境は正常に動作しているのだ！');
        });
        
        dataStream.on('error', (err) => {
            console.error('❌ ファイル読み込みエラー:', err);
        });
        
    } catch (error) {
        console.error('❌ MinIO接続エラー:', error.message);
        console.log('\n💡 MinIOサーバーが起動しているか確認するのだ：');
        console.log('   - docker compose ps');
        console.log('   - http://localhost:9001 でWebコンソールにアクセス');
    }
}

// 接続テスト実行
testMinIOConnection();
