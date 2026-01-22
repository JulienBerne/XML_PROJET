import { db } from "../db/pool.js";

/**
 * Rôles (selon votre convention) :
 * - USER : utilisateur normal
 * - ADMIN : propriétaire de cinéma (OWNER)
 * - SUPER_ADMIN : admin qui valide les demandes
 */

// USER crée une demande
export async function createAdminRequest(req, res, next) {
  try {
    const userId = req.user.sub;
    const { message } = req.body || {};

    // Empêche plusieurs demandes en attente
    const [existing] = await db.query(
      "SELECT id, status FROM admin_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    if (existing.length && existing[0].status === "PENDING") {
      return res.status(409).json({ message: "Une demande est déjà en attente" });
    }

    const [result] = await db.query(
      "INSERT INTO admin_requests (user_id, status, message) VALUES (?, 'PENDING', ?)",
      [userId, message || null]
    );

    res.status(201).json({ id: result.insertId, status: "PENDING" });
  } catch (err) {
    next(err);
  }
}

// USER voit ses demandes
export async function listMyRequests(req, res, next) {
  try {
    const userId = req.user.sub;
    const [rows] = await db.query(
      "SELECT id, status, message, created_at AS createdAt, decided_at AS decidedAt FROM admin_requests WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// SUPER_ADMIN liste toutes les demandes (filtrable)
export async function listAllRequests(req, res, next) {
  try {
    const status = req.query.status;
    const where = status ? "WHERE r.status = ?" : "";
    const params = status ? [status] : [];

    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.status,
        r.message,
        r.created_at AS createdAt,
        r.decided_at AS decidedAt,
        u.id AS userId,
        u.email,
        u.first_name AS firstname,
        u.last_name AS lastname
      FROM admin_requests r
      JOIN users u ON u.id = r.user_id
      ${where}
      ORDER BY r.created_at DESC
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// SUPER_ADMIN approuve : user.role = 'ADMIN'
export async function approveRequest(req, res, next) {
  try {
    const requestId = Number(req.params.id);
    const adminId = req.user.sub;

    const [rows] = await db.query(
      "SELECT id, user_id AS userId, status FROM admin_requests WHERE id = ? LIMIT 1",
      [requestId]
    );
    if (!rows.length) return res.status(404).json({ message: "Demande introuvable" });
    if (rows[0].status !== "PENDING") return res.status(409).json({ message: "Demande déjà traitée" });

    await db.query("UPDATE users SET role = 'ADMIN' WHERE id = ?", [rows[0].userId]);

    await db.query(
      "UPDATE admin_requests SET status='APPROVED', decided_at=NOW(), decided_by=? WHERE id=?",
      [adminId, requestId]
    );

    res.json({ ok: true, status: "APPROVED" });
  } catch (err) {
    next(err);
  }
}

// SUPER_ADMIN refuse
export async function rejectRequest(req, res, next) {
  try {
    const requestId = Number(req.params.id);
    const adminId = req.user.sub;

    const [rows] = await db.query(
      "SELECT id, status FROM admin_requests WHERE id = ? LIMIT 1",
      [requestId]
    );
    if (!rows.length) return res.status(404).json({ message: "Demande introuvable" });
    if (rows[0].status !== "PENDING") return res.status(409).json({ message: "Demande déjà traitée" });

    await db.query(
      "UPDATE admin_requests SET status='REJECTED', decided_at=NOW(), decided_by=? WHERE id=?",
      [adminId, requestId]
    );

    res.json({ ok: true, status: "REJECTED" });
  } catch (err) {
    next(err);
  }
}
