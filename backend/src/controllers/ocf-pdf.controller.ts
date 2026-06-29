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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Each field entry must have field_id, page, value */
function f(field_id: string, page: number, value: string) {
  return { field_id, page, value: value ?? '' };
}

// ─── OCF-1: Application for Accident Benefits ────────────────────────────────
function ocf1Fields(d: any) {
  return [
    f('form1[0].page1[0].header[0].claimnum[0]',                           1, d.claimNumber),
    f('form1[0].page1[0].header[0].claimnum[1]',                           1, d.policyNumber),
    f('form1[0].page1[0].header[0].claimnum[2]',                           1, d.dateOfAccident),
    f('form1[0].page1[0].Part1[0].fname[0]',                               1, d.firstName),
    f('form1[0].page1[0].Part1[0].lname[0]',                               1, d.lastName),
    f('form1[0].page1[0].Part1[0].dob[0]',                                 1, d.dateOfBirth),
    f('form1[0].page1[0].Part1[0].DriveLic[0]',                            1, d.driverLicenseNo),
    f('form1[0].page1[0].Part1[0].address[0].streetName[0]',               1, d.address),
    f('form1[0].page1[0].Part1[0].address[0].city[0]',                     1, d.city),
    f('form1[0].page1[0].Part1[0].address[0].province[0]',                 1, d.province),
    f('form1[0].page1[0].Part1[0].address[0].postalCode[0]',               1, d.postCode),
    f('form1[0].page1[0].Part1[0].address[0].contactphone[0]',             1, d.homePhone),
    f('form1[0].page1[0].Part1[0].address[0].email[0]',                    1, d.email),
    f('form1[0].page1[0].Part1[0].address[0].gender[0]',                   1, d.gender),
  ];
}

// ─── OCF-2: Employer's Confirmation Form ─────────────────────────────────────
function ocf2Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',   1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',   1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',   1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',   1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',  1, d.firstName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',      1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',            1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',        1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',      1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',         1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].worknum[0]',         1, d.workPhone),
    // Employer info (from case_employers order_num=1)
    f('form1[0].page1[0].Body[0].Part5[0].compname[0]',                   2, d.emp1Name),
    f('form1[0].page1[0].Body[0].Part5[0].streetName[0]',                 2, d.emp1Address),
    f('form1[0].page1[0].Body[0].Part5[0].city[0]',                       2, d.emp1City),
    f('form1[0].page1[0].Body[0].Part5[0].province[0]',                   2, d.emp1Province),
    f('form1[0].page1[0].Body[0].Part5[0].postalCode[0]',                 2, d.emp1Postal),
    f('form1[0].page1[0].Body[0].Part5[0].telephoneNo[0]',                2, d.emp1Phone),
  ];
}

// ─── OCF-3: Disability Certificate ───────────────────────────────────────────
function ocf3Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',   1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',   1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',   1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',   1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',  1, d.firstName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',      1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',            1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',        1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',      1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',            1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',         1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part2[0].compname[0]',                   1, d.insCompanyName),
    f('form1[0].page1[0].Body[0].Part2[0].compname[1]',                   1, d.insAdjuster),
  ];
}

// ─── OCF-4: Death and Funeral Benefits Application ───────────────────────────
function ocf4Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',   1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',   1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',   1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',   1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',  1, d.firstName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',      1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',            1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',        1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',      1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',            1, d.dateOfBirth),
  ];
}

// ─── OCF-5: Permission to Disclose Health Information ────────────────────────
function ocf5Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',        1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',        1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',        1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',        1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',       1, `${d.firstName||''} ${d.initial||''}`.trim()),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].DOA[0]',                  1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',           1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',                 1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',             1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',           1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',                 1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',              1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].worknum[0]',              1, d.workPhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].ext[0]',                  1, d.workPhoneExt),
    f('form1[0].page1[0].Body[0].Part2[0].compname[0]',                        1, d.insCompanyName),
    f('form1[0].page1[0].Body[0].Part2[0].compname[1]',                        1, d.insAdjuster),
    f('form1[0].page1[0].Body[0].Part2[0].streetName[0]',                      1, d.insAddress),
    f('form1[0].page1[0].Body[0].Part2[0].city[0]',                            1, d.insCity),
    f('form1[0].page1[0].Body[0].Part2[0].province[0]',                        1, d.insProvince),
    f('form1[0].page1[0].Body[0].Part2[0].postalCode[0]',                      1, d.insPostal),
    f('form1[0].page1[0].Body[0].Part2[0].telephoneNo[0]',                     1, d.insPhone),
    f('form1[0].page1[0].Body[0].Part2[0].fax[0]',                             1, d.insFax),
    f('form1[0].page1[0].Body[0].Part3[0].compname[0]',                        1, d.familyDoctor),
    f('form1[0].page1[0].Body[0].Part3[0].compname[1]',                        1, d.doctorProfession || 'Physician'),
    f('form1[0].page1[0].Body[0].Part3[0].streetName[0]',                      1, d.doctorAddress),
    f('form1[0].page1[0].Body[0].Part3[0].city[0]',                            1, d.doctorCity),
    f('form1[0].page1[0].Body[0].Part3[0].province[0]',                        1, d.doctorProvince),
    f('form1[0].page1[0].Body[0].Part3[0].postalCode[0]',                      1, d.doctorPostal),
    f('form1[0].page1[0].Body[0].Part3[0].telephoneNo[0]',                     1, d.familyDoctorPhone),
    f('form1[0].page1[0].Body[0].Part4[0].Signature[0].name[0]',               2, `${d.firstName||''} ${d.lastName||''}`.trim()),
  ];
}

