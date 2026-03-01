import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'schengen-tracker-secret-change-me';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'schengen.db');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Database setup
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Auth middleware
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    (req as any).userId = payload.userId;
    (req as any).username = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function createToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '90d' });
}

// Auth routes
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  const token = createToken(result.lastInsertRowid as number, username);

  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 90 * 24 * 60 * 60 * 1000 });
  res.json({ token, username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = createToken(user.id, user.username);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 90 * 24 * 60 * 60 * 1000 });
  res.json({ token, username: user.username });
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/me', authenticate, (req, res) => {
  res.json({ username: (req as any).username });
});

// Trip routes
app.get('/api/trips', authenticate, (req, res) => {
  const userId = (req as any).userId;
  const trips = db.prepare(
    'SELECT id, start_date as startDate, end_date as endDate, note FROM trips WHERE user_id = ? ORDER BY start_date DESC'
  ).all(userId);
  res.json(trips);
});

app.post('/api/trips', authenticate, (req, res) => {
  const userId = (req as any).userId;
  const { id, startDate, endDate, note } = req.body;
  if (!id || !startDate || !endDate) return res.status(400).json({ error: 'id, startDate, endDate required' });

  db.prepare(
    'INSERT INTO trips (id, user_id, start_date, end_date, note) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, startDate, endDate, note || null);

  res.json({ ok: true });
});

app.put('/api/trips/:id', authenticate, (req, res) => {
  const userId = (req as any).userId;
  const { startDate, endDate, note } = req.body;

  const result = db.prepare(
    `UPDATE trips SET start_date = ?, end_date = ?, note = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(startDate, endDate, note || null, req.params.id, userId);

  if (result.changes === 0) return res.status(404).json({ error: 'Trip not found' });
  res.json({ ok: true });
});

app.delete('/api/trips/:id', authenticate, (req, res) => {
  const userId = (req as any).userId;
  const result = db.prepare('DELETE FROM trips WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Trip not found' });
  res.json({ ok: true });
});

// Serve static web build
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Schengen Tracker server running on port ${PORT}`);
});
