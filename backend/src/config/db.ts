import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const db_url = process.env.DATABASE_URL;

export const pool = new Pool ({
    connectionString: db_url,
    // user: 'admin',
    // host: 'localhost',
    // database: 'week2',
    // password: 'admin123',
    // port: 5432,
    // min: 2,
    // max: 20,
    // How long an unused connection stays open before closing.
    // idleTimeoutMillis: 30000,
    // How long to wait for a free connection.
    // connectionTimeoutMillis: 2000,
})


