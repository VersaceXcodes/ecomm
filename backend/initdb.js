import dotenv from "dotenv";
import fs from "fs";
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST || "ep-ancient-dream-abbsot9k-pooler.eu-west-2.aws.neon.tech",
        database: PGDATABASE || "neondb",
        user: PGUSER || "neondb_owner",
        password: PGPASSWORD || "npg_jAS3aITLC5DX",
        port: Number(PGPORT),
        ssl: { require: true },
      }
);


async function initDb() {
  const client = await pool.connect();
  try {
    // Read and split SQL commands
    const sqlContent = fs.readFileSync(`./db.sql`, "utf-8").toString();
    
    // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS
    const modifiedSql = sqlContent.replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ');
    
    // Split commands
    const dbInitCommands = modifiedSql.split(/(?=CREATE TABLE IF NOT EXISTS |INSERT INTO)/);

    // Execute each command individually (no transaction to avoid rollback issues)
    for (let cmd of dbInitCommands) {
      if (cmd.trim()) {
        // For INSERT statements, add ON CONFLICT DO NOTHING if not already present
        if (cmd.trim().startsWith('INSERT INTO') && !cmd.includes('ON CONFLICT')) {
          // Find the last semicolon and replace it
          const lastSemicolonIndex = cmd.lastIndexOf(';');
          if (lastSemicolonIndex !== -1) {
            cmd = cmd.substring(0, lastSemicolonIndex) + ' ON CONFLICT DO NOTHING' + cmd.substring(lastSemicolonIndex);
          }
        }
        
        console.dir({ "backend:db:init:command": cmd.substring(0, 100) + '...' });
        try {
          await client.query(cmd);
        } catch (cmdError) {
          // Log the error but continue with other commands
          console.warn('Command failed, continuing:', cmdError.message);
        }
      }
    }

    console.log('Database initialization completed successfully');
  } catch (e) {
    console.error('Database initialization failed:', e);
    throw e;
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Execute initialization
initDb().catch(console.error);
