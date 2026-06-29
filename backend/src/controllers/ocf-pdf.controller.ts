import { Request, Response } from 'express';
import pool from '../config/database';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { RowDataPacket } from 'mysql2';

const TEMPLATES_DIR = path.join(__dirname, '../../templates/ocf');
const FILL_SCRIPT   = path.join(__dirname, '../../scripts/fill_fillable_fields.py');
const TEMP_DIR      = path.join(__dirname, '../../tmp');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Each field entry: { field_id, page, value }
function f(field_id: string, page: number, value: any) {
  return { field_id, page, value: String(value ?? '') };
}

// ─── OCF-1: Application for Accident Benefits ────────────────────────────────
// Field IDs verified from actual PDF: form1[0].page1[0].header (lowercase)
function ocf1Fields(d: any) {
  return [
    f('form1[0].page1[0].header[0].claimnum[0]',                        1, d.claimNumber),
    f('form1[0].page1[0].header[0].claimnum[1]',                        1, d.policyNumber),
    f('form1[0].page1[0].header[0].claimnum[2]',                        1, d.dateOfAccident),
    f('form1[0].page1[0].Part1[0].fname[0]',                            1, d.firstName),
    f('form1[0].page1[0].Part1[0].lname[0]',                            1, d.lastName),
    f('form1[0].page1[0].Part1[0].dob[0]',                              1, d.dateOfBirth),
    f('form1[0].page1[0].Part1[0].DriveLic[0]',                         1, d.driverLicenseNo),
    f('form1[0].page1[0].Part1[0].address[0].streetName[0]',            1, d.address),
    f('form1[0].page1[0].Part1[0].address[0].city[0]',                  1, d.city),
    f('form1[0].page1[0].Part1[0].address[0].province[0]',              1, d.province),
    f('form1[0].page1[0].Part1[0].address[0].postalCode[0]',            1, d.postCode),
    f('form1[0].page1[0].Part1[0].address[0].contactphone[0]',          1, d.homePhone),
    f('form1[0].page1[0].Part1[0].address[0].email[0]',                 1, d.email),
    f('form1[0].page1[0].Part1[0].address[0].gender[0]',                1, d.gender),
  ];
}

// ─── OCF-2: Employer's Confirmation Form ─────────────────────────────────────
// Header: Header[0].fields[0].claimnum (no Formtitle wrapper)
// Body:   Body[0].Part1[0].agentLastname (no appinfo wrapper)
function ocf2Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].fields[0].claimnum[0]',              1, d.claimNumber),
    f('form1[0].page1[0].Header[0].fields[0].claimnum[1]',              1, d.policyNumber),
    f('form1[0].page1[0].Header[0].fields[0].claimnum[2]',              1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].agentLastname[0]',            1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].agentFirstName[0]',           1, d.firstName),
    f('form1[0].page1[0].Body[0].Part1[0].streetName[0]',               1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].city[0]',                     1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].province[0]',                 1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].postalCode[0]',               1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].telephoneNo[0]',              1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].telephoneNo[1]',              1, d.workPhone),
    f('form1[0].page1[0].Body[0].Part1[0].date[0]',                     1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part1[0].InsuranceCompInfo[0].Insurance[0]', 1, d.insCompanyName),
    f('form1[0].page1[0].Body[0].Part1[0].InsuranceCompInfo[0].number[0]',    1, d.policyNumber),
  ];
}

// ─── OCF-3: Disability Certificate ───────────────────────────────────────────
// Header: Header[0].fields[0].claimnum (no Formtitle wrapper)
// Body:   Body[0].Part1[0].appinfo[0].agentLastname (has appinfo)
function ocf3Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].fields[0].claimnum[0]',              1, d.claimNumber),
    f('form1[0].page1[0].Header[0].fields[0].claimnum[1]',              1, d.policyNumber),
    f('form1[0].page1[0].Header[0].fields[0].claimnum[2]',              1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]', 1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',1, d.firstName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',    1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',          1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',      1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',    1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].telephoneNo[0]',   1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',          1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part2[0].compname[0]',                 2, d.insCompanyName),
    f('form1[0].page1[0].Body[0].Part2[0].compname[1]',                 2, d.insAdjuster),
    f('form1[0].page1[0].Body[0].Part4[0].Signature[0].name[0]',        2, `${d.firstName||''} ${d.lastName||''}`.trim()),
  ];
}

