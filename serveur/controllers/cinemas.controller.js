import { db } from "../db/pool.js";

export async function listCinemas(req, res) {
  const [rows] = await db.query(
    "SELECT id, name, city, address FROM cinemas ORDER BY city, name"
  );
  res.json(rows);
}

export async function createCinema(req, res) {
  const { name, city, address } = req.body || {};
  if (!name || !city || !address) return res.status(400).json({ error: "name/city/address required" });

  const [r] = await db.query(
    "INSERT INTO cinemas (name, city, address) VALUES (?, ?, ?)",
    [name, city, address]
  );

  res.status(201).json({ id: r.insertId, name, city, address });
}
