import jwt from "jsonwebtoken";

function jwtSecret() {
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) return res.status(401).json({ message: "Token manquant" });

  try {
    const payload = jwt.verify(token, jwtSecret());
    req.user = payload; // { sub, role, email, iat, exp }
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: "Non authentifié" });
    if (!roles.includes(role)) {
      return res.status(403).json({ message: "Accès interdit" });
    }
    next();
  };
}
