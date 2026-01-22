import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/pool.js";

function jwtSecret() {
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

function signToken(user) {
  const payload = { sub: user.id, role: user.role, email: user.email };
  return jwt.sign(payload, jwtSecret(), { expiresIn: "7d" });
}

export async function register(req, res, next) {
  try {
    const { email, password, firstname, lastname } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, 'USER')",
      [email, password_hash, firstname || null, lastname || null]
    );

    const user = { id: result.insertId, email, role: "USER" };
    // on renvoie un token directement (pratique)
    const token = signToken(user);

    return res.status(201).json({ token, user: { id: user.id, email, role: user.role, firstname, lastname } });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [rows] = await db.query(
      "SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, firstname: user.first_name, lastname: user.last_name },
    });
  } catch (err) {
    next(err);
  }
}
