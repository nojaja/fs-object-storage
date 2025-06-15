// MinIOライブラリのAPI調査用サンプル（接続なし確認）
import * as Minio from 'minio';

console.log('=== MinIO API調査 ===');

// 1. MinIOクライアントの基本的なAPI確認
console.log('\n1. MinIOクライアントの利用可能なメソッド:');
const client = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'dummy',
    secretKey: 'dummy'
});

const clientMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
    .filter(name => typeof client[name] === 'function' && !name.startsWith('_'));
console.log('主要メソッド:', clientMethods);

// 2. 重要なメソッドの詳細確認
console.log('\n2. 重要なメソッドの詳細:');
const importantMethods = [
    'getObject',
    'putObject', 
    'removeObject',
    'statObject',
    'listObjects',
    'bucketExists',
    'makeBucket'
];

importantMethods.forEach(method => {
    if (typeof client[method] === 'function') {
        console.log(`✓ ${method}: 利用可能`);
    } else {
        console.log(`✗ ${method}: 利用不可`);
    }
});

// 3. fs互換APIとの対応関係の分析
console.log('\n3. fs互換APIとMinIO APIの対応関係:');
const fsToMinioMapping = {
    'fs.readFile': 'client.getObject',
    'fs.writeFile': 'client.putObject',
    'fs.exists': 'client.statObject (catchでfalse)',
    'fs.stat': 'client.statObject',
    'fs.unlink': 'client.removeObject',
    'fs.readdir': 'client.listObjects'
};

Object.entries(fsToMinioMapping).forEach(([fsMethod, minioMethod]) => {
    console.log(`${fsMethod} → ${minioMethod}`);
});

// 4. 設定可能なオプションの確認
console.log('\n4. 主要設定項目:');
console.log('- endPoint: MinIOサーバーのホスト');
console.log('- port: ポート番号');
console.log('- useSSL: SSL使用有無');
console.log('- accessKey: アクセスキー');
console.log('- secretKey: シークレットキー');
console.log('- region: リージョン（オプション）');

console.log('\n=== MinIO調査完了 ===');
