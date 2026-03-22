import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cases, getCaseById } from "@/data/mockData";
import { X, Download, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  templateId: string;
  templateName: string;
  caseId?: string;
  onClose: () => void;
}

interface FieldDef {
  group: string;
  fields: { name: string; label: string; type?: string; readOnly?: boolean; options?: string[] }[];
}

function getTemplateFields(templateId: string): FieldDef[] {
  if (templateId === "ocf-6") return [
    { group: "Claim Information", fields: [
      { name: "claimNumber", label: "Claim Number" },
      { name: "policyNumber", label: "Policy Number" },
      { name: "dateOfAccident", label: "Date of Accident", type: "date" },
    ]},
    { group: "Applicant Information", fields: [
      { name: "lastName", label: "Last Name" },
      { name: "firstNameInitial", label: "First Name and Initial" },
      { name: "gender", label: "Gender", type: "radio", options: ["Male", "Female"] },
      { name: "address", label: "Address" },
      { name: "city", label: "City" },
      { name: "province", label: "Province" },
      { name: "postalCode", label: "Postal Code" },
      { name: "birthDate", label: "Birth Date", type: "date" },
      { name: "homeTelephone", label: "Home Telephone" },
      { name: "workTelephone", label: "Work Telephone" },
      { name: "extension", label: "Extension" },
    ]},
  ];
  if (templateId === "ocf-10") return [
    { group: "Claim Information", fields: [
      { name: "claimNumber", label: "Claim Number" },
      { name: "policyNumber", label: "Policy Number" },
      { name: "dateOfAccident", label: "Date of Accident", type: "date" },
    ]},
    { group: "Applicant Information", fields: [
      { name: "lastName", label: "Last Name" },
      { name: "firstNameInitial", label: "First Name and Initial" },
      { name: "gender", label: "Gender", type: "radio", options: ["Male", "Female"] },
      { name: "address", label: "Address" },
      { name: "city", label: "City" },
      { name: "province", label: "Province" },
      { name: "postalCode", label: "Postal Code" },
      { name: "birthDate", label: "Birth Date", type: "date" },
      { name: "homeTelephone", label: "Home Telephone" },
      { name: "workTelephone", label: "Work Telephone" },
      { name: "extension", label: "Extension" },
    ]},
    { group: "Benefit Election", fields: [
      { name: "benefitElection", label: "Benefit Election", type: "radio", options: ["Income Replacement Benefit", "Non-Earner Benefit", "Caregiver Benefit"] },
    ]},
    { group: "Signature", fields: [
      { name: "applicantName", label: "Name of Applicant" },
      { name: "signatureDate", label: "Date", type: "date" },
    ]},
  ];
  if (templateId === "matrix-intake") return [
    { group: "File Information", fields: [
      { name: "fileNo", label: "File No" },
      { name: "dateOfMva", label: "Date of MVA", type: "date" },
      { name: "conflictChecked", label: "Conflict Checked", type: "radio", options: ["Yes", "No"] },
      { name: "anyConflict", label: "Any Conflict Find", type: "radio", options: ["Yes", "No"] },
      { name: "interviewedBy", label: "Client Interviewed By" },
      { name: "interviewedOn", label: "Client Interviewed On", type: "date" },
      { name: "referredBy", label: "Client Referred By" },
    ]},
    { group: "Personal Data", fields: [
      { name: "lastName", label: "Last Name" },
      { name: "firstName", label: "First Name" },
      { name: "initial", label: "Initial" },
      { name: "address", label: "Address" },
      { name: "city", label: "City" },
      { name: "province", label: "Province" },
      { name: "postalCode", label: "Post Code" },
      { name: "dateOfBirth", label: "Date of Birth", type: "date" },
      { name: "dependants", label: "Number of Dependants" },
      { name: "homePhone", label: "Home Phone" },
      { name: "cellPhone", label: "Cell Phone" },
      { name: "workPhone", label: "Work Phone" },
      { name: "email", label: "Email" },
      { name: "maritalStatus", label: "Marital Status" },
    ]},
    { group: "Identification", fields: [
      { name: "driversLicense", label: "Driver's License No" },
      { name: "healthCard", label: "Health Card No" },
      { name: "sin", label: "SIN No" },
      { name: "prCitizen", label: "PR/Citizen Status" },
      { name: "idNumber", label: "ID Number" },
    ]},
    { group: "Accident Information", fields: [
      { name: "clientRole", label: "Client Role", type: "radio", options: ["Driver", "Passenger", "Pedestrian"] },
      { name: "seatBelted", label: "Seat Belted", type: "radio", options: ["Yes", "No"] },
      { name: "accidentAtWork", label: "Accident at Work", type: "radio", options: ["Yes", "No"] },
      { name: "streetName", label: "Street Name" },
      { name: "intersection", label: "Intersection" },
      { name: "accCity", label: "City" },
      { name: "accProvince", label: "Province" },
      { name: "timeOfMva", label: "Time of MVA" },
      { name: "policeReported", label: "Police Reported", type: "radio", options: ["Yes", "No"] },
      { name: "incidentNo", label: "Incident No" },
      { name: "officer", label: "Officer" },
      { name: "badgeNo", label: "Badge No" },
    ]},
    { group: "Insurance", fields: [
      { name: "insuranceCo", label: "Insurance Company Name" },
      { name: "insPolicyNo", label: "Policy No" },
      { name: "insClaimNo", label: "Claim No" },
      { name: "adjuster", label: "Adjuster" },
      { name: "adjPhone", label: "Phone" },
      { name: "adjFax", label: "Fax" },
      { name: "autoMake", label: "Automobile Make" },
      { name: "autoModel", label: "Model" },
      { name: "autoYear", label: "Year" },
      { name: "plateNo", label: "Plate No" },
    ]},
    { group: "Medical", fields: [
      { name: "hospitalName", label: "Hospital Name" },
      { name: "admissionDate", label: "Admission Date", type: "date" },
      { name: "dischargeDate", label: "Discharge Date", type: "date" },
      { name: "familyPhysician", label: "Family Physician" },
      { name: "physPhone", label: "Phone" },
      { name: "ambulanceRequired", label: "Ambulance Required", type: "radio", options: ["Yes", "No"] },
      { name: "xrayTaken", label: "X-Ray Taken", type: "radio", options: ["Yes", "No"] },
    ]},
  ];
  // Custom template fallback
  return [
    { group: "Template Fields", fields: [
      { name: "field1", label: "Field 1" },
      { name: "field2", label: "Field 2" },
      { name: "field3", label: "Field 3" },
      { name: "field4", label: "Field 4" },
      { name: "field5", label: "Field 5" },
    ]},
  ];
}

