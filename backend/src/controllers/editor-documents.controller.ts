import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// ── GET /api/editor-documents?caseId=xxx  ────────────────────────────────────
export async function listEditorDocuments(req: Request, res: Response) {
  try {
    const { caseId } = req.query;

    // Simple query — no JOINs that can fail on unknown column names.
    // Only join users (safe — we know the column is `name`).
    // cases/clients join is optional metadata; skip it to avoid 500s.
    let sql = `
      SELECT
        ed.id,
        ed.title,
        ed.case_id,
        ed.created_by,
        ed.created_at,
        ed.updated_at,
        u.name AS created_by_name
      FROM editor_documents ed
      LEFT JOIN users u ON u.id = ed.created_by
      WHERE 1=1
    `;
    const params: any[] = [];
    if (caseId) { sql += ' AND ed.case_id = ?'; params.push(caseId); }
    sql += ' ORDER BY ed.updated_at DESC LIMIT 200';

    const [rows] = await pool.query(sql, params) as any[];
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err: any) {
    console.error('[listEditorDocuments]', err);
    res.status(500).json({ error: err.message });
  }
}

// ── GET /api/editor-documents/:id  ───────────────────────────────────────────
export async function getEditorDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query(
      `SELECT ed.*,
              u.name AS created_by_name
       FROM editor_documents ed
       LEFT JOIN users u ON u.id = ed.created_by
       WHERE ed.id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Document not found' });
    res.json(rows[0]);
  } catch (err: any) {
    console.error('[getEditorDocument]', err);
    res.status(500).json({ error: err.message });
  }
}

// ── POST /api/editor-documents  ──────────────────────────────────────────────
export async function createEditorDocument(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { title = 'Untitled Document', content = '', case_id } = req.body;
    const id = generateId();

    await pool.query(
      `INSERT INTO editor_documents (id, title, content, case_id, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [id, title, content, case_id || null, userId]
    );

    const [rows]: any = await pool.query(
      'SELECT * FROM editor_documents WHERE id = ?',
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error('[createEditorDocument]', err);
    res.status(500).json({ error: err.message });
  }
}

// ── PUT /api/editor-documents/:id  ───────────────────────────────────────────
export async function updateEditorDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [existing]: any = await pool.query(
      'SELECT id, created_by FROM editor_documents WHERE id = ? LIMIT 1',
      [id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Document not found' });

    // Only block if created_by is set AND belongs to a different user.
    // If created_by is empty/null (old records), allow the edit.
    const owner = existing[0].created_by;
    if (owner && owner !== '' && owner !== userId) {
      return res.status(403).json({ error: 'Not authorised to edit this document' });
    }

    const { title, content, case_id } = req.body;
    const setParts: string[] = [];
    const params: any[] = [];

    if (title   !== undefined) { setParts.push('title = ?');   params.push(title); }
    if (content !== undefined) { setParts.push('content = ?'); params.push(content); }
    if (case_id !== undefined) { setParts.push('case_id = ?'); params.push(case_id || null); }

    if (!setParts.length) return res.json({ message: 'Nothing to update' });

    params.push(id);
    await pool.query(
      `UPDATE editor_documents SET ${setParts.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('[updateEditorDocument]', err);
    res.status(500).json({ error: err.message });
  }
}

// ── DELETE /api/editor-documents/:id  ────────────────────────────────────────
export async function deleteEditorDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [existing]: any = await pool.query(
      'SELECT created_by FROM editor_documents WHERE id = ? LIMIT 1',
      [id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Document not found' });

    const owner = existing[0].created_by;
    if (owner && owner !== '' && owner !== userId) {
      return res.status(403).json({ error: 'Not authorised to delete this document' });
    }

    await pool.query('DELETE FROM editor_documents WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[deleteEditorDocument]', err);
    res.status(500).json({ error: err.message });
  }
}