import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCaseById } from "@/data/mockData";
import { formatDate, daysUntil } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import NotesTab from "@/components/case-tabs/NotesTab";
import DocumentsTab from "@/components/case-tabs/DocumentsTab";
import InitialInterviewTab from "@/components/case-tabs/InitialInterviewTab";
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
  { key: "notes", label: "Notes" },
  { key: "documents", label: "Documents" },
  { key: "initial-interview", label: "Initial Interview" },
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
  { key: "ocf-forms", label: "OCF Forms" },
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
  const activeTab = tab || "notes";
  const caseData = getCaseById(caseId || "1");

  if (!caseData) {
    return <AppLayout title="Case Not Found"><p>Case not found.</p></AppLayout>;
  }

  const limDays = daysUntil(caseData.limitationDate);
  const TabComponent = tabComponents[activeTab] || NotesTab;

  return (
    <AppLayout title={`Case: ${caseData.fileNo}`}>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{caseData.client.firstName} {caseData.client.lastName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{caseData.fileNo}</span>
                <Badge className={cn("text-xs", statusColor[caseData.fileStatus] || "bg-secondary")}>{caseData.fileStatus}</Badge>
                <span>DOL: {formatDate(caseData.dateOfLoss)}</span>
                <span className={cn(limDays <= 7 && limDays >= 0 ? "text-destructive font-semibold" : "")}>
                  Limitation: {formatDate(caseData.limitationDate)}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-1 text-xs text-muted-foreground">
                <span>Clerk: {caseData.clerkAssigned}</span>
                <span>Secretary: {caseData.secretary}</span>
                <span>Referred: {caseData.referredBy}</span>
              </div>
            </div>
            <Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
          </div>
        </CardContent>
      </Card>

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

      <TabComponent caseId={caseId || "1"} />
    </AppLayout>
  );
}
