import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ── Upload config — saves to /uploads folder ──────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    // Allow PDFs, images, Word, Excel
    const allowed = /pdf|jpeg|jpg|png|gif|doc|docx|xls|xlsx|txt/i;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    cb(null, allowed.test(ext));
  },
});

function mapDoc(row: any) {
  return {
    id:          row.id,
    caseId:      row.case_id      || null,
    caseFileNo:  row.file_no      || null,
    name:        row.name         || '',
    category:    row.category     || '',
    uploadedBy:  row.uploaded_by  || '',
    date:        row.created_at   ? String(row.created_at).split('T')[0] : '',
    fileUrl:     row.file_url     || null,
    fileType:    row.file_type    || null,
    fileSize:    row.file_size    || null,
  };
}

// ── GET /api/documents — global document list ─────────────────────────────────
export async function getAllDocuments(req: Request, res: Response): Promise<void> {
  const { search, category } = req.query as any;
  try {
    let sql = `
      SELECT d.*, c.file_no
      FROM documents d
      LEFT JOIN cases c ON c.id = d.case_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (search) {
      sql += ' AND (d.name LIKE ? OR c.file_no LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND d.category = ?';
      params.push(category);
    }
    sql += ' ORDER BY d.created_at DESC';

    const [rows] = await pool.query(sql, params) as any[];
    res.json(Array.isArray(rows) ? rows.map(mapDoc) : []);
  } catch (err) {
    console.error('[getAllDocuments]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── GET /api/cases/:caseId/documents ─────────────────────────────────────────
export async function getDocumentsByCase(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT d.*, c.file_no FROM documents d
       LEFT JOIN cases c ON c.id = d.case_id
       WHERE d.case_id = ? ORDER BY d.created_at DESC`,
      [caseId]
    ) as any[];
    res.json(Array.isArray(rows) ? rows.map(mapDoc) : []);
  } catch (err) {
    console.error('[getDocumentsByCase]', err);
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── POST /api/cases/:caseId/documents — file upload ──────────────────────────
export async function uploadDocument(req: Request, res: Response): Promise<void> {
  const { caseId } = req.params;
  const file = (req as any).file;
  const user = (req as any).user;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const category = req.body.category || 'Other Documents';
  const uploadedBy = user?.name || user?.email || 'Staff';
  const fileUrl = `/uploads/${file.filename}`;
  const fileType = file.mimetype;
  const fileSize = file.size;
  const docId = generateId();

  try {
    await pool.query(
      `INSERT INTO documents
        (id, case_id, name, category, uploaded_by, file_url, file_type, file_size)
       VALUES (?,?,?,?,?,?,?,?)`,
      [docId, caseId, file.originalname, category, uploadedBy, fileUrl, fileType, fileSize]
    );

    const [rows] = await pool.query(
      `SELECT d.*, c.file_no FROM documents d
       LEFT JOIN cases c ON c.id = d.case_id WHERE d.id = ?`,
      [docId]
    ) as any[];
    const saved = Array.isArray(rows) ? rows[0] : null;
    res.json(saved ? mapDoc(saved) : { id: docId });
  } catch (err) {
    console.error('[uploadDocument]', err);
    // Cleanup uploaded file on DB error
    fs.unlink(file.path, () => {});
    res.status(500).json({ error: 'Server error', detail: (err as any).message });
  }
}

// ── PUT /api/documents/:id — rename ──────────────────────────────────────────
export async function renameDocument(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: 'Name required' }); return; }
  try {
    await pool.query('UPDATE documents SET name = ? WHERE id = ?', [name.trim(), id]);
    res.json({ id, name: name.trim() });
  } catch (err) {
    console.error('[renameDocument]', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ── DELETE /api/documents/:id ─────────────────────────────────────────────────
export async function deleteDocument(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    // Get file path first to delete from disk
    const [rows] = await pool.query('SELECT file_url FROM documents WHERE id = ?', [id]) as any[];
    const row = Array.isArray(rows) ? rows[0] : null;

    await pool.query('DELETE FROM documents WHERE id = ?', [id]);

    // Delete physical file
    if (row?.file_url) {
      const filePath = path.join(__dirname, '../..', row.file_url);
      fs.unlink(filePath, () => {}); // silent fail if file missing
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[deleteDocument]', err);
    res.status(500).json({ error: 'Server error' });
  }
}
