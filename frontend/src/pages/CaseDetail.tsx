import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, daysUntil, formatMobileNumber, getMobileTelUri, validateMobileNumber } from "@/lib/formatters";
import { FILE_STATUSES, PROVINCES, CASE_TYPES, API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Pencil, X, Save, Upload, Phone } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
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

function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

const TABS = [
  { key: "notes", label: "Notes" },
  { key: "documents", label: "Documents" },
  { key: "initial-interview", label: "Initial Interview" },
  { key: "accident-details", label: "Accident Details" },
  { key: "history", label: "History" },
  { key: "activities", label: "Activities" },
  { key: "no-fault", label: "No Fault" },
  { key: "third-party", label: "Third Party" },
  { key: "client-info", label: "Client Info" },
  { key: "employment", label: "Employment" },
  { key: "police-info", label: "Police Info" },
  { key: "lawyers", label: "Lawyers" },
  { key: "medical", label: "Medical" },
  { key: "specialist", label: "Specialist / Assessment" },
  { key: "settlement", label: "Settlement Proposal" },
  { key: "contact-access", label: "Contact Access" },
  { key: "status", label: "Status" },
  // { key: "ocf-forms", label: "OCF Forms" },
];

const statusColor: Record<string, string> = {
  Active: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
  Pending: "bg-warning text-warning-foreground",
  "On Hold": "bg-muted text-muted-foreground",
  Settled: "bg-primary text-primary-foreground",
  Litigation: "bg-destructive text-destructive-foreground",
};

const tabComponents: Record<string, React.FC<{ caseId: string }>> = {
  notes: NotesTab,
  documents: DocumentsTab,
  "initial-interview": InitialInterviewTab,
  "accident-details": AccidentDetailsSection,
  history: HistoryTab,
  activities: ActivitiesTab,
  "no-fault": NoFaultTab,
  "third-party": ThirdPartyTab,
  "client-info": ClientInfoTab,
  employment: EmploymentTab,
  "police-info": PoliceInfoTab,
  lawyers: LawyersTab,
  medical: MedicalTab,
  specialist: SpecialistTab,
  settlement: SettlementTab,
  "contact-access": ContactAccessTab,
  status: StatusTab,
  "ocf-forms": OcfFormsTab,
};

