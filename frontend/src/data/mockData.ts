export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  initial: string;
  address: string;
  city: string;
  province: string;
  postCode: string;
  homePhone: string;
  cellPhone: string;
  workPhone: string;
  email: string;
  dateOfBirth: string;
  maritalStatus: string;
  dependants: number;
  phoneNumber?: string;
  mobileNumber?: string;
}

export interface CaseRecord {
  id: string;
  clientId: string;
  fileNo: string;
  fileStatus: string;
  caseType: string;
  dateOfLoss: string;
  openDate: string;
  referredBy: string;
  referredById?: string;
  clerkAssigned: string;
  secretary: string;
  limitationDate: string;
  mediationStatus: string;
  arbitrationStatus: string;
  mvaClientFault: string;
  benefitsClaiming: string;
  irbNonEarnerDue: string;
  thirdPartyLawyer: string;
  tortFileNo: string;
  closedFileNo: string;
  client: Client;
  clientSignatureUrl?: string;
  clientInitials?: string;
  clientStreet?: string;
  clientCity?: string;
  clientState?: string;
  clientZip?: string;
  clientCountry?: string;
  clientMobile?: string;
}

export interface Referrer {
  id: string;
  name: string;
  type: string;
}

export interface Note {
  id: string;
  caseId: string;
  date: string;
  time: string;
  author: string;
  text: string;
}

export interface Activity {
  id: string;
  caseId: string;
  date: string;
  time: string;
  type: string;
  regarding: string;
  details: string;
  recordManager: string;
  companyGroup: string;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  name: string;
  type: string;
  category: string;
  uploadedBy: string;
  date: string;
}

export interface HistoryEntry {
  id: string;
  caseId: string;
  date: string;
  time: string;
  user: string;
  action: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
}

export interface ContactAccess {
  id: string;
  caseId: string;
  name: string;
  role: string;
  accessLevel: string;
  dateAdded: string;
}

export interface StatusEntry {
  id: string;
  caseId: string;
  status: string;
  date: string;
  changedBy: string;
}

// Referrers list
export const referrers: Referrer[] = [
  { id: "r1", name: "Dr. Williams", type: "Physician" },
  { id: "r2", name: "Ahmed & Partners", type: "Law Firm" },
  { id: "r3", name: "Walk-in", type: "Direct" },
  { id: "r4", name: "Google Search", type: "Online" },
  { id: "r5", name: "Client Referral", type: "Referral" },
  { id: "r6", name: "Dr. Sarah Ahmed", type: "Physician" },
  { id: "r7", name: "Insurance Broker Network", type: "Broker" },
  { id: "r8", name: "Community Legal Clinic", type: "Legal Aid" },
  { id: "r9", name: "Physiotherapy Plus", type: "Clinic" },
  { id: "r10", name: "Hospital ER Referral", type: "Hospital" },
];

const clients: Client[] = [
  { id: "c1", firstName: "James", lastName: "Morrison", initial: "R", address: "142 Queen Street West", city: "Toronto", province: "Ontario", postCode: "M5H 2N5", homePhone: "4165551234", cellPhone: "4165559876", workPhone: "4165554321", email: "james.morrison@email.com", dateOfBirth: "1985-03-15", maritalStatus: "Married", dependants: 2, phoneNumber: "+1-416-555-1234", mobileNumber: "+14165559876" },
  { id: "c2", firstName: "Sarah", lastName: "Chen", initial: "L", address: "88 Yonge Street", city: "Toronto", province: "Ontario", postCode: "M5C 1T4", homePhone: "4165552345", cellPhone: "4165558765", workPhone: "", email: "sarah.chen@email.com", dateOfBirth: "1990-07-22", maritalStatus: "Single", dependants: 0, phoneNumber: "+1-416-555-2345", mobileNumber: "+14165558765" },
  { id: "c3", firstName: "Michael", lastName: "Patel", initial: "K", address: "305 Dundas Street", city: "Mississauga", province: "Ontario", postCode: "L5B 1H3", homePhone: "9055553456", cellPhone: "9055557654", workPhone: "9055556789", email: "m.patel@email.com", dateOfBirth: "1978-11-08", maritalStatus: "Married", dependants: 3, phoneNumber: "+1-905-555-3456", mobileNumber: "+19055557654" },
  { id: "c4", firstName: "Emily", lastName: "Rodriguez", initial: "A", address: "72 King Street", city: "Hamilton", province: "Ontario", postCode: "L8P 4V2", homePhone: "9055554567", cellPhone: "9055556543", workPhone: "", email: "emily.rod@email.com", dateOfBirth: "1995-01-30", maritalStatus: "Common-Law", dependants: 1, phoneNumber: "+1-905-555-4567", mobileNumber: "+19055556543" },
  { id: "c5", firstName: "David", lastName: "Thompson", initial: "W", address: "1200 Bay Street", city: "Toronto", province: "Ontario", postCode: "M5R 2A5", homePhone: "4165555678", cellPhone: "4165555432", workPhone: "4165559012", email: "d.thompson@email.com", dateOfBirth: "1982-06-14", maritalStatus: "Divorced", dependants: 1, phoneNumber: "+1-416-555-5678", mobileNumber: "+14165555432" },
];

