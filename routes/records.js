const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const MAX_ID = 2147483647; // largest whole number the database id column can hold

// Rules for the three text fields (status is checked separately).
const RULES = [
  { field: "title", label: "Title", min: 3, max: 80 },
  { field: "category", label: "Category", min: 2, max: 40 },
  { field: "description", label: "Description", min: 5, max: 300 }
];

// Checks the request body. Returns { message } when invalid, or { values } ready for SQL.
function validateRecord(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const problems = [];
  const clean = {};

  for (const rule of RULES) {
    const value = input[rule.field];
    if (typeof value !== "string") {          // must be a string before we trim it
      problems.push(rule.label + " is required and must be text.");
      continue;
    }
    const text = value.trim();
    clean[rule.field] = text;
    if (text.length < rule.min || text.length > rule.max) {
      problems.push(rule.label + " must have " + rule.min + " to " + rule.max + " characters.");
    }
  }

  if (typeof input.status !== "string") {
    problems.push("Status is required and must be text.");
  } else {
    clean.status = input.status.trim();
    if (!STATUSES.includes(clean.status)) {
      problems.push("Status must be Pending, In progress or Completed.");
    }
  }

  // Any id sent by the client is ignored: only the four editable fields are used.
  if (problems.length > 0) return { message: problems.join(" ") };
  return { values: [clean.title, clean.category, clean.description, clean.status] };
}

// Reads :id from the address. Sends the error reply itself and returns null when it cannot continue.
function readId(req, res) {
  const raw = req.params.id;
  if (!/^[1-9][0-9]*$/.test(raw)) {
    res.status(400).json({ message: "Id must be a positive whole number." });
    return null;
  }
  const id = Number(raw);
  if (id > MAX_ID) { // a valid number, but such a record cannot exist
    res.status(404).json({ message: "Record not found." });
    return null;
  }
  return id;
}

// GET /api/records - read all records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, category, description, status " +
      "FROM records ORDER BY id"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id - read one record
router.get("/:id", async (req, res, next) => {
  try {
    const id = readId(req, res);
    if (id === null) return;
    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/records - create a record
router.post("/", async (req, res, next) => {
  try {
    const check = validateRecord(req.body);
    if (check.message) return res.status(400).json({ message: check.message });
    const result = await pool.query(
      "INSERT INTO records (title, category, description, status) " +
      "VALUES ($1, $2, $3, $4) RETURNING *",
      check.values
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id - replace the four editable fields
router.put("/:id", async (req, res, next) => {
  try {
    const id = readId(req, res);
    if (id === null) return;
    const check = validateRecord(req.body);
    if (check.message) return res.status(400).json({ message: check.message });
    const result = await pool.query(
      "UPDATE records SET title = $1, category = $2, description = $3, status = $4 " +
      "WHERE id = $5 RETURNING *",
      [...check.values, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id - delete a record
router.delete("/:id", async (req, res, next) => {
  try {
    const id = readId(req, res);
    if (id === null) return;
    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