// ─── OCF-4: Death and Funeral Benefits Application ───────────────────────────
// Header: Header[0].fields[0].claimnum
// Body:   Body[0].Part1-DecInfo[0] (note the hyphen in Part1-DecInfo)
function ocf4Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].fields[0].claimnum[0]',              1, d.claimNumber),
    f('form1[0].page1[0].Header[0].fields[0].claimnum[1]',              1, d.policyNumber),
    f('form1[0].page1[0].Header[0].fields[0].claimnum[2]',              1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1-DecInfo[0].agentLastname[0]',    1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1-DecInfo[0].agentFirstName[0]',   1, d.firstName),
    f('form1[0].page1[0].Body[0].Part1-DecInfo[0].streetName[0]',       1, d.address),
    f('form1[0].page1[0].Body[0].Part1-DecInfo[0].city[0]',             1, d.city),
    f('form1[0].page1[0].Body[0].Part1-DecInfo[0].province[0]',         1, d.province),
    f('form1[0].page1[0].Body[0].Part1-DecInfo[0].postalCode[0]',       1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1-DecInfo[0].date[0]',             1, d.dateOfBirth),
  ];
}

// ─── OCF-5: Permission to Disclose Health Information ────────────────────────
// All field IDs verified correct from earlier extraction
function ocf5Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',  1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',  1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',  1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',  1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]', 1, `${d.firstName||''} ${d.initial||''}`.trim()),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].DOA[0]',            1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',     1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',           1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',       1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',     1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',           1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',        1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].worknum[0]',        1, d.workPhone),
    f('form1[0].page1[0].Body[0].Part2[0].compname[0]',                  1, d.insCompanyName),
    f('form1[0].page1[0].Body[0].Part2[0].compname[1]',                  1, d.insAdjuster),
    f('form1[0].page1[0].Body[0].Part2[0].streetName[0]',                1, d.insAddress),
    f('form1[0].page1[0].Body[0].Part2[0].city[0]',                      1, d.insCity),
    f('form1[0].page1[0].Body[0].Part2[0].province[0]',                  1, d.insProvince || ''),
    f('form1[0].page1[0].Body[0].Part2[0].postalCode[0]',                1, d.insPostal),
    f('form1[0].page1[0].Body[0].Part2[0].telephoneNo[0]',               1, d.insPhone),
    f('form1[0].page1[0].Body[0].Part2[0].fax[0]',                       1, d.insFax),
    f('form1[0].page1[0].Body[0].Part3[0].compname[0]',                  1, d.familyDoctor),
    f('form1[0].page1[0].Body[0].Part3[0].streetName[0]',                1, d.doctorAddress),
    f('form1[0].page1[0].Body[0].Part3[0].city[0]',                      1, d.doctorCity),
    f('form1[0].page1[0].Body[0].Part3[0].telephoneNo[0]',               1, d.familyDoctorPhone),
    f('form1[0].page1[0].Body[0].Part4[0].Signature[0].name[0]',         2, `${d.firstName||''} ${d.lastName||''}`.trim()),
  ];
}

