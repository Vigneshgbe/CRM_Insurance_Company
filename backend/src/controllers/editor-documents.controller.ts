import { Request, Response } from "express";
import pool from "../config/db";
import { v4 as uuidv4 } from "uuid";

// ── GET /api/editor-documents?caseId=xxx
// List all editor docs, optionally filtered by case
export async function listEditorDocuments(req: Request, res: Response) {
  try {
    const { caseId } = req.query;
    let sql = `
      SELECT
        ed.id, ed.title, ed.case_id,
        ed.created_by, ed.created_at, ed.updated_at,
        u.name AS created_by_name,
        CONCAT(c.first_name, ' ', c.last_name) AS client_name,
        ca.file_no
      FROM editor_documents ed
      LEFT JOIN users u   ON ed.created_by = u.id
      LEFT JOIN cases ca  ON ed.case_id    = ca.id
      LEFT JOIN clients c ON ca.client_id  = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (caseId) { sql += " AND ed.case_id = ?"; params.push(caseId); }
    sql += " ORDER BY ed.updated_at DESC LIMIT 200";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET /api/editor-documents/:id
export async function getEditorDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query(
      `SELECT ed.*, u.name AS created_by_name,
              CONCAT(c.first_name,' ',c.last_name) AS client_name,
              ca.file_no
       FROM editor_documents ed
       LEFT JOIN users u   ON ed.created_by = u.id
       LEFT JOIN cases ca  ON ed.case_id    = ca.id
       LEFT JOIN clients c ON ca.client_id  = c.id
       WHERE ed.id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Document not found" });
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ── POST /api/editor-documents
// Create a new editor document
export async function createEditorDocument(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title = "Untitled Document", content = "", case_id = null } = req.body;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO editor_documents (id, title, content, case_id, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [id, title, content, case_id || null, userId]
    );

    const [rows]: any = await pool.query(
      "SELECT * FROM editor_documents WHERE id = ?",
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ── PUT /api/editor-documents/:id
// Update title + content (auto-save calls this)
export async function updateEditorDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title, content, case_id } = req.body;

    // Verify ownership (only creator can edit)
    const [existing]: any = await pool.query(
      "SELECT id, created_by FROM editor_documents WHERE id = ? LIMIT 1",
      [id]
    );
    if (!existing.length) return res.status(404).json({ error: "Document not found" });
    if (existing[0].created_by !== userId) {
      return res.status(403).json({ error: "Not authorised to edit this document" });
    }

    const setParts: string[] = [];
    const params: any[] = [];

    if (title !== undefined)   { setParts.push("title = ?");   params.push(title); }
    if (content !== undefined) { setParts.push("content = ?"); params.push(content); }
    if (case_id !== undefined) { setParts.push("case_id = ?"); params.push(case_id || null); }

    if (!setParts.length) return res.json({ message: "Nothing to update" });

    params.push(id);
    await pool.query(`UPDATE editor_documents SET ${setParts.join(", ")} WHERE id = ?`, params);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ── DELETE /api/editor-documents/:id
export async function deleteEditorDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [existing]: any = await pool.query(
      "SELECT created_by FROM editor_documents WHERE id = ? LIMIT 1",
      [id]
    );
    if (!existing.length) return res.status(404).json({ error: "Document not found" });
    if (existing[0].created_by !== userId) {
      return res.status(403).json({ error: "Not authorised to delete this document" });
    }

    await pool.query("DELETE FROM editor_documents WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
