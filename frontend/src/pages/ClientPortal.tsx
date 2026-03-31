import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { cases, caseDocuments, getNotesByCaseId, getStatusHistoryByCaseId } from "@/data/mockData";
import { formatDate, daysUntil } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, FolderOpen, FileText, Upload, ClipboardList, Clock, User } from "lucide-react";

const statusColor: Record<string, string> = {
  Active: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
  Pending: "bg-warning text-warning-foreground",
  "On Hold": "bg-muted text-muted-foreground",
  Settled: "bg-primary text-primary-foreground",
  Litigation: "bg-destructive text-destructive-foreground",
};

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cases");

  const myCases = useMemo(() => cases.filter((c) => c.clientId === user?.clientId), [user?.clientId]);
  const myDocuments = useMemo(
    () => caseDocuments.filter((d) => myCases.some((c) => c.id === d.caseId)),
    [myCases]
  );

  const handleUpload = () => {
    toast({ title: "Document Uploaded", description: "Your document has been submitted for review." });
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground h-14 flex items-center justify-between px-6 sticky top-0 z-20">
        <span className="text-lg font-bold tracking-tight">Hypernova CRM — Client Portal</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold">
              {user?.name?.split(" ").map((n) => n[0]).join("") || "?"}
            </div>
            <span className="text-sm">{user?.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground mt-1">View your cases, upload documents, and track case updates.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FolderOpen className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-bold">{myCases.length}</p><p className="text-xs text-muted-foreground">My Cases</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-success" /></div>
              <div><p className="text-2xl font-bold">{myCases.filter((c) => c.fileStatus === "Active").length}</p><p className="text-xs text-muted-foreground">Active Cases</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><FileText className="h-5 w-5 text-muted-foreground" /></div>
              <div><p className="text-2xl font-bold">{myDocuments.length}</p><p className="text-xs text-muted-foreground">Documents</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="cases">My Cases</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="updates">Status Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="mt-4 space-y-4">
            {myCases.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">No cases found.</CardContent></Card>
            ) : (
              myCases.map((c) => {
                const limDays = daysUntil(c.limitationDate);
                return (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{c.fileNo}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Badge className={cn("text-xs", statusColor[c.fileStatus] || "bg-secondary")}>{c.fileStatus}</Badge>
                            <span>Date of Loss: {formatDate(c.dateOfLoss)}</span>
                            <span className={cn(limDays <= 7 && limDays >= 0 ? "text-destructive font-semibold" : limDays <= 30 ? "text-orange-500" : "")}>
                              Limitation: {formatDate(c.limitationDate)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Assigned to: {c.clerkAssigned}</p>
                        </div>
                      </div>
                      {/* Recent notes for this case */}
                      <div className="mt-3 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Recent Updates</p>
                        {getNotesByCaseId(c.id).slice(0, 2).map((n) => (
                          <p key={n.id} className="text-xs text-muted-foreground">{formatDate(n.date)} — {n.text.slice(0, 80)}...</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Upload a Document</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Select File</Label>
                    <Input type="file" accept=".pdf,.jpg,.png,.docx" className="h-9 text-sm mt-1" />
                  </div>
                  <Button size="sm" onClick={handleUpload}><Upload className="h-4 w-4 mr-1" /> Upload</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Case</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {myDocuments.map((d) => {
                      const c = myCases.find((mc) => mc.id === d.caseId);
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="py-2 text-sm">{d.name}</TableCell>
                          <TableCell className="py-2 text-sm">{d.category}</TableCell>
                          <TableCell className="py-2 text-sm">{formatDate(d.date)}</TableCell>
                          <TableCell className="py-2 text-sm">{c?.fileNo || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {myDocuments.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">No documents yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updates" className="mt-4 space-y-3">
            {myCases.map((c) => {
              const history = getStatusHistoryByCaseId(c.id);
              return (
                <Card key={c.id}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{c.fileNo}</CardTitle></CardHeader>
                  <CardContent>
                    {history.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No status changes recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {history.map((h) => (
                          <div key={h.id} className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">{formatDate(h.date)}</span>
                            <Badge variant="outline" className="text-xs">{h.status}</Badge>
                            <span className="text-muted-foreground">by {h.changedBy}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
