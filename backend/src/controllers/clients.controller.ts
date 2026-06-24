import { Request, Response } from 'express';
import pool from '../config/database';
import { generateId, formatDate } from '../utils/helpers';

function mapClient(row: any) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    initial: row.initial || '',
    address: row.address || '',
    city: row.city || '',
    province: row.province || '',
    postCode: row.post_code || '',
    homePhone: row.home_phone || '',
    cellPhone: row.cell_phone || '',
    workPhone: row.work_phone || '',
    email: row.email || '',
    dateOfBirth: formatDate(row.date_of_birth) || '',
    maritalStatus: row.marital_status || '',
    dependants: row.dependants || 0,
    phoneNumber: row.home_phone || '',
    mobileNumber: row.cell_phone || '',
  };
}

export async function getClients(req: Request, res: Response): Promise<void> {
  try {
    const search = req.query.search as string;
    let sql = 'SELECT * FROM clients';
    const params: any[] = [];
    if (search) {
      sql += ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    sql += ' ORDER BY last_name, first_name';
    const [rows] = await pool.query(sql, params) as any[];
    res.json((rows as any[]).map(mapClient));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function getClientById(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]) as any[];
    if (!(rows as any[])[0]) { res.status(404).json({ error: 'Client not found' }); return; }
    res.json(mapClient((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function createClient(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, initial, address, city, province, postCode,
    homePhone, cellPhone, workPhone, email, dateOfBirth, maritalStatus, dependants } = req.body;
  if (!firstName || !lastName) {
    res.status(400).json({ error: 'firstName and lastName are required' }); return;
  }
  try {
    const id = generateId();
    await pool.query(
      `INSERT INTO clients (id, first_name, last_name, initial, address, city, province, post_code,
        home_phone, cell_phone, work_phone, email, date_of_birth, marital_status, dependants)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, firstName, lastName, initial||'', address||'', city||'', province||'', postCode||'',
       homePhone||'', cellPhone||'', workPhone||'', email||'', dateOfBirth||null, maritalStatus||'', dependants||0]
    );
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]) as any[];
    res.status(201).json(mapClient((rows as any[])[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  const { firstName, lastName, initial, address, city, province, postCode,
    homePhone, cellPhone, workPhone, email, dateOfBirth, maritalStatus, dependants } = req.body;
  try {
    await pool.query(
      `UPDATE clients SET first_name=?, last_name=?, initial=?, address=?, city=?, province=?,
        post_code=?, home_phone=?, cell_phone=?, work_phone=?, email=?, date_of_birth=?,
        marital_status=?, dependants=? WHERE id=?`,
      [firstName, lastName, initial||'', address||'', city||'', province||'', postCode||'',
       homePhone||'', cellPhone||'', workPhone||'', email||'', dateOfBirth||null,
       maritalStatus||'', dependants||0, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]) as any[];
    if (!(rows as any[])[0]) { res.status(404).json({ error: 'Client not found' }); return; }
    res.json(mapClient((rows as any[])[0]));
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
}
