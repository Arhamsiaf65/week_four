import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const db_url = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({
    connectionString: db_url,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
})


