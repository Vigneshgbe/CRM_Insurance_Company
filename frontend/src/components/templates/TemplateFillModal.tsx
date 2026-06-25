import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Download, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

interface TemplateFillModalProps {
  templateId: string;
  templateName: string;
  caseId?: string;
  onClose: () => void;
}

function getTemplateFields(templateId: string) {
  if (templateId === "ocf-6") return [
    { key: "lastName", label: "Last Name" }, { key: "firstName", label: "First Name" },
    { key: "dateOfBirth", label: "Date of Birth" }, { key: "address", label: "Address" },
    { key: "city", label: "City" }, { key: "province", label: "Province" },
    { key: "postalCode", label: "Postal Code" }, { key: "homeTelephone", label: "Home Telephone" },
    { key: "cellPhone", label: "Cell Phone" }, { key: "claimNumber", label: "Claim Number" },
    { key: "dateOfAccident", label: "Date of Accident" }, { key: "fileNo", label: "File No." },
  ];
  if (templateId === "ocf-10") return [
    { key: "lastName", label: "Last Name" }, { key: "firstName", label: "First Name" },
    { key: "dateOfBirth", label: "Date of Birth" }, { key: "address", label: "Address" },
    { key: "claimNumber", label: "Claim Number" }, { key: "dateOfAccident", label: "Date of Accident" },
    { key: "fileNo", label: "File No." }, { key: "benefitElection", label: "Benefit Election" },
  ];
  return [
    { key: "lastName", label: "Last Name" }, { key: "firstName", label: "First Name" },
    { key: "dateOfBirth", label: "Date of Birth" }, { key: "address", label: "Address" },
    { key: "city", label: "City" }, { key: "province", label: "Province" },
    { key: "postalCode", label: "Postal Code" }, { key: "homeTelephone", label: "Home Telephone" },
    { key: "cellPhone", label: "Cell Phone" }, { key: "email", label: "Email" },
    { key: "maritalStatus", label: "Marital Status" }, { key: "dependants", label: "Dependants" },
    { key: "dateOfAccident", label: "Date of Accident" }, { key: "fileNo", label: "File No." },
    { key: "referredBy", label: "Referred By" }, { key: "interviewedBy", label: "Interviewed By" },
  ];
}

export default function TemplateFillModal({ templateId, templateName, caseId, onClose }: TemplateFillModalProps) {
  const { toast } = useToast();
  const [allCases, setAllCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [expenses, setExpenses] = useState<{ date: string; description: string; amount: string }[]>([]);
  const isOcf6 = templateId === "ocf-6";
  const templateFields = getTemplateFields(templateId);

  useEffect(() => {
    fetch(`${API}/cases`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : []).then(setAllCases);
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    fetch(`${API}/cases/${selectedCaseId}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : null).then(c => {
        if (!c) return;
        const map: Record<string, string> = {
          lastName: c.client?.lastName || "", firstName: c.client?.firstName || "",
          address: c.client?.address || "", city: c.client?.city || "",
          province: c.client?.province || "", postalCode: c.client?.postCode || "",
          dateOfBirth: c.client?.dateOfBirth || "", homeTelephone: c.client?.homePhone || "",
          cellPhone: c.client?.cellPhone || "", email: c.client?.email || "",
          maritalStatus: c.client?.maritalStatus || "", dependants: String(c.client?.dependants || ""),
          dateOfAccident: c.dateOfLoss || "", fileNo: c.fileNo || "",
          referredBy: c.referredBy || "", interviewedBy: c.clerkAssigned || "",
        };
        const keys = new Set(Object.entries(map).filter(([,v]) => v).map(([k]) => k));
        setFields(prev => ({ ...prev, ...Object.fromEntries(Object.entries(map).filter(([,v]) => v)) }));
        setAutoFilled(keys);
      });
  }, [selectedCaseId]);

  function exportText() {
    const lines = [`${templateName}\n${"=".repeat(40)}`];
    templateFields.forEach(f => lines.push(`${f.label}: ${fields[f.key] || ""}`));
    if (isOcf6 && expenses.length) {
      lines.push("\nExpenses:");
      expenses.forEach((e, i) => lines.push(`  ${i + 1}. ${e.date} — ${e.description} — $${e.amount}`));
      lines.push(`\nTotal: $${expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toFixed(2)}`);
    }
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" })),
      download: `${templateName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}.txt`,
    });
    a.click();
    toast({ title: "Exported successfully" });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">{templateName}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="px-6 py-3 border-b bg-muted/30">
          <Label className="text-xs mb-1 block">Pre-fill from case</Label>
          <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
            <SelectTrigger className="h-9 text-sm w-80">
              <SelectValue placeholder="Select a case to auto-fill..." />
            </SelectTrigger>
            <SelectContent>
              {allCases.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.fileNo} — {c.client?.firstName} {c.client?.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          {templateFields.map(f => (
            <div key={f.key}>
              <div className="flex items-center gap-2 mb-1">
                <Label className="text-xs">{f.label}</Label>
                {autoFilled.has(f.key) && <Badge className="text-[10px] bg-yellow-100 text-yellow-800 border-yellow-300 h-4 px-1">auto</Badge>}
              </div>
              <Input value={fields[f.key] || ""} onChange={e => setFields(p => ({...p, [f.key]: e.target.value}))}
                className={cn("h-9 text-sm", autoFilled.has(f.key) && "border-yellow-300 bg-yellow-50")} />
            </div>
          ))}
        </div>
        {isOcf6 && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">Expense Items</Label>
              <Button size="sm" variant="outline" onClick={() => setExpenses(e => [...e, { date: "", description: "", amount: "" }])}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add
              </Button>
            </div>
            {expenses.map((exp, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_1fr_auto] gap-2 mb-2">
                <Input placeholder="Date" value={exp.date} onChange={e => setExpenses(p => p.map((x,j) => j===i?{...x,date:e.target.value}:x))} className="h-8 text-xs" />
                <Input placeholder="Description" value={exp.description} onChange={e => setExpenses(p => p.map((x,j) => j===i?{...x,description:e.target.value}:x))} className="h-8 text-xs" />
                <Input placeholder="Amount" value={exp.amount} onChange={e => setExpenses(p => p.map((x,j) => j===i?{...x,amount:e.target.value}:x))} className="h-8 text-xs" />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpenses(p => p.filter((_,j) => j!==i))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            {expenses.length > 0 && <p className="text-xs text-right text-muted-foreground">Total: ${expenses.reduce((s,e) => s+(parseFloat(e.amount)||0),0).toFixed(2)}</p>}
          </div>
        )}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={exportText}><Download className="h-4 w-4 mr-1" />Export</Button>
        </div>
      </div>
    </div>
  );
}