export const cases: CaseRecord[] = [
  { id: "1", clientId: "c1", fileNo: "MVA-2024-1001", fileStatus: "Active", caseType: "Motor Vehicle Accident (MVA)", dateOfLoss: "2024-06-15", openDate: "2024-06-20", referredBy: "Dr. Williams", referredById: "r1", clerkAssigned: "Amanda Singh", secretary: "Lisa Park", limitationDate: "2026-06-15", mediationStatus: "Pending", arbitrationStatus: "N/A", mvaClientFault: "No", benefitsClaiming: "Yes", irbNonEarnerDue: "Yes", thirdPartyLawyer: "Robert Lee", tortFileNo: "TORT-2024-501", closedFileNo: "", client: clients[0], clientInitials: "JM", clientStreet: "142 Queen Street West", clientCity: "Toronto", clientState: "Ontario", clientZip: "M5H 2N5", clientCountry: "Canada", clientMobile: "+14165559876" },
  { id: "2", clientId: "c2", fileNo: "MVA-2024-1002", fileStatus: "Active", caseType: "Motor Vehicle Accident (MVA)", dateOfLoss: "2024-08-03", openDate: "2024-08-10", referredBy: "Walk-in", referredById: "r3", clerkAssigned: "John Baker", secretary: "Lisa Park", limitationDate: "2026-04-01", mediationStatus: "N/A", arbitrationStatus: "N/A", mvaClientFault: "No", benefitsClaiming: "Yes", irbNonEarnerDue: "No", thirdPartyLawyer: "Karen White", tortFileNo: "TORT-2024-502", closedFileNo: "", client: clients[1], clientInitials: "SC", clientStreet: "88 Yonge Street", clientCity: "Toronto", clientState: "Ontario", clientZip: "M5C 1T4", clientCountry: "Canada", clientMobile: "+14165558765" },
  { id: "3", clientId: "c3", fileNo: "MVA-2023-0987", fileStatus: "Litigation", caseType: "Slip and Fall", dateOfLoss: "2023-02-14", openDate: "2023-02-28", referredBy: "Ahmed & Partners", referredById: "r2", clerkAssigned: "Amanda Singh", secretary: "Maria Costa", limitationDate: "2025-02-14", mediationStatus: "Completed", arbitrationStatus: "Scheduled", mvaClientFault: "No", benefitsClaiming: "Yes", irbNonEarnerDue: "Yes", thirdPartyLawyer: "Steven Grant", tortFileNo: "TORT-2023-320", closedFileNo: "", client: clients[2], clientInitials: "MP", clientStreet: "305 Dundas Street", clientCity: "Mississauga", clientState: "Ontario", clientZip: "L5B 1H3", clientCountry: "Canada", clientMobile: "+19055557654" },
  { id: "4", clientId: "c4", fileNo: "MVA-2024-1045", fileStatus: "Pending", caseType: "Traffic Accident", dateOfLoss: "2024-11-20", openDate: "2024-11-25", referredBy: "Google Search", referredById: "r4", clerkAssigned: "John Baker", secretary: "Maria Costa", limitationDate: "2026-03-25", mediationStatus: "N/A", arbitrationStatus: "N/A", mvaClientFault: "Yes", benefitsClaiming: "No", irbNonEarnerDue: "No", thirdPartyLawyer: "", tortFileNo: "", closedFileNo: "", client: clients[3], clientInitials: "ER", clientStreet: "72 King Street", clientCity: "Hamilton", clientState: "Ontario", clientZip: "L8P 4V2", clientCountry: "Canada", clientMobile: "+19055556543" },
  { id: "5", clientId: "c5", fileNo: "MVA-2023-0845", fileStatus: "Settled", caseType: "Immigration", dateOfLoss: "2023-05-10", openDate: "2023-05-15", referredBy: "Client Referral", referredById: "r5", clerkAssigned: "Amanda Singh", secretary: "Lisa Park", limitationDate: "2025-05-10", mediationStatus: "Completed", arbitrationStatus: "N/A", mvaClientFault: "No", benefitsClaiming: "Yes", irbNonEarnerDue: "Yes", thirdPartyLawyer: "Jennifer Adams", tortFileNo: "TORT-2023-290", closedFileNo: "CLO-2025-112", client: clients[4], clientInitials: "DT", clientStreet: "1200 Bay Street", clientCity: "Toronto", clientState: "Ontario", clientZip: "M5R 2A5", clientCountry: "Canada", clientMobile: "+14165555432" },
];

