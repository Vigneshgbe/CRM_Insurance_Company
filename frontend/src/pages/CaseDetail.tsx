import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, daysUntil, getMobileTelUri, formatMobileNumber } from "@/lib/formatters";
import { casesApi } from "@/lib/api";
import { ChevronLeft, Phone } from "lucide-react";

// Tab components — these are your existing components, unchanged
import NotesTab from "@/components/case-tabs/NotesTab";
import ActivitiesTab from "@/components/case-tabs/ActivitiesTab";
import HistoryTab from "@/components/case-tabs/HistoryTab";
import StatusTab from "@/components/case-tabs/StatusTab";
import ContactAccessTab from "@/components/case-tabs/ContactAccessTab";
import DocumentsTab from "@/components/case-tabs/DocumentsTab";
import SettlementTab from "@/components/case-tabs/SettlementTab";

// These tabs still use mock data or show placeholder — they work, data just empty until connected
// Import your existing ones:
import ThirdPartyTab from "@/components/case-tabs/ThirdPartyTab";
import NoFaultTab from "@/components/case-tabs/NoFaultTab";
import MedicalTab from "@/components/case-tabs/MedicalTab";
import EmploymentTab from "@/components/case-tabs/EmploymentTab";
import PoliceInfoTab from "@/components/case-tabs/PoliceInfoTab";
import LawyersTab from "@/components/case-tabs/LawyersTab";
import SpecialistTab from "@/components/case-tabs/SpecialistTab";
import InitialInterviewTab from "@/components/case-tabs/InitialInterviewTab";
import ClientInfoTab from "@/components/case-tabs/ClientInfoTab";
import OcfFormsTab from "@/components/case-tabs/OcfFormsTab";

const TABS = [
  { id: "notes", label: "Notes" },
  { id: "activities", label: "Activities" },
  { id: "history", label: "History" },
  { id: "status", label: "Status" },
  { id: "initial-interview", label: "Initial Interview" },
  { id: "client-info", label: "Client Info" },
  { id: "no-fault", label: "No Fault" },
  { id: "third-party", label: "Third Party" },
  { id: "employment", label: "Employment" },
  { id: "medical", label: "Medical" },
  { id: "police-info", label: "Police Info" },
  { id: "lawyers", label: "Lawyers" },
  { id: "specialist", label: "Specialist" },
  { id: "settlement", label: "Settlement" },
  { id: "contact-access", label: "Contact Access" },
  { id: "documents", label: "Documents" },
  { id: "ocf-forms", label: "OCF Forms" },
];

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

export default function CaseDetail() {
  const { caseId, tab } = useParams<{ caseId: string; tab?: string }>();
  const navigate = useNavigate();
  const activeTab = tab || "notes";

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    casesApi.getById(caseId)
      .then(setCaseData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  function reload() {
    if (!caseId) return;
    casesApi.getById(caseId).then(setCaseData).catch(console.error);
  }

  function renderTab() {
    if (!caseId) return null;
    const props = { caseId, caseData, onUpdate: reload };
    switch (activeTab) {
      case "notes":            return <NotesTab caseId={caseId} />;
      case "activities":       return <ActivitiesTab caseId={caseId} />;
      case "history":          return <HistoryTab caseId={caseId} />;
      case "status":           return <StatusTab {...props} />;
      case "initial-interview":return <InitialInterviewTab caseId={caseId} />;
      case "client-info":      return <ClientInfoTab caseId={caseId} />;
      case "no-fault":         return <NoFaultTab caseId={caseId} />;
      case "third-party":      return <ThirdPartyTab caseId={caseId} />;
      case "employment":       return <EmploymentTab caseId={caseId} />;
      case "medical":          return <MedicalTab caseId={caseId} />;
      case "police-info":      return <PoliceInfoTab caseId={caseId} />;
      case "lawyers":          return <LawyersTab caseId={caseId} />;
      case "specialist":       return <SpecialistTab caseId={caseId} />;
      case "settlement":       return <SettlementTab caseId={caseId} />;
      case "contact-access":   return <ContactAccessTab caseId={caseId} />;
      case "documents":        return <DocumentsTab caseId={caseId} />;
      case "ocf-forms":        return <OcfFormsTab caseId={caseId} />;
      default:                 return <NotesTab caseId={caseId} />;
    }
  }

  const limDays = caseData?.limitationDate ? daysUntil(caseData.limitationDate) : null;
  const limUrgent = limDays !== null && limDays <= 7 && limDays >= 0;
  const limWarn = limDays !== null && limDays <= 30 && limDays > 7;

  return (
    <AppLayout title={loading ? "Loading..." : `${caseData?.client?.firstName || ""} ${caseData?.client?.lastName || ""}`}>
      {/* Back button */}
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate("/clients")}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Clients
      </Button>

      {loading ? (
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Loading case...</div>
      ) : !caseData ? (
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Case not found.</div>
      ) : (
        <>
          {/* Case header */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-foreground">
                    {caseData.client?.firstName} {caseData.client?.lastName}
                    {caseData.clientInitials && <span className="text-muted-foreground font-normal text-sm ml-1">({caseData.clientInitials})</span>}
                  </h2>
                  <Badge className={cn("text-xs", statusColor[caseData.fileStatus])}>{caseData.fileStatus}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <span><span className="font-medium text-foreground">File No:</span> {caseData.fileNo}</span>
                  <span><span className="font-medium text-foreground">Date of Loss:</span> {formatDate(caseData.dateOfLoss)}</span>
                  <span className={cn(limUrgent ? "text-destructive font-semibold" : limWarn ? "text-orange-500" : "")}>
                    <span className="font-medium text-foreground">Limitation:</span> {formatDate(caseData.limitationDate)}
                    {limDays !== null && limDays >= 0 && <span className="ml-1 text-xs">({limDays}d)</span>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mt-1">
                  <span><span className="font-medium text-foreground">Clerk:</span> {caseData.clerkAssigned || "—"}</span>
                  <span><span className="font-medium text-foreground">Secretary:</span> {caseData.secretary || "—"}</span>
                  <span><span className="font-medium text-foreground">Referred By:</span> {caseData.referredBy || "—"}</span>
                </div>
              </div>
              {(caseData.clientMobile || caseData.client?.cellPhone) && (
                <a
                  href={getMobileTelUri(caseData.clientMobile || caseData.client?.cellPhone)}
                  className="flex items-center gap-1 text-primary text-sm hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {formatMobileNumber(caseData.clientMobile || caseData.client?.cellPhone)}
                </a>
              )}
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex overflow-x-auto gap-0 border-b mb-0 pb-0 -mb-px scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/cases/${caseId}/${t.id}`)}
                className={cn(
                  "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0",
                  activeTab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white border border-t-0 rounded-b-lg min-h-[400px]">
            {renderTab()}
          </div>
        </>
      )}
    </AppLayout>
  );
}