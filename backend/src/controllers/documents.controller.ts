import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import pool from '../config/database';
import { generateId, formatDate } from '../utils/helpers';

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, generateId() + ext);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
});

function mapDoc(row: any, caseFileNo?: string) {
  return {
    id: row.id,
    caseId: row.case_id || '',
    name: row.name || '',
    type: row.type || '',
    category: row.category || '',
    uploadedBy: row.uploaded_by || '',
    date: formatDate(row.date) || formatDate(row.created_at) || '',
    fileUrl: row.file_url || '',
    caseFileNo: caseFileNo || '',
  };
}

export async function getAllDocuments(req: Request, res: Response): Promise<void> {
  try {
    const { search, category } = req.query;
    let sql = `SELECT d.*, ca.file_no as case_file_no FROM documents d LEFT JOIN cases ca ON d.case_id = ca.id WHERE 1=1`;
    const params: any[] = [];
    if (search) {
      sql += ' AND (d.name LIKE ? OR ca.file_no LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (category) { sql += ' AND d.category = ?'; params.push(category); }
    sql += ' ORDER BY d.created_at DESC';
    const [rows] = await pool.query(sql, params) as any[];
    res.json((rows as any[]).map(r => mapDoc(r, r.case_file_no)));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function getDocumentsByCase(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM documents WHERE case_id = ? ORDER BY created_at DESC', [req.params.caseId]
    ) as any[];
    res.json((rows as any[]).map(r => mapDoc(r)));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    const caseId = req.params.caseId;
    const file = (req as any).file;
    if (!file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    const uploadedBy = (req as any).user?.name || 'System';
    const category = req.body.category || 'Other';
    const id = generateId();
    const fileUrl = `/uploads/${file.filename}`;
    const ext = path.extname(file.originalname).replace('.', '').toUpperCase();
    await pool.query(
      `INSERT INTO documents (id, case_id, name, type, category, uploaded_by, file_url, file_size, date)
       VALUES (?,?,?,?,?,?,?,?,CURDATE())`,
      [id, caseId, file.originalname, ext, category, uploadedBy, fileUrl, file.size]
    );
    const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [id]) as any[];
    res.status(201).json(mapDoc((rows as any[])[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function renameDocument(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'name required' }); return; }
    await pool.query('UPDATE documents SET name = ? WHERE id = ?', [name, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]) as any[];
    res.json(mapDoc((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  try {
    await pool.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}
