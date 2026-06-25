import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDate, daysUntil } from "@/lib/formatters";
import { Phone, Edit, X, Save, Upload } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

// ── Tab components ────────────────────────────────────────────────────────────
import NotesTab from "@/components/case-tabs/NotesTab";
import DocumentsTab from "@/components/case-tabs/DocumentsTab";
import InitialInterviewTab from "@/components/case-tabs/InitialInterviewTab";
import AccidentDetailsSection from "@/components/case-tabs/AccidentDetailsSection";
import HistoryTab from "@/components/case-tabs/HistoryTab";
import ActivitiesTab from "@/components/case-tabs/ActivitiesTab";
import NoFaultTab from "@/components/case-tabs/NoFaultTab";
import ThirdPartyTab from "@/components/case-tabs/ThirdPartyTab";
import ClientInfoTab from "@/components/case-tabs/ClientInfoTab";
import EmploymentTab from "@/components/case-tabs/EmploymentTab";
import PoliceInfoTab from "@/components/case-tabs/PoliceInfoTab";
import LawyersTab from "@/components/case-tabs/LawyersTab";
import MedicalTab from "@/components/case-tabs/MedicalTab";
import SpecialistTab from "@/components/case-tabs/SpecialistTab";
import SettlementTab from "@/components/case-tabs/SettlementTab";
import ContactAccessTab from "@/components/case-tabs/ContactAccessTab";
import StatusTab from "@/components/case-tabs/StatusTab";
import OcfFormsTab from "@/components/case-tabs/OcfFormsTab";

const TABS = [
  { id: "notes", label: "Notes" },
  { id: "documents", label: "Documents" },
  { id: "initial-interview", label: "Initial Interview" },
  { id: "accident-details", label: "Accident Details" },
  { id: "history", label: "History" },
  { id: "activities", label: "Activities" },
  { id: "no-fault", label: "No Fault" },
  { id: "third-party", label: "Third Party" },
  { id: "client-info", label: "Client Info" },
  { id: "employment", label: "Employment" },
  { id: "police-info", label: "Police Info" },
  { id: "lawyers", label: "Lawyers" },
  { id: "medical", label: "Medical" },
  { id: "specialist", label: "Specialist / Assessment" },
  { id: "settlement", label: "Settlement Proposal" },
  { id: "contact-access", label: "Contact Access" },
  { id: "status", label: "Status" },
  { id: "ocf-forms", label: "OCF Forms" },
];

const FILE_STATUSES = ["Active", "Closed", "Pending", "On Hold", "Settled", "Litigation", "Mediation", "Arbitration"];
const CASE_TYPES = ["Motor Vehicle Accident (MVA)", "Slip and Fall", "Traffic Accident", "Immigration"];
const MEDIATION_STATUSES = ["N/A", "Pending", "Scheduled", "Completed", "Cancelled"];
const ARBITRATION_STATUSES = ["N/A", "Pending", "Scheduled", "Completed", "Cancelled"];
const PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];

const statusColor: Record<string, string> = {
  Active: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
  Pending: "bg-warning text-warning-foreground",
  "On Hold": "bg-muted text-muted-foreground",
  Settled: "bg-primary text-primary-foreground",
  Litigation: "bg-destructive text-destructive-foreground",
  Mediation: "bg-warning text-warning-foreground",
  Arbitration: "bg-destructive text-destructive-foreground",
};

