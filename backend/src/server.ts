import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { testConnection } from './config/database';
import routes from './routes/index';
import { errorHandler, notFound } from './middlewares/error.middleware';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api', routes);

// ── 404 + Error handlers ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Padak (PVT) LTD CRM API running on http://localhost:${PORT}`);
    console.log(`   DB: ${process.env.DB_NAME || 'padak_insurance_crm'}`);
    console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();

export default app;
