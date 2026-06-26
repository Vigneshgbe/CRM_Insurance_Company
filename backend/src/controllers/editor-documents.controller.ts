import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId } from '../utils/helpers';

// ── GET /api/editor-documents?caseId=xxx  ────────────────────────────────────
// No JOINs at all — avoids collation conflicts between tables.
export async function listEditorDocuments(req: Request, res: Response) {
  try {
    const { caseId } = req.query;

    let sql = `
      SELECT
        id,
        title,
        case_id,
        created_by,
        created_at,
        updated_at
      FROM editor_documents
      WHERE 1=1
    `;
    const params: any[] = [];
    if (caseId) { sql += ' AND case_id = ?'; params.push(caseId); }
    sql += ' ORDER BY updated_at DESC LIMIT 200';

    const [rows] = await pool.query(sql, params) as any[];
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err: any) {
    console.error('[listEditorDocuments]', err);
    res.status(500).json({ error: err.message });
  }
}

// ── GET /api/editor-documents/:id  ───────────────────────────────────────────
// No JOIN — collation mismatch between editor_documents (unicode_ci) and
// users (general_ci) causes ER_CANT_AGGREGATE_2COLLATIONS on the JOIN.
export async function getEditorDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query(
      `SELECT * FROM editor_documents WHERE id = ? LIMIT 1`,
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

    // Only block if created_by is a non-empty value owned by a different user.
    // Empty/null created_by (old rows before fix) are allowed through.
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