// ─── OCF-6: Expenses Claim Form ──────────────────────────────────────────────
// All field IDs verified correct
function ocf6Fields(d: any) {
  const fields: any[] = [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',  1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',  1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',  1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',  1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]', 1, `${d.firstName||''} ${d.initial||''}`.trim()),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',     1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',           1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',       1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',     1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',           1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',        1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].worknum[0]',        1, d.workPhone),
    f('form1[0].page1[0].Body[0].Part3[0].Signature[0].name[0]',         2, `${d.firstName||''} ${d.lastName||''}`.trim()),
  ];

  const rows = ['Row1','Row2','Row3','Row4','Row5','Row6','Row7','Row8','Row10'];
  const expenses: any[] = d.expenses || [];
  rows.forEach((row, i) => {
    const exp = expenses[i] || {};
    fields.push(f(`form1[0].page1[0].Body[0].Part2[0].Table1[0].${row}[0].Cell1[0]`, 1, i + 1));
    fields.push(f(`form1[0].page1[0].Body[0].Part2[0].Table1[0].${row}[0].Cell2[0]`, 1, exp.date || ''));
    fields.push(f(`form1[0].page1[0].Body[0].Part2[0].Table1[0].${row}[0].Cell3[0]`, 1, exp.description || ''));
    fields.push(f(`form1[0].page1[0].Body[0].Part2[0].Table1[0].${row}[0].Cell4[0]`, 1, exp.amount || ''));
  });
  fields.push(f('form1[0].page1[0].Body[0].Part2[0].row11[0].min[0]', 1, d.expenseTotal || ''));
  return fields;
}

// ─── OCF-10: Election of Benefit ─────────────────────────────────────────────
// All field IDs verified correct
function ocf10Fields(d: any) {
  const benefitMap: Record<string, string> = {
    income_replacement: '/1',
    non_earner:         '/2',
    caregiver:          '/3',
  };
  const chosen = d.benefitElection ? (benefitMap[d.benefitElection] || '') : '';
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',              1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',              1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',              1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',              1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',             1, `${d.firstName||''} ${d.initial||''}`.trim()),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].DOA[0]',                        1, d.gender),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',                 1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',                       1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',                   1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',                 1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',                       1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',                    1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].worknum[0]',                    1, d.workPhone),
    f('form1[0].page1[0].Body[0].Part2[0].border[0].contactNumber[0]',               1, chosen === '/1' ? '/1' : '/Off'),
    f('form1[0].page1[0].Body[0].Part2[0].border[0].contactNumber[1]',               1, chosen === '/2' ? '/2' : '/Off'),
    f('form1[0].page1[0].Body[0].Part2[0].border[0].contactNumber[2]',               1, chosen === '/3' ? '/3' : '/Off'),
    f('form1[0].page1[0].Body[0].Part3[0].Signature[0].name[0]',                     1, `${d.firstName||''} ${d.lastName||''}`.trim()),
  ];
}

// ─── OCF-18: Treatment and Assessment Plan ───────────────────────────────────
// COMPLETELY DIFFERENT field ID format: short names like ClaiNum, Part1_LName
// Verified from actual PDF extraction
function ocf18Fields(d: any) {
  return [
    f('ClaiNum',          1, d.claimNumber),
    f('PolNum',           1, d.policyNumber),
    f('DatAcc',           1, d.dateOfAccident),
    f('gender',           1, d.gender),
    f('Part1_PhNum',      1, d.homePhone),
    f('Part1_LName',      1, d.lastName),
    f('Part1_FName',      1, d.firstName),
    f('Part1_Add',        1, d.address),
    f('Part1_City',       1, d.city),
    f('Part1_Province',   1, d.province),
    f('Part1_PosCode',    1, d.postCode),
    f('Part2_InsName',    1, d.insCompanyName),
    f('Part2_City',       1, d.insCity),
    f('Part2_AdjLName',   1, d.insAdjuster),
    f('Part2_AdjFName',   1, ''),
    f('Part2_AdjTel',     1, d.insPhone),
    f('Part2_AdjFax',     1, d.insFax),
  ];
}

// ─── OCF-19: Application for Determination of Catastrophic Impairment ────────
// Header: Header[0].Formtitle[0].fields[0].claimnum (same as OCF-5/10)
// Body:   Body[0].Part1[0].appinfo[0].agentLastname (same as OCF-5)
function ocf19Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',  1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',  1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',  1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',  1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]', 1, `${d.firstName||''} ${d.initial||''}`.trim()),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].DOA[0]',            1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',     1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',           1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',       1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',     1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',        1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].worknum[0]',        1, d.workPhone),
    f('form1[0].page1[0].Body[0].Part2[0].docname[0]',                   2, d.familyDoctor),
    f('form1[0].page1[0].Body[0].Part2[0].streetName[0]',                2, d.doctorAddress),
    f('form1[0].page1[0].Body[0].Part2[0].city[0]',                      2, d.doctorCity),
    f('form1[0].page1[0].Body[0].Part2[0].telephoneNo[0]',               2, d.familyDoctorPhone),
  ];
}

