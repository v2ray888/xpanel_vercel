// 简单的数据库检查脚本
import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

// 数据库文件路径
const dbPath = path.join(process.cwd(), 'db.sqlite');

// 检查数据库文件是否存在
if (!fs.existsSync(dbPath)) {
  console.log('数据库文件不存在:', dbPath);
  process.exit(1);
}

// 连接到数据库
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('成功连接到数据库');
});

// 查询用户订阅表
db.serialize(() => {
  console.log('\n=== 用户订阅表 ===');
  db.all('SELECT * FROM user_subscriptions', (err, rows) => {
    if (err) {
      console.error('查询user_subscriptions表失败:', err.message);
    } else {
      console.log('user_subscriptions表记录数:', rows.length);
      rows.forEach(row => {
        console.log('  ', row);
      });
    }
  });
  
  console.log('\n=== 订阅令牌表 ===');
  db.all('SELECT * FROM subscription_tokens', (err, rows) => {
    if (err) {
      console.error('查询subscription_tokens表失败:', err.message);
    } else {
      console.log('subscription_tokens表记录数:', rows.length);
      rows.forEach(row => {
        console.log('  ', row);
      });
    }
  });
  
  console.log('\n=== 服务器表 ===');
  db.all('SELECT * FROM servers', (err, rows) => {
    if (err) {
      console.error('查询servers表失败:', err.message);
    } else {
      console.log('servers表记录数:', rows.length);
      rows.forEach(row => {
        console.log('  ', row);
      });
    }
  });
});

// 关闭数据库连接
db.close((err) => {
  if (err) {
    console.error('关闭数据库连接失败:', err.message);
  } else {
    console.log('\n数据库连接已关闭');
  }
});