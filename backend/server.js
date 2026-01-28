// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const postgres = require("postgres");

const app = express();
app.use(express.json());
app.use(cors()); // Allow everyone (Simple for this stage)

// Connect to Neon Database
const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

// 1. GET TICKETS (With Filter)
app.get("/tickets", async (req, res) => {
  const status = req.query.status || "OPEN";
  try {
    const tickets = await sql`
            SELECT * FROM tickets 
            WHERE status = ${status} 
            ORDER BY id DESC
        `;
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// 2. CREATE TICKET
app.post("/tickets", async (req, res) => {
  const { teacherName, appName, issue, screenshotUrl } = req.body;
  try {
    const result = await sql`
            INSERT INTO tickets (teacher_name, app_name, issue, screenshot_url)
            VALUES (${teacherName}, ${appName}, ${issue}, ${screenshotUrl})
            RETURNING *
        `;
    res.status(201).json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save ticket" });
  }
});

// 3. RESOLVE TICKET
app.patch("/tickets/:id/resolve", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await sql`
            UPDATE tickets 
            SET status = 'RESOLVED' 
            WHERE id = ${id}
            RETURNING *
        `;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