// ─── OCF-23: Treatment Confirmation Form ─────────────────────────────────────
// COMPLETELY DIFFERENT format: plain English IDs like "Claim Number", "Part 1 Last Name"
// Verified from actual PDF extraction
function ocf23Fields(d: any) {
  return [
    f('Claim Number',      1, d.claimNumber),
    f('Policy Number',     1, d.policyNumber),
    f('Date',              1, d.dateOfAccident),
    f('Part 1 Last Name',  1, d.lastName),
    f('Part 1 First Name', 1, d.firstName),
    f('Part 1 Phone',      1, d.homePhone),
    f('Part 1 Address',    1, d.address),
    f('Part 1 City',       1, d.city),
    f('Part 1 Province',   1, d.province),
    f('Part 1 Postal Code',1, d.postCode),
    f('Part 2 Company',    1, d.insCompanyName),
    f('Part 2 City',       1, d.insCity),
    f('Part 2 Last Name',  1, d.insAdjuster),
    f('Part 2 Phone',      1, d.insPhone),
    f('Part 2 Fax',        1, d.insFax),
  ];
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const FORM_FIELD_MAP: Record<string, (d: any) => any[]> = {
  '1':  ocf1Fields,
  '2':  ocf2Fields,
  '3':  ocf3Fields,
  '4':  ocf4Fields,
  '5':  ocf5Fields,
  '6':  ocf6Fields,
  '10': ocf10Fields,
  '18': ocf18Fields,
  '19': ocf19Fields,
  '23': ocf23Fields,
};

const TEMPLATE_FILES: Record<string, string> = {
  '1':  'OCF-1_Application_for_Accident_Benefits.pdf',
  '2':  'OCF-2_Employer_s_Confirmation_Form.pdf',
  '3':  'OCF-3_Disability_Certificate.pdf',
  '4':  'OCF-4_Death_and_Funeral_Benefits_Application.pdf',
  '5':  'OCF-5_Permission_to_Disclose_Health_Information.pdf',
  '6':  'OCF-6_Expenses_Claim_Form.pdf',
  '10': 'OCF-10_Election_of_Income_Replacement__Non-Earner_or_Caregiver_Benefit.pdf',
  '18': 'OCF-18_Treatment_and_Assessment_Plan.pdf',
  '19': 'OCF-19_Application_for_Determination_of_Catastrophic_Impairment.pdf',
  '23': 'OCF-23_Treatment_Confirmation_Form.pdf',
};

// ─── Main controller ──────────────────────────────────────────────────────────

export async function generateOcfPdf(req: Request, res: Response) {
  const { caseId, formNumber } = req.params;

  if (!FORM_FIELD_MAP[formNumber]) {
    return res.status(400).json({ error: `Unknown OCF form number: ${formNumber}` });
  }

  const templatePath = path.join(TEMPLATES_DIR, TEMPLATE_FILES[formNumber]);
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({
      error: 'Template PDF not found',
      expected: templatePath,
      action: 'Copy the OCF PDF templates to D:\\CRM_Phase_1\\backend\\templates\\ocf\\',
    });
  }

  try {
    const prefillData = await getCasePrefillData(caseId);
    const data = { ...prefillData, ...req.body };

    // OCF-10: map benefit election string to internal key
    if (formNumber === '10' && data.benefitElection) {
      const map: Record<string, string> = {
        'Income Replacement Benefit': 'income_replacement',
        'Non-Earner Benefit':         'non_earner',
        'Caregiver Benefit':          'caregiver',
      };
      data.benefitElection = map[data.benefitElection] || data.benefitElection;
    }

    const fieldValues = FORM_FIELD_MAP[formNumber](data);

    const ts = Date.now();
    const tmpJson = path.join(TEMP_DIR, `ocf${formNumber}_${caseId}_${ts}.json`);
    const tmpPdf  = path.join(TEMP_DIR, `ocf${formNumber}_${caseId}_${ts}.pdf`);

    fs.writeFileSync(tmpJson, JSON.stringify(fieldValues, null, 2));

    execSync(`python "${FILL_SCRIPT}" "${templatePath}" "${tmpJson}" "${tmpPdf}"`, {
      timeout: 30000,
    });

    if (!fs.existsSync(tmpPdf)) {
      return res.status(500).json({ error: 'PDF fill script ran but produced no output' });
    }

    const lastName = (prefillData as any).lastName || caseId;
    const fileName = `OCF-${formNumber}_${lastName}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fs.readFileSync(tmpPdf));

    try { fs.unlinkSync(tmpJson); } catch {}
    try { fs.unlinkSync(tmpPdf); } catch {}

  } catch (err: any) {
    console.error('[OCF PDF] Error:', err.message);
    return res.status(500).json({ error: 'PDF generation failed', detail: err.message });
  }
}

// ─── DB prefill query — all column names verified from DESCRIBE output ────────

async function getCasePrefillData(caseId: string): Promise<Record<string, string>> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT
      ca.file_no             AS claimNumber,
      ca.date_of_loss        AS dateOfAccident,
      cl.first_name          AS firstName,
      cl.last_name           AS lastName,
      cl.initial,
      cl.date_of_birth       AS dateOfBirth,
      cl.gender,
      cl.address,
      cl.city,
      cl.province,
      cl.post_code           AS postCode,
      cl.home_phone          AS homePhone,
      cl.cell_phone          AS cellPhone,
      cl.work_phone          AS workPhone,
      cl.email,
      cid.driver_license     AS driverLicenseNo,
      cid.ohip_number        AS ohipNumber,
      -- Insurance: try case_no_fault first, fallback to case_insurance_first_party
      COALESCE(cnf.mva_company,   ifp.insurance_company) AS insCompanyName,
      COALESCE(cnf.adjuster_name, ifp.adjuster_name)     AS insAdjuster,
      COALESCE(cnf.mva_address,   ifp.address)           AS insAddress,
      COALESCE(cnf.mva_city,      ifp.city)              AS insCity,
      COALESCE(cnf.mva_postal,    ifp.postal_code)       AS insPostal,
      COALESCE(cnf.mva_phone,     ifp.adjuster_phone)    AS insPhone,
      COALESCE(cnf.mva_fax,       ifp.adjuster_fax)      AS insFax,
      COALESCE(cnf.claim_no,      ifp.claim_no)          AS policyNumber,
      COALESCE(cnf.policy_no,     ifp.policy_no)         AS insPolicyNo,
      emp.employer_name      AS emp1Name,
      emp.address            AS emp1Address,
      emp.city               AS emp1City,
      emp.province           AS emp1Province,
      emp.postal_code        AS emp1Postal,
      emp.phone              AS emp1Phone,
      cmh.doctor_name        AS familyDoctor,
      cmh.doctor_phone       AS familyDoctorPhone,
      cmh.doctor_address     AS doctorAddress,
      cmh.doctor_city        AS doctorCity,
      cmh.doctor_fax         AS doctorFax,
      cmp.centre             AS tp1Centre,
      cmp.phone              AS tp1Phone
    FROM cases ca
    LEFT JOIN clients cl              ON ca.client_id = cl.id
    LEFT JOIN case_client_id_docs cid ON ca.id = cid.case_id
    LEFT JOIN case_no_fault cnf       ON ca.id = cnf.case_id
    LEFT JOIN case_insurance_first_party ifp ON ca.id = ifp.case_id
    LEFT JOIN case_employers emp      ON ca.id = emp.case_id AND emp.employer_order = 1
    LEFT JOIN case_medical_hospital cmh ON ca.id = cmh.case_id
    LEFT JOIN case_medical_providers cmp ON ca.id = cmp.case_id AND cmp.provider_order = 1
    WHERE ca.id = ?
    LIMIT 1`,
    [caseId]
  );
  return (rows[0] || {}) as Record<string, string>;
}