function prefillFromCase(templateId: string, caseData: ReturnType<typeof getCaseById>): Record<string, string> {
  if (!caseData) return {};
  const c = caseData.client;
  const base: Record<string, string> = {
    lastName: c.lastName,
    firstName: c.firstName,
    firstNameInitial: `${c.firstName} ${c.initial}`,
    initial: c.initial,
    address: c.address,
    city: c.city,
    province: c.province,
    postalCode: c.postCode,
    birthDate: c.dateOfBirth,
    dateOfBirth: c.dateOfBirth,
    homeTelephone: c.homePhone,
    homePhone: c.homePhone,
    workTelephone: c.workPhone,
    workPhone: c.workPhone,
    cellPhone: c.cellPhone,
    email: c.email,
    maritalStatus: c.maritalStatus,
    dependants: String(c.dependants),
    dateOfAccident: caseData.dateOfLoss,
    dateOfMva: caseData.dateOfLoss,
    fileNo: caseData.fileNo,
    referredBy: caseData.referredBy,
    interviewedBy: caseData.clerkAssigned,
  };
  return base;
}

export default function TemplateFillModal({ templateId, templateName, caseId, onClose }: Props) {
  const { toast } = useToast();
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [autoFilledKeys, setAutoFilledKeys] = useState<Set<string>>(new Set());
  const [expenses, setExpenses] = useState<{ date: string; description: string; amount: string }[]>([]);
  const [exporting, setExporting] = useState(false);

  const fields = useMemo(() => getTemplateFields(templateId), [templateId]);
  const isCustom = !["ocf-6", "ocf-10", "matrix-intake"].includes(templateId);

  const handleCaseSelect = (cId: string) => {
    setSelectedCaseId(cId);
    if (cId) {
      const cd = getCaseById(cId);
      const prefilled = prefillFromCase(templateId, cd);
      setValues((prev) => ({ ...prev, ...prefilled }));
      setAutoFilledKeys(new Set(Object.keys(prefilled)));
    }
  };

  // Auto-fill on mount if caseId provided
  useState(() => {
    if (caseId) handleCaseSelect(caseId);
  });

  const setValue = (name: string, val: string) => {
    setValues((prev) => ({ ...prev, [name]: val }));
    setAutoFilledKeys((prev) => { const n = new Set(prev); n.delete(name); return n; });
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const caseNo = selectedCaseId ? getCaseById(selectedCaseId)?.fileNo || "NO-CASE" : "NO-CASE";
      const date = new Date().toISOString().split("T")[0];
      const fileName = `${templateName.replace(/\s+/g, "_")}_${caseNo}_${date}.pdf`;
      const blob = new Blob([`PDF Export: ${templateName}\nCase: ${caseNo}\nDate: ${date}\n\nField Values:\n${JSON.stringify(values, null, 2)}`], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      setExporting(false);
      toast({ title: "PDF exported successfully!", description: "Download started." });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-4 gap-4 shrink-0">
        <h2 className="font-semibold text-sm truncate">{templateName}</h2>
        <div className="flex-1 flex justify-center">
          <Select value={selectedCaseId} onValueChange={handleCaseSelect}>
            <SelectTrigger className="w-80 h-9 text-sm"><SelectValue placeholder="Select case to pre-fill..." /></SelectTrigger>
            <SelectContent>
              {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.fileNo} — {c.client.firstName} {c.client.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 mr-1" />{exporting ? "Generating PDF..." : "Export PDF"}
        </Button>
        <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-[40%] border-r overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="font-semibold text-sm">Fill Template Fields</h3>
            <p className="text-xs text-muted-foreground">Select a case above to auto-fill, or enter manually</p>
          </div>
          {isCustom && <p className="text-xs text-muted-foreground italic border border-dashed rounded p-3">Custom field mapping coming soon</p>}
          {fields.map((group) => (
            <div key={group.group}>
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold mb-3">{group.group}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.fields.map((f) => {
                  const isFilled = autoFilledKeys.has(f.name);
                  return (
                    <div key={f.name} className={cn("relative", f.type === "radio" && group.fields.length <= 3 ? "col-span-2" : "")}>
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs">{f.label}</Label>
                        {isFilled && <Badge variant="outline" className="text-[10px] h-4 px-1 bg-yellow-50 border-yellow-300 text-yellow-700">auto-filled</Badge>}
                      </div>
                      {f.type === "radio" && f.options ? (
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          {f.options.map((opt) => (
                            <label key={opt} className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <input type="radio" name={f.name} value={opt} checked={values[f.name] === opt} onChange={() => setValue(f.name, opt)} className="accent-primary" />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <Input
                          type={f.type || "text"}
                          value={values[f.name] || ""}
                          onChange={(e) => setValue(f.name, e.target.value)}
                          readOnly={f.readOnly}
                          className={cn("h-8 text-xs mt-1", isFilled ? "bg-yellow-50 border-yellow-300" : "")}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Expenses section for OCF-6 */}
          {templateId === "ocf-6" && (
            <div>
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold mb-3">Expenses</div>
              {expenses.map((exp, i) => (
                <div key={i} className="grid grid-cols-[40px_100px_1fr_100px_32px] gap-2 mb-2 items-end">
                  <span className="text-xs text-muted-foreground pt-5">#{i + 1}</span>
                  <div><Label className="text-[10px]">Date</Label><Input type="date" value={exp.date} onChange={(e) => { const n = [...expenses]; n[i].date = e.target.value; setExpenses(n); }} className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Description</Label><Input value={exp.description} onChange={(e) => { const n = [...expenses]; n[i].description = e.target.value; setExpenses(n); }} className="h-7 text-xs" /></div>
                  <div><Label className="text-[10px]">Amount ($)</Label><Input type="number" value={exp.amount} onChange={(e) => { const n = [...expenses]; n[i].amount = e.target.value; setExpenses(n); }} className="h-7 text-xs" /></div>
                  <button onClick={() => setExpenses(expenses.filter((_, j) => j !== i))} className="h-7 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {expenses.length < 10 && (
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setExpenses([...expenses, { date: "", description: "", amount: "" }])}>
                  <Plus className="h-3 w-3 mr-1" /> Add Expense Item
                </Button>
              )}
              <div className="mt-3 p-2 bg-muted rounded flex justify-between">
                <span className="text-xs font-semibold">Total Amount</span>
                <span className="text-sm font-bold">${totalExpenses.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="hidden lg:flex flex-1 flex-col bg-muted/30 p-6 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-1">Preview</h3>
          <p className="text-xs text-muted-foreground mb-4">Preview updates as you fill fields</p>
          <div className="flex-1 flex items-start justify-center">
            <div className="bg-background border shadow-lg rounded w-full max-w-lg p-8 min-h-[600px]">
              <div className="text-center border-b pb-4 mb-6">
                <h4 className="font-bold text-sm">{templateName}</h4>
                <p className="text-[10px] text-muted-foreground mt-1">Ontario Automobile Insurance</p>
              </div>
              {fields.map((group) => (
                <div key={group.group} className="mb-5">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground border-b pb-1 mb-2">{group.group}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {group.fields.map((f) => (
                      <div key={f.name} className={cn(f.type === "radio" ? "col-span-2" : "")}>
                        <p className="text-[9px] text-muted-foreground">{f.label}</p>
                        <p className="text-xs font-medium border-b border-dashed min-h-[18px]">{values[f.name] || ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {templateId === "ocf-6" && expenses.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground border-b pb-1 mb-2">Expenses</p>
                  {expenses.map((exp, i) => (
                    <div key={i} className="grid grid-cols-[30px_1fr_80px] text-xs gap-1">
                      <span>{i + 1}.</span>
                      <span>{exp.description || "—"}</span>
                      <span className="text-right">${parseFloat(exp.amount || "0").toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t mt-1 pt-1 text-xs font-bold text-right">Total: ${totalExpenses.toFixed(2)}</div>
                </div>
              )}
              <p className="text-[9px] text-muted-foreground text-center mt-8">Actual PDF generated on export</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
