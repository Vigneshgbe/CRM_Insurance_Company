import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getStatusHistoryByCaseId, getCaseById, type StatusEntry } from "@/data/mockData";
import { FILE_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

export default function StatusTab({ caseId }: { caseId: string }) {
  const caseData = getCaseById(caseId);
  const [statusHistory, setStatusHistory] = useState<StatusEntry[]>(getStatusHistoryByCaseId(caseId));
  const [currentStatus, setCurrentStatus] = useState(caseData?.fileStatus || "Active");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateStatus = () => {
    setLoading(true);
    setTimeout(() => {
      const entry: StatusEntry = {
        id: `s${Date.now()}`, caseId, status: currentStatus,
        date: new Date().toISOString().split("T")[0], changedBy: "Amanda Singh",
      };
      setStatusHistory([entry, ...statusHistory]);
      toast({ title: "Status Updated", description: `Case status changed to ${currentStatus}.` });
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Current Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 max-w-md">
            <div className="flex-1">
              <Label className="text-xs">Status</Label>
              <Select value={currentStatus} onValueChange={setCurrentStatus}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{FILE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={updateStatus} disabled={loading}>{loading ? "Updating..." : "Update Status"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Status History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusHistory.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  {i < statusHistory.length - 1 && <div className="w-px h-6 bg-border" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{s.status}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(s.date)} · {s.changedBy}</span>
                </div>
              </div>
            ))}
            {statusHistory.length === 0 && <p className="text-sm text-muted-foreground">No status history.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
