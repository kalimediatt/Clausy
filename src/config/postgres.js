const { Pool } = require('pg');

const pool = new Pool({
  host: 'postgres',
  port: 5432,
  user: 'postgres',
  password: 'c4ad0bee1b52cb3a65525ee2d444b0ca',
  database: 'n8n_queue'
});

module.exports = pool;