// ── Signature Pad ─────────────────────────────────────────────────────────────
function SignaturePad({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [value]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  }, [drawing]);

  const stopDraw = useCallback(() => setDrawing(false), []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange("");
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="border-2 border-primary/30 rounded-md cursor-crosshair bg-background touch-none w-full"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear}>Clear</Button>
        <Button type="button" size="sm" onClick={save} disabled={!hasSignature}>Save Signature</Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CaseDetail() {
  const { caseId, tab } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const activeTab = tab || "notes";

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [referrers, setReferrers] = useState<any[]>([]);

  // Edit form state — matches ALL fields visible in screenshot
  const [form, setForm] = useState({
    // File Information
    fileStatus: "", caseType: "", dateOfLoss: "", openDate: "",
    // Assignment
    referredById: "", clerkAssigned: "", secretary: "",
    // Legal Tracking
    limitationDate: "", mediationStatus: "N/A", arbitrationStatus: "N/A", mvaClientFault: "No",
    // Third Party
    thirdPartyLawyer: "", tortFileNo: "",
    // Client Address
    clientStreet: "", clientCity: "", clientState: "", clientZip: "", clientCountry: "Canada",
    // Mobile
    clientMobile: "",
    // Client Identification
    clientInitials: "",
    // Signature
    clientSignatureUrl: "",
    // Client record (name/phones)
    firstName: "", lastName: "", homePhone: "", cellPhone: "", workPhone: "", email: "",
  });

  const token = localStorage.getItem("crm_token");

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/cases/${caseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setCaseData(data);
        setForm({
          fileStatus: data.fileStatus || "",
          caseType: data.caseType || "",
          dateOfLoss: data.dateOfLoss ? data.dateOfLoss.split("T")[0] : "",
          openDate: data.openDate ? data.openDate.split("T")[0] : "",
          referredById: data.referredById || "",
          clerkAssigned: data.clerkAssigned || "",
          secretary: data.secretary || "",
          limitationDate: data.limitationDate ? data.limitationDate.split("T")[0] : "",
          mediationStatus: data.mediationStatus || "N/A",
          arbitrationStatus: data.arbitrationStatus || "N/A",
          mvaClientFault: data.mvaClientFault || "No",
          thirdPartyLawyer: data.thirdPartyLawyer || "",
          tortFileNo: data.tortFileNo || "",
          clientStreet: data.clientStreet || "",
          clientCity: data.clientCity || "",
          clientState: data.clientState || "",
          clientZip: data.clientZip || "",
          clientCountry: data.clientCountry || "Canada",
          clientMobile: data.clientMobile || "",
          clientInitials: data.clientInitials || "",
          clientSignatureUrl: data.clientSignatureUrl || "",
          firstName: data.client?.firstName || "",
          lastName: data.client?.lastName || "",
          homePhone: data.client?.homePhone || "",
          cellPhone: data.client?.cellPhone || "",
          workPhone: data.client?.workPhone || "",
          email: data.client?.email || "",
        });
      })
      .catch(() => toast({ title: "Error loading case", variant: "destructive" }))
      .finally(() => setLoading(false));

    fetch(`${API_BASE_URL}/referrers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setReferrers)
      .catch(() => {});
  }, [caseId]);

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update case
      const caseRes = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fileStatus: form.fileStatus, caseType: form.caseType,
          dateOfLoss: form.dateOfLoss || null, openDate: form.openDate || null,
          referredById: form.referredById || null,
          clerkAssigned: form.clerkAssigned, secretary: form.secretary,
          limitationDate: form.limitationDate || null,
          mediationStatus: form.mediationStatus, arbitrationStatus: form.arbitrationStatus,
          mvaClientFault: form.mvaClientFault,
          thirdPartyLawyer: form.thirdPartyLawyer, tortFileNo: form.tortFileNo,
          clientStreet: form.clientStreet, clientCity: form.clientCity,
          clientState: form.clientState, clientZip: form.clientZip,
          clientCountry: form.clientCountry, clientMobile: form.clientMobile,
          clientInitials: form.clientInitials, clientSignatureUrl: form.clientSignatureUrl,
        }),
      });

      // Update client
      if (caseData?.clientId) {
        await fetch(`${API_BASE_URL}/clients/${caseData.clientId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            firstName: form.firstName, lastName: form.lastName,
            homePhone: form.homePhone, cellPhone: form.cellPhone,
            workPhone: form.workPhone, email: form.email,
            // preserve other client fields
            initial: caseData.client?.initial || "",
            address: caseData.client?.address || "",
            city: caseData.client?.city || "",
            province: caseData.client?.province || "",
            postCode: caseData.client?.postCode || "",
            dateOfBirth: caseData.client?.dateOfBirth || null,
            maritalStatus: caseData.client?.maritalStatus || "",
            dependants: caseData.client?.dependants || 0,
          }),
        });
      }

      const updated = await caseRes.json();
      setCaseData(updated);
      setEditOpen(false);
      toast({ title: "Case saved successfully" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Upload signature image
  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("clientSignatureUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  // Tab rendering
  const tabComponents: Record<string, JSX.Element> = {
    "notes": <NotesTab caseId={caseId!} />,
    "documents": <DocumentsTab caseId={caseId!} />,
    "initial-interview": <InitialInterviewTab caseId={caseId!} />,
    "accident-details": <AccidentDetailsSection caseId={caseId!} />,
    "history": <HistoryTab caseId={caseId!} />,
    "activities": <ActivitiesTab caseId={caseId!} />,
    "no-fault": <NoFaultTab caseId={caseId!} />,
    "third-party": <ThirdPartyTab caseId={caseId!} />,
    "client-info": <ClientInfoTab caseId={caseId!} />,
    "employment": <EmploymentTab caseId={caseId!} />,
    "police-info": <PoliceInfoTab caseId={caseId!} />,
    "lawyers": <LawyersTab caseId={caseId!} />,
    "medical": <MedicalTab caseId={caseId!} />,
    "specialist": <SpecialistTab caseId={caseId!} />,
    "settlement": <SettlementTab caseId={caseId!} />,
    "contact-access": <ContactAccessTab caseId={caseId!} />,
    "status": <StatusTab caseId={caseId!} />,
    "ocf-forms": <OcfFormsTab caseId={caseId!} />,
  };

  if (loading) {
    return (
      <AppLayout title="Case Detail">
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading case…</div>
      </AppLayout>
    );
  }

  if (!caseData) {
    return (
      <AppLayout title="Case Not Found">
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">Case not found.</p>
          <Button asChild variant="outline"><Link to="/cases">← Back to Cases</Link></Button>
        </div>
      </AppLayout>
    );
  }

  const limDays = caseData.limitationDate ? daysUntil(caseData.limitationDate) : null;
  const limColor = limDays !== null
    ? limDays < 0 ? "text-muted-foreground" : limDays <= 7 ? "text-destructive font-semibold" : limDays <= 30 ? "text-orange-500" : ""
    : "";
  const clientName = `${caseData.client?.firstName || ""} ${caseData.client?.lastName || ""}`.trim();

  return (
    <AppLayout title={`Case: ${caseData.fileNo}`}>
      {/* ── Case Header ── */}
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-xl font-bold">{caseData.fileNo}</h1>
              <Badge className={cn("text-xs", statusColor[caseData.fileStatus])}>{caseData.fileStatus}</Badge>
              {caseData.clientInitials && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{caseData.clientInitials}</span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm">
              <div><span className="text-muted-foreground">Client: </span><span className="font-medium">{clientName}</span></div>
              <div><span className="text-muted-foreground">DOL: </span>{formatDate(caseData.dateOfLoss)}</div>
              <div>
                <span className="text-muted-foreground">Limitation: </span>
                <span className={limColor}>{formatDate(caseData.limitationDate)}</span>
              </div>
              <div><span className="text-muted-foreground">Type: </span>{caseData.caseType}</div>
              <div><span className="text-muted-foreground">Clerk: </span>{caseData.clerkAssigned || "—"}</div>
              <div><span className="text-muted-foreground">Secretary: </span>{caseData.secretary || "—"}</div>
              <div><span className="text-muted-foreground">Referred By: </span>{caseData.referredBy || "—"}</div>
              {caseData.clientMobile && (
                <div>
                  <a href={`tel:${caseData.clientMobile}`} className="text-primary flex items-center gap-1 hover:underline">
                    <Phone className="h-3 w-3" />{caseData.clientMobile}
                  </a>
                </div>
              )}
              {caseData.clientStreet && (
                <div className="col-span-2 text-muted-foreground text-xs">
                  {caseData.clientStreet}{caseData.clientCity ? `, ${caseData.clientCity}` : ""}
                  {caseData.clientState ? `, ${caseData.clientState}` : ""}
                  {caseData.clientZip ? ` ${caseData.clientZip}` : ""}
                </div>
              )}
            </div>
          </div>
          <Button size="sm" onClick={() => setEditOpen(true)} className="shrink-0">
            <Edit className="h-4 w-4 mr-1" />Edit Case
          </Button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="border-b mb-4 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => navigate(`/cases/${caseId}/${t.id}`)}
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors",
                activeTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div>{tabComponents[activeTab] ?? <div className="text-muted-foreground p-4">Tab not found.</div>}</div>

      {/* ── Edit Case Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Case Details</DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
                  <X className="h-4 w-4 mr-1" />Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />{saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* File Information */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">File Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">File No</Label>
                  <Input value={caseData.fileNo} readOnly className="bg-muted text-xs h-8" />
                </div>
                <div>
                  <Label className="text-xs">File Status</Label>
                  <Select value={form.fileStatus} onValueChange={v => set("fileStatus", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{FILE_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date of Loss</Label>
                  <Input type="date" value={form.dateOfLoss} onChange={e => set("dateOfLoss", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Open Date</Label>
                  <Input type="date" value={form.openDate} onChange={e => set("openDate", e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            </section>

            {/* Assignment */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Referred By</Label>
                  <Select value={form.referredById} onValueChange={v => set("referredById", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select referrer…" /></SelectTrigger>
                    <SelectContent>
                      {referrers.map((r: any) => (
                        <SelectItem key={r.id} value={r.id} className="text-xs">{r.name} ({r.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Clerk Assigned</Label>
                  <Input value={form.clerkAssigned} onChange={e => set("clerkAssigned", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Secretary</Label>
                  <Input value={form.secretary} onChange={e => set("secretary", e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            </section>

            {/* Legal Tracking */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">Legal Tracking</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Limitation Date</Label>
                  <Input type="date" value={form.limitationDate} onChange={e => set("limitationDate", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Mediation Status</Label>
                  <Select value={form.mediationStatus} onValueChange={v => set("mediationStatus", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{MEDIATION_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Arbitration Status</Label>
                  <Select value={form.arbitrationStatus} onValueChange={v => set("arbitrationStatus", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{ARBITRATION_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">MVA Client Fault?</Label>
                  <Select value={form.mvaClientFault} onValueChange={v => set("mvaClientFault", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No" className="text-xs">No</SelectItem>
                      <SelectItem value="Yes" className="text-xs">Yes</SelectItem>
                      <SelectItem value="Partial" className="text-xs">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Third Party Lawyer</Label>
                  <Input value={form.thirdPartyLawyer} onChange={e => set("thirdPartyLawyer", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Tort File No</Label>
                  <Input value={form.tortFileNo} onChange={e => set("tortFileNo", e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            </section>

            {/* Client Address */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">Client Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs">Street Address</Label>
                  <Input value={form.clientStreet} onChange={e => set("clientStreet", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">City</Label>
                  <Input value={form.clientCity} onChange={e => set("clientCity", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">State/Province</Label>
                  <Select value={form.clientState} onValueChange={v => set("clientState", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Province…" /></SelectTrigger>
                    <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">ZIP/Postal Code</Label>
                  <Input value={form.clientZip} onChange={e => set("clientZip", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Country</Label>
                  <Input value={form.clientCountry} onChange={e => set("clientCountry", e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            </section>

            {/* Mobile Number */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">Mobile Number</h3>
              <div className="max-w-xs">
                <Label className="text-xs">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={form.clientMobile} onChange={e => set("clientMobile", e.target.value)} className="h-8 text-xs pl-8" placeholder="+14165559876" />
                </div>
              </div>
            </section>

            {/* Client Identification */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">Client Identification</h3>
              <div className="max-w-xs">
                <Label className="text-xs">Client Initials (2-3 chars)</Label>
                <Input
                  value={form.clientInitials}
                  onChange={e => set("clientInitials", e.target.value.toUpperCase().slice(0, 3))}
                  maxLength={3}
                  className="h-8 text-xs w-24"
                  placeholder="JM"
                />
              </div>
            </section>

            {/* Client Digital Signature */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">Client Digital Signature</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs mb-2 block">Draw Signature</Label>
                  <SignaturePad value={form.clientSignatureUrl} onChange={url => set("clientSignatureUrl", url)} />
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Or Upload Signature Image</Label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Choose file</span>
                    <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</span>
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleSigUpload} />
                  </label>
                  {form.clientSignatureUrl && (
                    <img src={form.clientSignatureUrl} alt="Signature" className="mt-2 max-h-20 border rounded" />
                  )}
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}