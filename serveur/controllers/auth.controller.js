import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/pool.js";

export async function register(req, res) {
  const { email, password, firstName, lastName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email/password required" });

  const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
  if (exists.length) return res.status(409).json({ error: "Email already used" });

  const passwordHash = await bcrypt.hash(password, 10);

  const [r] = await db.query(
    "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, 'USER')",
    [email, passwordHash, firstName || null, lastName || null]
  );

  res.status(201).json({ id: r.insertId, email });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email/password required" });

  const [[user]] = await db.query(
    "SELECT id, email, password_hash, role FROM users WHERE email = ?",
    [email]
  );

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}
