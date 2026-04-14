const express = require("express");
const cors = require("cors");
const { pool } = require("./db");
const { isValidEmail } = require("./validation");

const app = express();

app.use(cors());
app.use(express.json());

async function waitForDb() {
  const maxAttempts = 30;
  const delayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (_e) {
      if (attempt === maxAttempts) throw _e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

function mapPgErrorToHttp(err) {
  // Unique violation (email)
  if (err && err.code === "23505") {
    return {
      status: 409,
      body: { error: "EMAIL_ALREADY_EXISTS" },
    };
  }
  return null;
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ ok: true });
  } catch (_e) {
    res.status(500).json({ ok: false });
  }
});

app.get("/api/people", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email FROM people ORDER BY id DESC"
    );
    res.status(200).json(rows);
  } catch (_e) {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.get("/api/people/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "INVALID_ID" });

  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email FROM people WHERE id = $1",
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(200).json(rows[0]);
  } catch (_e) {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/people", async (req, res) => {
  const fullName = typeof req.body?.full_name === "string" ? req.body.full_name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (!fullName) return res.status(400).json({ error: "FULL_NAME_REQUIRED" });
  if (!email) return res.status(400).json({ error: "EMAIL_REQUIRED" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "INVALID_EMAIL" });

  try {
    const { rows } = await pool.query(
      "INSERT INTO people (full_name, email) VALUES ($1, $2) RETURNING id, full_name, email",
      [fullName, email]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    const mapped = mapPgErrorToHttp(e);
    if (mapped) return res.status(mapped.status).json(mapped.body);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.put("/api/people/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "INVALID_ID" });

  const fullName = typeof req.body?.full_name === "string" ? req.body.full_name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

  if (!fullName) return res.status(400).json({ error: "FULL_NAME_REQUIRED" });
  if (!email) return res.status(400).json({ error: "EMAIL_REQUIRED" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "INVALID_EMAIL" });

  try {
    const { rows } = await pool.query(
      "UPDATE people SET full_name = $1, email = $2 WHERE id = $3 RETURNING id, full_name, email",
      [fullName, email, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(200).json(rows[0]);
  } catch (e) {
    const mapped = mapPgErrorToHttp(e);
    if (mapped) return res.status(mapped.status).json(mapped.body);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.delete("/api/people/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "INVALID_ID" });

  try {
    const { rowCount } = await pool.query("DELETE FROM people WHERE id = $1", [id]);
    if (!rowCount) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(200).json({ ok: true });
  } catch (_e) {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

const port = Number(process.env.PORT || 3001);
waitForDb()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend listening on ${port}`);
    });
  })
  .catch(() => {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to database.");
    process.exit(1);
  });

