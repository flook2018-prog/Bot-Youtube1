const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL");

    // ===== USERS TABLE =====
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id BIGINT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ===== CHANNELS TABLE =====
    await connection.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        channel_id VARCHAR(255) NOT NULL,
        channel_name VARCHAR(255),
        code VARCHAR(10) UNIQUE,
        last_status VARCHAR(50) DEFAULT 'Unknown',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ Tables are ready");
    connection.release();
  } catch (err) {
    console.error("❌ Database init error:", err.message);
  }
}

initDatabase();

module.exports = pool;