export default function CaseDetail() {
  const { caseId, tab } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const activeTab = tab || "notes";

  const [caseData, setCaseData] = useState<any>(null);
  const [referrers, setReferrers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [referrerSearch, setReferrerSearch] = useState("");
  const [mobileError, setMobileError] = useState("");

  const { register, handleSubmit, control, reset, setValue } = useForm({
    defaultValues: {
      fileNo: "", fileStatus: "Active", dateOfLoss: "", openDate: "",
      referredById: "", clerkAssigned: "", secretary: "",
      limitationDate: "", mediationStatus: "", arbitrationStatus: "",
      mvaClientFault: "No", thirdPartyLawyer: "", tortFileNo: "",
      benefitsClaiming: "No", irbNonEarnerDue: "No",
      clientInitials: "", clientStreet: "", clientCity: "",
      clientState: "", clientZip: "", clientCountry: "Canada", clientMobile: "",
      clientFirstName: "", clientLastName: "", clientEmail: "", caseType: "",
    },
  });

  // ── Load case + referrers in parallel ────────────────────────────────
  useEffect(() => {
    if (!caseId) return;
    const headers = { Authorization: `Bearer ${getToken()}` };

    Promise.all([
      fetch(`${API_BASE_URL}/cases/${caseId}`, { headers }).then((r) => r.ok ? r.json() : null),
      fetch(`${API_BASE_URL}/referrers`, { headers }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([cData, refs]) => {
        if (cData) {
          setCaseData(cData);
          setSignatureUrl(cData.clientSignatureUrl || "");
          reset({
            fileNo:            cData.fileNo            || "",
            fileStatus:        cData.fileStatus        || "Active",
            dateOfLoss:        cData.dateOfLoss        ? cData.dateOfLoss.split("T")[0]        : "",
            openDate:          cData.openDate          ? cData.openDate.split("T")[0]          : "",
            referredById:      cData.referredById      || "",
            clerkAssigned:     cData.clerkAssigned     || "",
            secretary:         cData.secretary         || "",
            limitationDate:    cData.limitationDate    ? cData.limitationDate.split("T")[0]    : "",
            mediationStatus:   cData.mediationStatus   || "",
            arbitrationStatus: cData.arbitrationStatus || "",
            mvaClientFault:    cData.mvaClientFault    || "No",
            thirdPartyLawyer:  cData.thirdPartyLawyer  || "",
            tortFileNo:        cData.tortFileNo        || "",
            benefitsClaiming:  cData.benefitsClaiming  || "No",
            irbNonEarnerDue:   cData.irbNonEarnerDue   || "No",
            clientInitials:    cData.clientInitials    || "",
            clientStreet:      cData.clientStreet      || "",
            clientCity:        cData.clientCity        || "",
            clientState:       cData.clientState       || "",
            clientZip:         cData.clientZip         || "",
            clientCountry:     cData.clientCountry     || "Canada",
            clientMobile:      cData.clientMobile      || "",
            clientFirstName:   cData.client?.firstName || "",
            clientLastName:    cData.client?.lastName  || "",
            clientEmail:       cData.client?.email     || "",
            caseType:          cData.caseType          || "",
          });
        }
        setReferrers(Array.isArray(refs) ? refs : []);
      })
      .catch(() => toast({ title: "Error loading case", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [caseId]);

  // ── Save case via real PUT ────────────────────────────────────
  const onSave = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...data, clientSignatureUrl: signatureUrl }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setCaseData(updated);
      toast({ title: "Case Updated", description: `${updated.fileNo} saved successfully.` });
      setEditing(false);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    if (caseData) {
      reset({
        fileNo:            caseData.fileNo            || "",
        fileStatus:        caseData.fileStatus        || "Active",
        dateOfLoss:        caseData.dateOfLoss        ? caseData.dateOfLoss.split("T")[0]        : "",
        openDate:          caseData.openDate          ? caseData.openDate.split("T")[0]          : "",
        referredById:      caseData.referredById      || "",
        clerkAssigned:     caseData.clerkAssigned     || "",
        secretary:         caseData.secretary         || "",
        limitationDate:    caseData.limitationDate    ? caseData.limitationDate.split("T")[0]    : "",
        mediationStatus:   caseData.mediationStatus   || "",
        arbitrationStatus: caseData.arbitrationStatus || "",
        mvaClientFault:    caseData.mvaClientFault    || "No",
        thirdPartyLawyer:  caseData.thirdPartyLawyer  || "",
        tortFileNo:        caseData.tortFileNo        || "",
        benefitsClaiming:  caseData.benefitsClaiming  || "No",
        irbNonEarnerDue:   caseData.irbNonEarnerDue   || "No",
        clientInitials:    caseData.clientInitials    || "",
        clientStreet:      caseData.clientStreet      || "",
        clientCity:        caseData.clientCity        || "",
        clientState:       caseData.clientState       || "",
        clientZip:         caseData.clientZip         || "",
        clientCountry:     caseData.clientCountry     || "Canada",
        clientMobile:      caseData.clientMobile      || "",
        clientFirstName:   caseData.client?.firstName || "",
        clientLastName:    caseData.client?.lastName  || "",
        clientEmail:       caseData.client?.email     || "",
        caseType:          caseData.caseType          || "",
      });
    }
    setEditing(false);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSignatureUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const filteredReferrers = referrers.filter((r) =>
    r.name?.toLowerCase().includes(referrerSearch.toLowerCase())
  );

  if (fetching) {
    return (
      <AppLayout title="Case Detail">
        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
          Loading case...
        </div>
      </AppLayout>
    );
  }

  if (!caseData) {
    return (
      <AppLayout title="Case Not Found">
        <p className="text-muted-foreground">Case not found.</p>
      </AppLayout>
    );
  }

  const limDays = caseData.limitationDate ? daysUntil(caseData.limitationDate) : null;
  const TabComponent = tabComponents[activeTab] || NotesTab;

  return (
    <AppLayout title={`Case: ${caseData.fileNo}`}>
      {/* Header Card */}
      <Card className="mb-4">
        <CardContent className="p-4">
          {!editing ? (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold">
                  {caseData.client?.firstName || caseData.firstName || ""}{" "}
                  {caseData.client?.lastName  || caseData.lastName  || ""}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                  <span className="font-semibold text-foreground">{caseData.fileNo}</span>
                  <Badge className={cn("text-xs", statusColor[caseData.fileStatus] || "bg-secondary")}>
                    {caseData.fileStatus}
                  </Badge>
                  <span className="text-muted-foreground">
                    DOL: <span className="text-foreground">{formatDate(caseData.dateOfLoss) || "—"}</span>
                  </span>
                  <span className={cn(
                    "text-muted-foreground",
                    limDays !== null && limDays <= 7  && limDays >= 0 ? "!text-destructive font-semibold" :
                    limDays !== null && limDays <= 30 && limDays > 7  ? "!text-orange-500" : ""
                  )}>
                    Limitation: <span className="font-medium">{formatDate(caseData.limitationDate) || "—"}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span>Clerk: <span className="text-foreground">{caseData.clerkAssigned || "—"}</span></span>
                  <span>Secretary: <span className="text-foreground">{caseData.secretary || "—"}</span></span>
                  <span>Referred: <span className="text-foreground">{caseData.referredBy || "—"}</span></span>
                  {caseData.clientInitials && (
                    <span>Initials: <span className="text-foreground font-medium">{caseData.clientInitials}</span></span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex items-start gap-1">
                  <span className="shrink-0">Address:</span>
                  <span className="text-foreground">
                    {caseData.clientStreet
                      ? [caseData.clientStreet, caseData.clientCity, caseData.clientState, caseData.clientZip, caseData.clientCountry]
                          .filter(Boolean).join(", ")
                      : "—"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>Mobile:</span>
                  {caseData.clientMobile ? (
                    <a
                      href={getMobileTelUri(caseData.clientMobile)}
                      className="hover:underline text-foreground font-medium"
                    >
                      {formatMobileNumber(caseData.clientMobile)}
                    </a>
                  ) : (
                    <span className="text-foreground">—</span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSave)}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Edit Case Details</h2>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>

              {/* Client Name */}
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold text-foreground mb-3">Client Name</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label className="text-xs">First Name</Label>
                  <Input {...register("clientFirstName")} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Last Name</Label>
                  <Input {...register("clientLastName")} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input {...register("clientEmail")} type="email" className="h-8 text-xs mt-1" />
                </div>
              </div>

              {/* File Information */}
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold text-foreground mb-3">File Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div><Label className="text-xs">File No</Label><Input {...register("fileNo")} className="h-8 text-xs mt-1" /></div>
                <div>
                  <Label className="text-xs">File Status</Label>
                  <Controller name="fileStatus" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{FILE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label className="text-xs">Case Type</Label>
                  <Controller name="caseType" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select case type..." /></SelectTrigger>
                      <SelectContent>{CASE_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div><Label className="text-xs">Date of Loss</Label><Input {...register("dateOfLoss")} type="date" className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs">Open Date</Label><Input {...register("openDate")} type="date" className="h-8 text-xs mt-1" /></div>
              </div>

              {/* Assignment */}
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold text-foreground mb-3">Assignment</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Referred By</Label>
                  <Controller name="referredById" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select referrer..." /></SelectTrigger>
                      <SelectContent>
                        <div className="px-2 pb-2">
                          <Input
                            placeholder="Search referrers..."
                            value={referrerSearch}
                            onChange={(e) => setReferrerSearch(e.target.value)}
                            className="h-7 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {filteredReferrers.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <span>{r.name}</span>
                            <span className="ml-2 text-muted-foreground text-xs">({r.type})</span>
                          </SelectItem>
                        ))}
                        {filteredReferrers.length === 0 && (
                          <p className="text-xs text-muted-foreground py-2 text-center">No referrers found</p>
                        )}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div><Label className="text-xs">Clerk Assigned</Label><Input {...register("clerkAssigned")} className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs">Secretary</Label><Input {...register("secretary")} className="h-8 text-xs mt-1" /></div>
              </div>

              {/* Legal Tracking */}
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold text-foreground mb-3">Legal Tracking</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div><Label className="text-xs">Limitation Date</Label><Input {...register("limitationDate")} type="date" className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs">Mediation Status</Label><Input {...register("mediationStatus")} className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs">Arbitration Status</Label><Input {...register("arbitrationStatus")} className="h-8 text-xs mt-1" /></div>
                <div>
                  <Label className="text-xs">MVA Client Fault?</Label>
                  <Controller name="mvaClientFault" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div><Label className="text-xs">Third Party Lawyer</Label><Input {...register("thirdPartyLawyer")} className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs">Tort File No</Label><Input {...register("tortFileNo")} className="h-8 text-xs mt-1" /></div>
              </div>

              {/* Client Address */}
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold text-foreground mb-3">Client Address</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div className="lg:col-span-2">
                  <Label className="text-xs">Street Address</Label>
                  <Input {...register("clientStreet")} className="h-8 text-xs mt-1" />
                </div>
                <div><Label className="text-xs">City</Label><Input {...register("clientCity")} className="h-8 text-xs mt-1" /></div>
                <div>
                  <Label className="text-xs">State/Province</Label>
                  <Controller name="clientState" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div><Label className="text-xs">ZIP/Postal Code</Label><Input {...register("clientZip")} className="h-8 text-xs mt-1" /></div>
                <div><Label className="text-xs">Country</Label><Input {...register("clientCountry")} className="h-8 text-xs mt-1" /></div>
                <div>
                  <Label className="text-xs">Mobile Number</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      {...register("clientMobile", {
                        validate: (v) => validateMobileNumber(v || ""),
                        onChange: (e) => {
                          const result = validateMobileNumber(e.target.value);
                          setMobileError(result === true ? "" : result);
                        },
                      })}
                      placeholder="+1-XXX-XXX-XXXX"
                      className="h-8 text-xs"
                    />
                  </div>
                  {mobileError && <p className="text-xs text-destructive mt-1">{mobileError}</p>}
                </div>
              </div>

              {/* Client Identification */}
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold text-foreground mb-3">Client Identification</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="text-xs">Client Initials (2-3 chars)</Label>
                  <Input {...register("clientInitials")} maxLength={3} className="h-8 text-xs mt-1 w-24 uppercase" placeholder="e.g. JM" />
                </div>
              </div>

              {/* Digital Signature */}
              <div className="bg-muted/50 px-3 py-1.5 rounded text-xs font-semibold text-foreground mb-3">Client Digital Signature</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs mb-2 block">Draw Signature</Label>
                  <SignaturePad value={signatureUrl} onChange={setSignatureUrl} />
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Or Upload Signature Image</Label>
                  <div className="border-2 border-dashed border-border rounded-md p-4 text-center">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <Input type="file" accept="image/*" onChange={handleSignatureUpload} className="h-8 text-xs" />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                  {signatureUrl && (
                    <div className="mt-2 border rounded-md p-2">
                      <Label className="text-xs text-muted-foreground">Current Signature:</Label>
                      <img src={signatureUrl} alt="Signature" className="max-h-16 mt-1" />
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-4 overflow-x-auto scrollbar-thin">
        <div className="flex gap-0.5 min-w-max border-b">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => navigate(`/cases/${caseId}/${t.key}`)}
              className={cn(
                "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <TabComponent caseId={caseId || ""} />
    </AppLayout>
  );
}