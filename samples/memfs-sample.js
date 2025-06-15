// memfsライブラリのAPI調査用サンプル
import { fs } from 'memfs';

console.log('=== memfs API調査 ===');

// 1. memfsの基本的なfs互換API確認
console.log('\n1. 利用可能なメソッド:');
const fsMethods = Object.getOwnPropertyNames(fs).filter(name => typeof fs[name] === 'function');
console.log(fsMethods.slice(0, 20)); // 最初の20個のメソッドを表示

// 2. fs.writeFileの動作確認
try {
    fs.writeFileSync('/test.txt', 'Hello memfs!');
    console.log('\n2. writeFileSync成功');
    
    // 3. fs.readFileの動作確認
    const content = fs.readFileSync('/test.txt', 'utf8');
    console.log('3. readFileSync結果:', content);
    
    // 4. fs.existsSyncの動作確認
    const exists = fs.existsSync('/test.txt');
    console.log('4. existsSync結果:', exists);
    
    // 5. fs.statSyncの動作確認
    const stats = fs.statSync('/test.txt');
    console.log('5. statSync結果:', {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
    });
    
    // 6. Promise版APIの確認
    console.log('\n6. Promise版API確認:');
    console.log('fs.promises利用可能:', typeof fs.promises === 'object');
    if (fs.promises) {
        const promiseMethods = Object.getOwnPropertyNames(fs.promises).filter(name => typeof fs.promises[name] === 'function');
        console.log('Promise版メソッド例:', promiseMethods.slice(0, 10));
    }
    
} catch (error) {
    console.error('エラーが発生したのだ:', error.message);
}

console.log('\n=== memfs調査完了 ===');
