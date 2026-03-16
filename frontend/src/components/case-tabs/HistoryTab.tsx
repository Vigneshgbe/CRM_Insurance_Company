import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getHistoryByCaseId } from "@/data/mockData";
import { formatDate } from "@/lib/formatters";

export default function HistoryTab({ caseId }: { caseId: string }) {
  const history = getHistoryByCaseId(caseId);

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Case History</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Time</TableHead>
            <TableHead className="text-xs">User</TableHead>
            <TableHead className="text-xs">Action</TableHead>
            <TableHead className="text-xs">Field</TableHead>
            <TableHead className="text-xs">Old Value</TableHead>
            <TableHead className="text-xs">New Value</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {history.map((h) => (
              <TableRow key={h.id} className="text-sm">
                <TableCell className="py-2">{formatDate(h.date)}</TableCell>
                <TableCell className="py-2">{h.time}</TableCell>
                <TableCell className="py-2">{h.user}</TableCell>
                <TableCell className="py-2">{h.action}</TableCell>
                <TableCell className="py-2">{h.fieldChanged}</TableCell>
                <TableCell className="py-2 text-muted-foreground">{h.oldValue || "—"}</TableCell>
                <TableCell className="py-2 font-medium">{h.newValue}</TableCell>
              </TableRow>
            ))}
            {history.length === 0 && <TableRow><TableCell colSpan={7} className="py-4 text-center text-sm text-muted-foreground">No history.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
