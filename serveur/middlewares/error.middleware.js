export function errorMiddleware(err, req, res, next) {
  console.error("❌ ERROR:", err);
  res.status(500).json({ error: "Erreur serveur" });
}
