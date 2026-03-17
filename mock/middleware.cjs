/**
 * Middleware de json-server para simular endpoints de autenticación.
 * Intercepta rutas de auth antes de que json-server las procese.
 *
 * POST /api/auth/login   → valida email+password contra /users, devuelve token mock
 * POST /api/auth/refresh → renueva el token
 * POST /api/auth/logout  → 204 No Content
 *
 * NOTA: json-server aplica body-parser antes de los middlewares personalizados,
 * por lo que el body ya está parseado en req.body — no leer el stream manualmente.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function makeMockToken(user) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: user.role })).toString('base64');
  return `mock.${payload}.signature`;
}

module.exports = (req, res, next) => {
  // ── POST /api/auth/login ─────────────────────────────────────────────────────
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

    const { password: _pwd, ...safeUser } = user;
    const accessToken = makeMockToken(user);
    const refreshToken = `refresh.${user.id}.${Date.now()}`;
    const expiresIn = 8 * 60 * 60 * 1000; // 8 horas en ms

    res.status(200).json({ user: safeUser, accessToken, refreshToken, expiresIn });
    return;
  }

  // ── POST /api/auth/logout ────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/auth/logout') {
    res.status(204).send();
    return;
  }

  // ── POST /api/auth/refresh ───────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/auth/refresh') {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token requerido.' });
      return;
    }

    // Mock: extraer userId del refreshToken ("refresh.<id>.<ts>")
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
