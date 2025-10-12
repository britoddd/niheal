const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

// Prefer DATABASE_URL if provided; fall back to discrete DB_* settings
const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}` +
  `@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

// Enable SSL only when explicitly requested or in production
const enableSsl =
  String(process.env.DB_SSL || '').toLowerCase() === 'true' ||
  process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  ssl: enableSsl ? { rejectUnauthorized: false } : false,
});

module.exports = { pool };