export const notes: Note[] = [
  { id: "n1", caseId: "1", date: "2024-12-10", time: "10:30", author: "Amanda Singh", text: "Called client to discuss AB claim status. Client confirmed receipt of OCF-3." },
  { id: "n2", caseId: "1", date: "2024-12-08", time: "14:15", author: "Lisa Park", text: "Sent follow-up email to Aviva adjuster regarding outstanding IRB payments." },
  { id: "n3", caseId: "1", date: "2024-11-28", time: "09:00", author: "Amanda Singh", text: "Medical records received from Dr. Williams. Filed in documents." },
  { id: "n4", caseId: "2", date: "2024-12-09", time: "11:00", author: "John Baker", text: "Client attended for initial interview. All forms signed." },
  { id: "n5", caseId: "2", date: "2024-12-05", time: "16:30", author: "John Baker", text: "Requested police report from TPS Collision Reporting Centre." },
  { id: "n6", caseId: "3", date: "2024-12-11", time: "09:45", author: "Amanda Singh", text: "Arbitration hearing scheduled for January 15, 2025." },
  { id: "n7", caseId: "3", date: "2024-12-01", time: "13:00", author: "Maria Costa", text: "Mediation completed. No settlement reached. Proceeding to arbitration." },
  { id: "n8", caseId: "4", date: "2024-12-10", time: "15:00", author: "John Baker", text: "Awaiting signed retainer from client. Follow up by Dec 15." },
];

export const activities: Activity[] = [
  { id: "a1", caseId: "1", date: "2024-12-10", time: "10:30", type: "Call", regarding: "AB Claim Status", details: "Called client re: OCF-3 confirmation", recordManager: "Amanda Singh", companyGroup: "Internal" },
  { id: "a2", caseId: "1", date: "2024-12-08", time: "14:15", type: "Email", regarding: "IRB Follow-up", details: "Email to Aviva adjuster", recordManager: "Lisa Park", companyGroup: "Aviva Insurance" },
  { id: "a3", caseId: "1", date: "2024-12-15", time: "09:00", type: "Appointment", regarding: "Client Meeting", details: "In-person meeting to review case progress", recordManager: "Amanda Singh", companyGroup: "Internal" },
  { id: "a4", caseId: "2", date: "2024-12-09", time: "11:00", type: "Appointment", regarding: "Initial Interview", details: "Client initial interview completed", recordManager: "John Baker", companyGroup: "Internal" },
  { id: "a5", caseId: "3", date: "2024-12-11", time: "09:45", type: "Task", regarding: "Arbitration Prep", details: "Prepare documents for arbitration hearing", recordManager: "Amanda Singh", companyGroup: "Internal" },
];

export const caseDocuments: CaseDocument[] = [
  { id: "d1", caseId: "1", name: "OCF-3 Disability Certificate.pdf", type: "PDF", category: "OCF Forms", uploadedBy: "Amanda Singh", date: "2024-11-20" },
  { id: "d2", caseId: "1", name: "Medical Report - Dr. Williams.pdf", type: "PDF", category: "Medical Reports", uploadedBy: "Amanda Singh", date: "2024-11-28" },
  { id: "d3", caseId: "1", name: "Police Report.pdf", type: "PDF", category: "Police Reports", uploadedBy: "Lisa Park", date: "2024-07-01" },
  { id: "d4", caseId: "2", name: "Client Retainer Agreement.pdf", type: "PDF", category: "Legal Documents", uploadedBy: "John Baker", date: "2024-08-10" },
  { id: "d5", caseId: "3", name: "Mediation Brief.docx", type: "DOCX", category: "Legal Documents", uploadedBy: "Amanda Singh", date: "2024-11-15" },
];

