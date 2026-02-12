const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.DB_PORT || 3306
});

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to MySQL");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id VARCHAR(255) NOT NULL,
        channel_name VARCHAR(255),
        last_video_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Table 'channels' is ready");
    connection.release();
  } catch (err) {
    console.error("❌ Database init error:", err.message);
  }
}

initDatabase();

module.exports = pool;