// ─── OCF-6: Expenses Claim Form ──────────────────────────────────────────────
function ocf6Fields(d: any) {
  const fields: any[] = [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',   1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',   1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',   1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',   1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',  1, `${d.firstName||''} ${d.initial||''}`.trim()),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].DOA[0]',             1, d.gender),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',      1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',            1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',        1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',      1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',            1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',         1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].worknum[0]',         1, d.workPhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].ext[0]',             1, d.workPhoneExt),
    f('form1[0].page1[0].Body[0].Part3[0].Signature[0].name[0]',          2, `${d.firstName||''} ${d.lastName||''}`.trim()),
  ];

  // Expense rows — up to 10 items
  const rows = ['Row1','Row2','Row3','Row4','Row5','Row6','Row7','Row8','Row10'];
  const expenses: any[] = d.expenses || [];
  rows.forEach((row, i) => {
    const exp = expenses[i] || {};
    fields.push(f(`form1[0].page1[0].Body[0].Part2[0].Table1[0].${row}[0].Cell1[0]`, 1, exp.item || ''));
    fields.push(f(`form1[0].page1[0].Body[0].Part2[0].Table1[0].${row}[0].Cell2[0]`, 1, exp.date || ''));
    fields.push(f(`form1[0].page1[0].Body[0].Part2[0].Table1[0].${row}[0].Cell3[0]`, 1, exp.description || ''));
    fields.push(f(`form1[0].page1[0].Body[0].Part2[0].Table1[0].${row}[0].Cell4[0]`, 1, exp.amount || ''));
  });
  fields.push(f('form1[0].page1[0].Body[0].Part2[0].row11[0].min[0]', 1, d.expenseTotal || ''));

  return fields;
}

// ─── OCF-10: Election of Benefit ─────────────────────────────────────────────
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
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].ext[0]',                        1, d.workPhoneExt),
    // Benefit election checkboxes
    f('form1[0].page1[0].Body[0].Part2[0].border[0].contactNumber[0]',               1, chosen === '/1' ? '/1' : '/Off'),
    f('form1[0].page1[0].Body[0].Part2[0].border[0].contactNumber[1]',               1, chosen === '/2' ? '/2' : '/Off'),
    f('form1[0].page1[0].Body[0].Part2[0].border[0].contactNumber[2]',               1, chosen === '/3' ? '/3' : '/Off'),
    f('form1[0].page1[0].Body[0].Part3[0].Signature[0].name[0]',                     1, `${d.firstName||''} ${d.lastName||''}`.trim()),
  ];
}

// ─── OCF-18: Treatment and Assessment Plan ───────────────────────────────────
function ocf18Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',   1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',   1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',   1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',   1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',  1, d.firstName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',      1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',            1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',        1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',      1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',            1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part2[0].compname[0]',                   1, d.insCompanyName),
    f('form1[0].page1[0].Body[0].Part2[0].compname[1]',                   1, d.insAdjuster),
  ];
}

// ─── OCF-19: Application for Determination of Catastrophic Impairment ────────
function ocf19Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',   1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',   1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',   1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',   1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',  1, `${d.firstName||''} ${d.initial||''}`.trim()),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',      1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',            1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',        1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',      1, d.postCode),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].date[0]',            1, d.dateOfBirth),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].homenum[0]',         1, d.homePhone),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].worknum[0]',         1, d.workPhone),
  ];
}

