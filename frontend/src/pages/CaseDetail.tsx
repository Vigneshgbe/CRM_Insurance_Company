import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate, daysUntil } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Phone, ArrowLeft, Pencil, Save, X } from "lucide-react";

// Tab components
import NotesTab from "@/components/case-tabs/NotesTab";
import ActivitiesTab from "@/components/case-tabs/ActivitiesTab";
import HistoryTab from "@/components/case-tabs/HistoryTab";
import StatusTab from "@/components/case-tabs/StatusTab";
import InitialInterviewTab from "@/components/case-tabs/InitialInterviewTab";
import ClientInfoTab from "@/components/case-tabs/ClientInfoTab";
import NoFaultTab from "@/components/case-tabs/NoFaultTab";
import ThirdPartyTab from "@/components/case-tabs/ThirdPartyTab";
import EmploymentTab from "@/components/case-tabs/EmploymentTab";
import MedicalTab from "@/components/case-tabs/MedicalTab";
import PoliceInfoTab from "@/components/case-tabs/PoliceInfoTab";
import LawyersTab from "@/components/case-tabs/LawyersTab";
import SpecialistTab from "@/components/case-tabs/SpecialistTab";
import SettlementTab from "@/components/case-tabs/SettlementTab";
import ContactAccessTab from "@/components/case-tabs/ContactAccessTab";
import DocumentsTab from "@/components/case-tabs/DocumentsTab";
import OcfFormsTab from "@/components/case-tabs/OcfFormsTab";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

const FILE_STATUSES = ["Active","Closed","Pending","On Hold","Settled","Litigation","Mediation","Arbitration"];
const CASE_TYPES = ["Motor Vehicle Accident (MVA)","Slip and Fall","Traffic Accident","Immigration"];

const STATUS_COLOR: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-600",
  Pending: "bg-yellow-100 text-yellow-800",
  Settled: "bg-blue-100 text-blue-800",
  Litigation: "bg-red-100 text-red-800",
  Mediation: "bg-orange-100 text-orange-800",
  Arbitration: "bg-purple-100 text-purple-800",
  "On Hold": "bg-gray-100 text-gray-500",
};

const TABS = [
  { key: "notes", label: "Notes" },
  { key: "activities", label: "Activities" },
  { key: "history", label: "History" },
  { key: "status", label: "Status" },
  { key: "initial-interview", label: "Initial Interview" },
  { key: "client-info", label: "Client Info" },
  { key: "no-fault", label: "No Fault" },
  { key: "third-party", label: "Third Party" },
  { key: "employment", label: "Employment" },
  { key: "medical", label: "Medical" },
  { key: "police-info", label: "Police Info" },
  { key: "lawyers", label: "Lawyers" },
  { key: "specialist", label: "Specialist" },
  { key: "settlement", label: "Settlement" },
  { key: "contact-access", label: "Contact Access" },
  { key: "documents", label: "Documents" },
  { key: "ocf-forms", label: "OCF Forms" },
];

