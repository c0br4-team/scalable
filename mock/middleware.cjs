/**
 * Middleware de json-server para simular endpoints de autenticación.
 *
 * POST /auth/login   → valida email+password, devuelve token + navItems + preferences
 * POST /auth/refresh → renueva el token
 * POST /auth/logout  → 204 No Content
 *
 * NOTA: El rewriter de routes.json transforma /api/* → /* antes de llegar aquí,
 * por eso las rutas se verifican sin el prefijo /api.
 * NOTA: body-parser ya parsea el body antes del middleware → usar req.body directamente.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function makeMockToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, email: user.email, role: user.role })
  ).toString('base64');
  return `mock.${payload}.signature`;
}

module.exports = (req, res, next) => {
  // ── POST /auth/login ─────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/auth/login') {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos.' });
      return;
    }

    const db = readDb();
    const user = db.users.find(u => u.email === email && u.password === password);

    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas.' });
      return;
    }

    const navMenu = db.navMenus.find(m => m.role === user.role);

    const { password: _pwd, ...safeUser } = user;
    const accessToken = makeMockToken(user);
    const refreshToken = `refresh.${user.id}.${Date.now()}`;
    const expiresIn = 8 * 60 * 60 * 1000; // 8 horas en ms

    res.status(200).json({
      user: safeUser,
      accessToken,
      refreshToken,
      expiresIn,
      navItems: navMenu?.items ?? [],
    });
    return;
  }

  // ── POST /auth/logout ────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/auth/logout') {
    res.status(204).send();
    return;
  }

  // ── POST /auth/refresh ───────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/auth/refresh') {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token requerido.' });
      return;
    }

    const userId = refreshToken.split('.')[1];
    const db = readDb();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      res.status(401).json({ message: 'Refresh token inválido.' });
      return;
    }

    const accessToken = makeMockToken(user);
    const expiresIn = 8 * 60 * 60 * 1000;
    res.status(200).json({ accessToken, expiresIn });
    return;
  }

  next();
};
