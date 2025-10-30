import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema files
const mainSchema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
const edgetunnelSchema = fs.readFileSync(path.join(__dirname, 'database', 'edgetunnel-schema.sql'), 'utf8');

// Combine schemas
const fullSchema = mainSchema + '\n' + edgetunnelSchema;

// Create or connect to the database
const db = new Database(path.join(__dirname, 'database', 'xpanel.db'));

// Split the schema into individual statements
const statements = fullSchema.split(';').filter(stmt => stmt.trim() !== '');

console.log(`Found ${statements.length} statements to execute`);

// Execute each statement
for (const statement of statements) {
  if (statement.trim() !== '') {
    try {
      db.exec(statement);
      console.log('✅ Executed:', statement.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Error executing statement:', error.message);
      console.error('Statement:', statement);
    }
  }
}

console.log('✅ Database initialized successfully with EdgeTunnel tables!');

// Verify EdgeTunnel tables were created
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%edgetunnel%'").all();
  console.log('EdgeTunnel tables created:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
} catch (error) {
  console.error('Error verifying EdgeTunnel tables:', error.message);
}

// Close the database
db.close();