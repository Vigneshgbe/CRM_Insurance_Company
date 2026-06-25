import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { useAuth } from "@/lib/auth";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";
const STATUSES = ["Active","Closed","Pending","On Hold","Settled","Litigation","Mediation","Arbitration"];

export default function StatusTab({ caseId, caseData }: { caseId: string; caseData?: any }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch(`${API}/cases/${caseId}/status-history`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) setHistory(await r.json());
  }

  useEffect(() => { load(); setNewStatus(caseData?.fileStatus || ""); }, [caseId, caseData]);

  async function updateStatus() {
    if (!newStatus) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: newStatus, changedBy: user?.name || "Staff" }),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Status updated" });
      load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Update Case Status</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={updateStatus} disabled={saving} size="sm">{saving ? "Saving..." : "Update Status"}</Button>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Status History</p>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No history yet.</p>
        ) : history.map((h: any) => (
          <div key={h.id} className="flex items-center gap-3 py-2 border-b last:border-0">
            <Badge variant="secondary" className="text-xs">{h.status}</Badge>
            <span className="text-xs text-muted-foreground">{formatDate(h.date)} · {h.changedBy}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
