import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]) as any[];
    const user = (rows as any[])[0];
    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return; }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.client_id || undefined,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'hypernova_secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
    });

    res.json({ token, user: payload });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getMe(req: any, res: Response): Promise<void> {
  res.json({ user: req.user });
}
