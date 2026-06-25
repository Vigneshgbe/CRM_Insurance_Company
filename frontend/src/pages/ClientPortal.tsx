import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { formatDate, daysUntil } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

const statusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-600",
  Pending: "bg-yellow-100 text-yellow-800",
  Settled: "bg-blue-100 text-blue-800",
  Litigation: "bg-red-100 text-red-800",
};

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cases");
  const [cases, setCases] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/portal/cases`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : []).then(setCases);
    fetch(`${API}/portal/documents`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : []).then(setDocuments);
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    fetch(`${API}/portal/status-history/${selectedCaseId}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : []).then(setStatusHistory);
  }, [selectedCaseId]);

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Client Portal</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />Sign Out
        </Button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b mb-6">
          {["cases", "documents", "status"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors",
                activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t === "status" ? "Status Updates" : t === "cases" ? "My Cases" : "My Documents"}
            </button>
          ))}
        </div>

        {/* My Cases */}
        {activeTab === "cases" && (
          <div className="space-y-3">
            {cases.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No cases found.</p>
            ) : cases.map((c: any) => {
              const limDays = c.limitationDate ? daysUntil(c.limitationDate) : null;
              return (
                <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedCaseId(c.id); setActiveTab("status"); }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{c.fileNo}</p>
                        <p className="text-sm text-muted-foreground">{c.caseType}</p>
                        <p className="text-xs text-muted-foreground mt-1">Date of Loss: {formatDate(c.dateOfLoss)}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={cn("text-xs", statusColor[c.fileStatus] || "bg-gray-100")}>{c.fileStatus}</Badge>
                        {limDays !== null && limDays >= 0 && limDays <= 60 && (
                          <p className={cn("text-xs", limDays <= 30 ? "text-red-600 font-semibold" : "text-orange-500")}>
                            Limitation in {limDays}d
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* My Documents */}
        {activeTab === "documents" && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">My Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-sm">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />No documents yet.
                    </TableCell></TableRow>
                  ) : documents.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="py-2 text-sm">{d.name}</TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{d.category}</TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{formatDate(d.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Status Updates */}
        {activeTab === "status" && (
          <div className="space-y-4">
            {cases.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {cases.map((c: any) => (
                  <Button key={c.id} size="sm" variant={selectedCaseId === c.id ? "default" : "outline"}
                    onClick={() => setSelectedCaseId(c.id)}>
                    {c.fileNo}
                  </Button>
                ))}
              </div>
            )}
            {!selectedCaseId ? (
              <p className="text-sm text-muted-foreground text-center py-8">Select a case above to view status history.</p>
            ) : statusHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No status history yet.</p>
            ) : (
              <div className="space-y-2">
                {statusHistory.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 p-3 bg-white rounded border">
                    <Badge variant="secondary" className="text-xs">{h.status}</Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(h.date)}</span>
                    {h.changedBy && <span className="text-xs text-muted-foreground">by {h.changedBy}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}