export const historyEntries: HistoryEntry[] = [
  { id: "h1", caseId: "1", date: "2024-12-10", time: "10:35", user: "Amanda Singh", action: "Updated", fieldChanged: "Mediation Status", oldValue: "N/A", newValue: "Pending" },
  { id: "h2", caseId: "1", date: "2024-06-20", time: "09:00", user: "Amanda Singh", action: "Created", fieldChanged: "Case", oldValue: "", newValue: "MVA-2024-1001" },
  { id: "h3", caseId: "3", date: "2024-12-01", time: "13:05", user: "Amanda Singh", action: "Updated", fieldChanged: "File Status", oldValue: "Active", newValue: "Litigation" },
  { id: "h4", caseId: "3", date: "2024-12-01", time: "13:10", user: "Amanda Singh", action: "Updated", fieldChanged: "Mediation Status", oldValue: "Pending", newValue: "Completed" },
];

export const contactAccess: ContactAccess[] = [
  { id: "ca1", caseId: "1", name: "Amanda Singh", role: "Clerk", accessLevel: "Full", dateAdded: "2024-06-20" },
  { id: "ca2", caseId: "1", name: "Lisa Park", role: "Secretary", accessLevel: "Full", dateAdded: "2024-06-20" },
  { id: "ca3", caseId: "1", name: "John Smith", role: "Lawyer", accessLevel: "Read Only", dateAdded: "2024-07-15" },
  { id: "ca4", caseId: "2", name: "John Baker", role: "Clerk", accessLevel: "Full", dateAdded: "2024-08-10" },
  { id: "ca5", caseId: "2", name: "Lisa Park", role: "Secretary", accessLevel: "Full", dateAdded: "2024-08-10" },
];

export const statusHistory: StatusEntry[] = [
  { id: "s1", caseId: "1", status: "Active", date: "2024-06-20", changedBy: "Amanda Singh" },
  { id: "s2", caseId: "3", status: "Active", date: "2023-02-28", changedBy: "Amanda Singh" },
  { id: "s3", caseId: "3", status: "Litigation", date: "2024-12-01", changedBy: "Amanda Singh" },
  { id: "s4", caseId: "5", status: "Active", date: "2023-05-15", changedBy: "Amanda Singh" },
  { id: "s5", caseId: "5", status: "Settled", date: "2025-01-10", changedBy: "Amanda Singh" },
];

export const settlementData: Record<string, { finalSettlement: number; ourFee: number; rehabOutstanding: number; assessmentOutstanding: number; outstanding3: number; outstanding4: number; hst: number; ourFeeHst: number; payToClient: number; ourFinalAccount: number }> = {
  "1": { finalSettlement: 0, ourFee: 0, rehabOutstanding: 2500, assessmentOutstanding: 1800, outstanding3: 0, outstanding4: 0, hst: 0, ourFeeHst: 0, payToClient: 0, ourFinalAccount: 0 },
  "5": { finalSettlement: 85000, ourFee: 25500, rehabOutstanding: 3200, assessmentOutstanding: 1500, outstanding3: 800, outstanding4: 0, hst: 11050, ourFeeHst: 3315, payToClient: 53950, ourFinalAccount: 28815 },
};

export function getCaseById(id: string): CaseRecord | undefined {
  return cases.find((c) => c.id === id);
}

export function getNotesByCaseId(caseId: string): Note[] {
  return notes.filter((n) => n.caseId === caseId);
}

export function getActivitiesByCaseId(caseId: string): Activity[] {
  return activities.filter((a) => a.caseId === caseId);
}

export function getDocumentsByCaseId(caseId: string): CaseDocument[] {
  return caseDocuments.filter((d) => d.caseId === caseId);
}

export function getHistoryByCaseId(caseId: string): HistoryEntry[] {
  return historyEntries.filter((h) => h.caseId === caseId);
}

export function getContactAccessByCaseId(caseId: string): ContactAccess[] {
  return contactAccess.filter((ca) => ca.caseId === caseId);
}

export function getStatusHistoryByCaseId(caseId: string): StatusEntry[] {
  return statusHistory.filter((s) => s.caseId === caseId);
}

export function getSettlementByCaseId(caseId: string) {
  return settlementData[caseId] || { finalSettlement: 0, ourFee: 0, rehabOutstanding: 0, assessmentOutstanding: 0, outstanding3: 0, outstanding4: 0, hst: 0, ourFeeHst: 0, payToClient: 0, ourFinalAccount: 0 };
}
