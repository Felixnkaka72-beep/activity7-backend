// Creates the tables and adds the starting records once.
// The server calls this when it starts, and you can also run it by hand: npm run setup
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function initDatabase() {
  await pool.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  await pool.query(fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8"));
}

module.exports = initDatabase;

if (require.main === module) {
  initDatabase()
    .then(() => pool.query("SELECT COUNT(*)::int AS total FROM records"))
    .then((result) => console.log("Database ready. Records in table: " + result.rows[0].total))
    .catch((error) => { console.error("Setup failed:", error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}
