import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { historyApi, casesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["Active", "Closed", "Pending", "On Hold", "Settled", "Litigation", "Mediation", "Arbitration"];

interface Props { caseId: string; caseData?: any; onUpdate?: () => void; }

export default function StatusTab({ caseId, caseData, onUpdate }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNewStatus(caseData?.fileStatus || "");
    historyApi.getStatusHistory(caseId).then(setHistory).catch(console.error).finally(() => setLoading(false));
  }, [caseId, caseData]);

  async function handleUpdate() {
    if (!newStatus || newStatus === caseData?.fileStatus) { toast({ title: "No change" }); return; }
    setSaving(true);
    try {
      await casesApi.update(caseId, { ...caseData, fileStatus: newStatus });
      toast({ title: `Status updated to ${newStatus}` });
      onUpdate?.();
      const data = await historyApi.getStatusHistory(caseId);
      setHistory(data);
    } catch (err) {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Update status */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-sm mb-3">Update Status</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Current: <strong>{caseData?.fileStatus}</strong></label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Button onClick={handleUpdate} disabled={saving || newStatus === caseData?.fileStatus} size="sm">
            {saving ? "Saving..." : "Update Status"}
          </Button>
        </div>
      </div>

      {/* Status history */}
      <div className="bg-white border rounded-lg">
        <div className="p-3 border-b">
          <h3 className="font-medium text-sm">Status History</h3>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading...</p>
        ) : history.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No status history.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Changed By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{h.status}</td>
                  <td className="px-4 py-2 text-muted-foreground">{h.date}</td>
                  <td className="px-4 py-2 text-muted-foreground">{h.changedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
