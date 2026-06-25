import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/formatters";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

export default function HistoryTab({ caseId }: { caseId: string }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/cases/${caseId}/history`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : []).then(setHistory);
  }, [caseId]);

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Time</TableHead>
            <TableHead className="text-xs">User</TableHead>
            <TableHead className="text-xs">Action</TableHead>
            <TableHead className="text-xs">Field</TableHead>
            <TableHead className="text-xs">Old Value</TableHead>
            <TableHead className="text-xs">New Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">No history yet.</TableCell></TableRow>
          ) : history.map((h: any) => (
            <TableRow key={h.id} className="text-sm">
              <TableCell className="py-2">{formatDate(h.date)}</TableCell>
              <TableCell className="py-2">{h.time}</TableCell>
              <TableCell className="py-2">{h.user}</TableCell>
              <TableCell className="py-2">{h.action}</TableCell>
              <TableCell className="py-2">{h.fieldChanged}</TableCell>
              <TableCell className="py-2 text-muted-foreground">{h.oldValue || "—"}</TableCell>
              <TableCell className="py-2">{h.newValue || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
