import { useEffect, useState } from "react";
import { historyApi } from "@/lib/api";

interface Props { caseId: string; }

export default function HistoryTab({ caseId }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyApi.getByCaseId(caseId).then(setHistory).catch(console.error).finally(() => setLoading(false));
  }, [caseId]);

  return (
    <div className="p-4">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading history...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted-foreground">No history yet.</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Field</th>
                <th className="px-4 py-2 font-medium">Old Value</th>
                <th className="px-4 py-2 font-medium">New Value</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2 text-muted-foreground">{h.date}</td>
                  <td className="px-4 py-2 text-muted-foreground">{h.time}</td>
                  <td className="px-4 py-2">{h.user}</td>
                  <td className="px-4 py-2">{h.action}</td>
                  <td className="px-4 py-2 text-muted-foreground">{h.fieldChanged || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{h.oldValue || "—"}</td>
                  <td className="px-4 py-2">{h.newValue || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
