import Database from 'better-sqlite3';
import fs from 'fs';

// Read the schema file
const schema = fs.readFileSync('./database/schema.sql', 'utf8');

// Create or connect to the database
const db = new Database('local.db');

// Split the schema into individual statements
const statements = schema.split(';').filter(stmt => stmt.trim() !== '');

// Execute each statement
for (const statement of statements) {
  if (statement.trim() !== '') {
    try {
      db.exec(statement);
      console.log('Executed:', statement.substring(0, 50) + '...');
    } catch (error) {
      console.error('Error executing statement:', error.message);
      console.error('Statement:', statement);
    }
  }
}

console.log('Database initialized successfully!');

// Close the database
db.close();