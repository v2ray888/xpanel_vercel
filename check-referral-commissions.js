import Database from 'better-sqlite3';

try {
  const db = new Database('local.db');
  
  console.log('=== 推荐佣金表结构 ===');
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='referral_commissions'").get();
  console.log(schema);
  
  console.log('\n=== 推荐佣金数据 ===');
  const commissions = db.prepare('SELECT * FROM referral_commissions').all();
  console.log(commissions);
  
  console.log('\n=== 推荐关系数据 ===');
  const referrals = db.prepare('SELECT * FROM referrals').all();
  console.log(referrals);
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}