// ─── OCF-23: Treatment Confirmation Form ─────────────────────────────────────
function ocf23Fields(d: any) {
  return [
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[0]',   1, d.claimNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[1]',   1, d.policyNumber),
    f('form1[0].page1[0].Header[0].Formtitle[0].fields[0].claimnum[2]',   1, d.dateOfAccident),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentLastname[0]',   1, d.lastName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].agentFirstName[0]',  1, d.firstName),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].streetName[0]',      1, d.address),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].city[0]',            1, d.city),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].province[0]',        1, d.province),
    f('form1[0].page1[0].Body[0].Part1[0].appinfo[0].postalCode[0]',      1, d.postCode),
    f('form1[0].page1[0].Body[0].Part2[0].compname[0]',                   1, d.insCompanyName),
    f('form1[0].page1[0].Body[0].Part2[0].compname[1]',                   1, d.insAdjuster),
    f('form1[0].page1[0].Body[0].Part2[0].streetName[0]',                 1, d.insAddress),
    f('form1[0].page1[0].Body[0].Part2[0].city[0]',                       1, d.insCity),
    f('form1[0].page1[0].Body[0].Part2[0].province[0]',                   1, d.insProvince),
    f('form1[0].page1[0].Body[0].Part2[0].postalCode[0]',                 1, d.insPostal),
  ];
}

// ─── Dispatcher maps ──────────────────────────────────────────────────────────

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

// ─── Main generate controller ─────────────────────────────────────────────────

export async function generateOcfPdf(req: Request, res: Response) {
  const { caseId, formNumber } = req.params;

  if (!FORM_FIELD_MAP[formNumber]) {
    return res.status(400).json({ error: `Unknown OCF form number: ${formNumber}. Valid: 1,2,3,4,5,6,10,18,19,23` });
  }

  const templatePath = path.join(TEMPLATES_DIR, TEMPLATE_FILES[formNumber]);
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({
      error: `Template PDF not found`,
      expected: templatePath,
      action: `Copy the OCF PDF templates to D:\\CRM_Phase_1\\backend\\templates\\ocf\\`,
    });
  }

  try {
    // 1. Fetch all case/client/insurance data from DB
    const prefillData = await getCasePrefillData(caseId);

    // 2. Merge with any POST body overrides (expense rows, benefit election, etc.)
    const data = { ...prefillData, ...req.body };

    // 3. Build field values array with real PDF field IDs + page numbers
    const fieldValues = FORM_FIELD_MAP[formNumber](data);

    // 4. Write to temp file and call Python fill script
    const ts = Date.now();
    const tmpJson = path.join(TEMP_DIR, `ocf${formNumber}_${caseId}_${ts}.json`);
    const tmpPdf  = path.join(TEMP_DIR, `ocf${formNumber}_${caseId}_${ts}.pdf`);

    fs.writeFileSync(tmpJson, JSON.stringify(fieldValues));
    execSync(`python "${FILL_SCRIPT}" "${templatePath}" "${tmpJson}" "${tmpPdf}"`, { timeout: 30000 });

    if (!fs.existsSync(tmpPdf)) {
      return res.status(500).json({ error: 'PDF fill script ran but produced no output file' });
    }

    // 5. Stream filled PDF to browser as download
    const fileName = `OCF-${formNumber}_${(prefillData as any).lastName || caseId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fs.readFileSync(tmpPdf));

    // 6. Clean up
    fs.unlinkSync(tmpJson);
    fs.unlinkSync(tmpPdf);

  } catch (err: any) {
    console.error('[OCF PDF] Error:', err.message);
    return res.status(500).json({ error: 'PDF generation failed', detail: err.message });
  }
}

// ─── DB query — fetches all prefill data in one join ─────────────────────────

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
      cnf.mva_company        AS insCompanyName,
      cnf.adjuster_name      AS insAdjuster,
      cnf.mva_address        AS insAddress,
      cnf.mva_city           AS insCity,
      cnf.mva_postal         AS insPostal,
      cnf.mva_phone          AS insPhone,
      cnf.mva_fax            AS insFax,
      cnf.claim_no           AS policyNumber,
      cnf.policy_no          AS insPolicyNo,
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
    LEFT JOIN case_employers emp      ON ca.id = emp.case_id AND emp.employer_order = 1
    LEFT JOIN case_medical_hospital cmh ON ca.id = cmh.case_id
    LEFT JOIN case_medical_providers cmp ON ca.id = cmp.case_id AND cmp.provider_order = 1
    WHERE ca.id = ?
    LIMIT 1`,
    [caseId]
  );
  return (rows[0] || {}) as Record<string, string>;
}