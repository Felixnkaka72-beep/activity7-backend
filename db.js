// Creates one shared connection pool to the database.
require("dotenv").config();
const { Pool } = require("pg");

const url = process.env.DATABASE_URL || "";
const isLocal = /localhost|127\.0\.0\.1/.test(url);

const pool = new Pool({
  connectionString: url,
  // Hosted databases need an encrypted (SSL) connection; a database on your own computer does not.
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Without this, a dropped idle connection (for example during hosting maintenance) could crash the server.
pool.on("error", (error) => console.error("Idle database connection error:", error.message));

module.exports = pool;
