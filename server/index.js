const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/transactions", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM transactions ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/transactions", async (req, res) => {
  try {
    const { description, amount, type, category } = req.body;

    if (!description || !amount || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO transactions 
       (description, amount, type, category) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        description,
        amount,
        type,
        category && category.trim() !== "" ? category : "other",
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add transaction" });
  }
});

app.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM transactions WHERE id = $1", [id]);

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});
app.post("/budgets", async (req, res) => {
  try {
    const { name, income, income_type, state_tax, retirement, health } = req.body;

    const result = await pool.query(
      `INSERT INTO budgets 
      (name, income, income_type, state_tax, retirement, health) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [name, income, income_type, state_tax, retirement, health]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save budget" });
  }
});

app.get("/budgets", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM budgets ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});