export default function CaseDetail() {
  const { caseId, tab } = useParams<{ caseId: string; tab?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const activeTab = tab || "notes";

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  async function loadCase() {
    try {
      const r = await fetch(`${API}/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!r.ok) throw new Error("Failed to load case");
      const data = await r.json();
      setCaseData(data);
    } catch (e) {
      toast({ title: "Failed to load case", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (caseId) loadCase(); }, [caseId]);

  function openEdit() {
    if (!caseData) return;
    setEditForm({
      fileStatus: caseData.fileStatus || "",
      caseType: caseData.caseType || "",
      dateOfLoss: caseData.dateOfLoss?.slice(0, 10) || "",
      openDate: caseData.openDate?.slice(0, 10) || "",
      limitationDate: caseData.limitationDate?.slice(0, 10) || "",
      clerkAssigned: caseData.clerkAssigned || "",
      secretary: caseData.secretary || "",
      referredBy: caseData.referredBy || "",
      mediationStatus: caseData.mediationStatus || "",
      arbitrationStatus: caseData.arbitrationStatus || "",
      mvaClientFault: caseData.mvaClientFault || "No",
      thirdPartyLawyer: caseData.thirdPartyLawyer || "",
      tortFileNo: caseData.tortFileNo || "",
      clientMobile: caseData.clientMobile || "",
      // Client fields
      firstName: caseData.client?.firstName || "",
      lastName: caseData.client?.lastName || "",
      homePhone: caseData.client?.homePhone || "",
      cellPhone: caseData.client?.cellPhone || "",
      email: caseData.client?.email || "",
      address: caseData.client?.address || "",
      city: caseData.client?.city || "",
      province: caseData.client?.province || "",
      postCode: caseData.client?.postCode || "",
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!caseData) return;
    setSaving(true);
    try {
      // Update case
      const r = await fetch(`${API}/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          fileStatus: editForm.fileStatus,
          caseType: editForm.caseType,
          dateOfLoss: editForm.dateOfLoss,
          openDate: editForm.openDate,
          limitationDate: editForm.limitationDate,
          clerkAssigned: editForm.clerkAssigned,
          secretary: editForm.secretary,
          referredBy: editForm.referredBy,
          mediationStatus: editForm.mediationStatus,
          arbitrationStatus: editForm.arbitrationStatus,
          mvaClientFault: editForm.mvaClientFault,
          thirdPartyLawyer: editForm.thirdPartyLawyer,
          tortFileNo: editForm.tortFileNo,
          clientMobile: editForm.clientMobile,
        }),
      });
      if (!r.ok) throw new Error();

      // Update client
      if (caseData.clientId) {
        await fetch(`${API}/clients/${caseData.clientId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
          body: JSON.stringify({
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            homePhone: editForm.homePhone,
            cellPhone: editForm.cellPhone,
            email: editForm.email,
            address: editForm.address,
            city: editForm.city,
            province: editForm.province,
            postCode: editForm.postCode,
          }),
        });
      }

      toast({ title: "Case updated successfully" });
      setEditOpen(false);
      loadCase(); // Reload fresh data
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function setField(k: string, v: string) {
    setEditForm((f: any) => ({ ...f, [k]: v }));
  }

  const limDays = caseData?.limitationDate ? daysUntil(caseData.limitationDate) : null;

  function renderTab() {
    if (!caseId) return null;
    const props = { caseId };
    switch (activeTab) {
      case "notes": return <NotesTab {...props} />;
      case "activities": return <ActivitiesTab {...props} />;
      case "history": return <HistoryTab {...props} />;
      case "status": return <StatusTab {...props} caseData={caseData} />;
      case "initial-interview": return <InitialInterviewTab {...props} />;
      case "client-info": return <ClientInfoTab {...props} />;
      case "no-fault": return <NoFaultTab {...props} />;
      case "third-party": return <ThirdPartyTab {...props} />;
      case "employment": return <EmploymentTab {...props} />;
      case "medical": return <MedicalTab {...props} />;
      case "police-info": return <PoliceInfoTab {...props} />;
      case "lawyers": return <LawyersTab {...props} />;
      case "specialist": return <SpecialistTab {...props} />;
      case "settlement": return <SettlementTab {...props} />;
      case "contact-access": return <ContactAccessTab {...props} />;
      case "documents": return <DocumentsTab {...props} />;
      case "ocf-forms": return <OcfFormsTab {...props} />;
      default: return <NotesTab {...props} />;
    }
  }

  if (loading) {
    return (
      <AppLayout title="Case Detail">
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading case...</div>
      </AppLayout>
    );
  }

  if (!caseData) {
    return (
      <AppLayout title="Case Detail">
        <div className="flex items-center justify-center py-20 text-destructive text-sm">Case not found.</div>
      </AppLayout>
    );
  }

  const clientName = `${caseData.client?.firstName || ""} ${caseData.client?.lastName || ""}`.trim();

  return (
    <AppLayout title={clientName || "Case Detail"}>
      {/* Back + Edit row */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Clients
        </Button>
        <Button size="sm" onClick={openEdit}>
          <Pencil className="h-4 w-4 mr-1" />Edit Case
        </Button>
      </div>

      {/* Case header card */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{clientName}</h2>
              <Badge className={cn("text-xs", STATUS_COLOR[caseData.fileStatus] || "bg-gray-100")}>
                {caseData.fileStatus}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground mt-1">
              <span>File No: <span className="text-primary font-medium">{caseData.fileNo}</span></span>
              <span>Date of Loss: <span className="text-foreground">{formatDate(caseData.dateOfLoss)}</span></span>
              {caseData.limitationDate && (
                <span>
                  Limitation:{" "}
                  <span className={cn(
                    "font-medium",
                    limDays !== null && limDays <= 0 ? "text-destructive" :
                    limDays !== null && limDays <= 15 ? "text-destructive font-bold" :
                    limDays !== null && limDays <= 30 ? "text-orange-500" : "text-foreground"
                  )}>
                    {formatDate(caseData.limitationDate)}
                    {limDays !== null && limDays >= 0 && ` (${limDays}d)`}
                  </span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground mt-1">
              {caseData.clerkAssigned && <span>Clerk: <span className="text-foreground">{caseData.clerkAssigned}</span></span>}
              {caseData.secretary && <span>Secretary: <span className="text-foreground">{caseData.secretary}</span></span>}
              {caseData.referredBy && <span>Referred By: <span className="text-foreground">{caseData.referredBy}</span></span>}
            </div>
          </div>
          {/* Phone */}
          {(caseData.clientMobile || caseData.client?.cellPhone || caseData.client?.homePhone) && (
            <a
              href={`tel:${caseData.clientMobile || caseData.client?.cellPhone || caseData.client?.homePhone}`}
              className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
            >
              <Phone className="h-4 w-4" />
              {caseData.clientMobile || caseData.client?.cellPhone || caseData.client?.homePhone}
            </a>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b mb-0 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(t => (
            <Link
              key={t.key}
              to={`/cases/${caseId}/${t.key}`}
              className={cn(
                "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-white border border-t-0 rounded-b-lg min-h-[400px]">
        {renderTab()}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Case — {caseData.fileNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            {/* Client section */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Client Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">First Name</Label><Input value={editForm.firstName} onChange={e => setField("firstName", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Last Name</Label><Input value={editForm.lastName} onChange={e => setField("lastName", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Home Phone</Label><Input value={editForm.homePhone} onChange={e => setField("homePhone", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Cell Phone</Label><Input value={editForm.cellPhone} onChange={e => setField("cellPhone", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Email</Label><Input value={editForm.email} onChange={e => setField("email", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Address</Label><Input value={editForm.address} onChange={e => setField("address", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">City</Label><Input value={editForm.city} onChange={e => setField("city", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Postal Code</Label><Input value={editForm.postCode} onChange={e => setField("postCode", e.target.value)} className="mt-1 h-9" /></div>
              </div>
            </div>

            {/* Case section */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Case Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">File Status</Label>
                  <Select value={editForm.fileStatus} onValueChange={v => setField("fileStatus", v)}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{FILE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Case Type</Label>
                  <Select value={editForm.caseType} onValueChange={v => setField("caseType", v)}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{CASE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Date of Loss</Label><Input type="date" value={editForm.dateOfLoss} onChange={e => setField("dateOfLoss", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Open Date</Label><Input type="date" value={editForm.openDate} onChange={e => setField("openDate", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Limitation Date</Label><Input type="date" value={editForm.limitationDate} onChange={e => setField("limitationDate", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Client Mobile</Label><Input value={editForm.clientMobile} onChange={e => setField("clientMobile", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Clerk Assigned</Label><Input value={editForm.clerkAssigned} onChange={e => setField("clerkAssigned", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Secretary</Label><Input value={editForm.secretary} onChange={e => setField("secretary", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Referred By</Label><Input value={editForm.referredBy} onChange={e => setField("referredBy", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Third Party Lawyer</Label><Input value={editForm.thirdPartyLawyer} onChange={e => setField("thirdPartyLawyer", e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Tort File No</Label><Input value={editForm.tortFileNo} onChange={e => setField("tortFileNo", e.target.value)} className="mt-1 h-9" /></div>
                <div>
                  <Label className="text-xs">MVA Client Fault</Label>
                  <Select value={editForm.mvaClientFault} onValueChange={v => setField("mvaClientFault", v)}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                <X className="h-4 w-4 mr-1" />Cancel
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}