import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'fdb1029.awardspace.net',
  user: '4537032_bh',
  password: 'sea12345',
  database: '4537032_bh',
  waitForConnections: true,
  connectionLimit: 10,
});
