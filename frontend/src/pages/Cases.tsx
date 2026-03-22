import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cases } from "@/data/mockData";
import { formatDate, daysUntil } from "@/lib/formatters";
import { FILE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Plus, Eye } from "lucide-react";

const STAFF = ["All", "Amanda Singh", "John Baker"];

export default function Cases() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.fileNo.toLowerCase().includes(q) || `${c.client.firstName} ${c.client.lastName}`.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.fileStatus === statusFilter;
      const matchAssigned = assignedFilter === "All" || c.clerkAssigned === assignedFilter;
      const matchDateFrom = !dateFrom || c.dateOfLoss >= dateFrom;
      const matchDateTo = !dateTo || c.dateOfLoss <= dateTo;
      return matchSearch && matchStatus && matchAssigned && matchDateFrom && matchDateTo;
    });
  }, [search, statusFilter, assignedFilter, dateFrom, dateTo]);

  const getLimBadge = (limDate: string) => {
    const d = daysUntil(limDate);
    if (d < 0) return <Badge variant="secondary" className="text-xs">Past</Badge>;
    if (d < 30) return <Badge variant="destructive" className="text-xs">{d}d — URGENT</Badge>;
    if (d <= 60) return <Badge className="bg-warning text-warning-foreground text-xs">{d} days</Badge>;
    return <Badge className="bg-success/20 text-success text-xs">{d} days</Badge>;
  };

  const getLimTextClass = (limDate: string) => {
    const d = daysUntil(limDate);
    if (d >= 0 && d <= 7) return "text-destructive font-semibold";
    if (d > 7 && d <= 30) return "text-orange-500";
    return "";
  };

  return (
    <AppLayout title="Cases">
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Input placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 text-sm w-64" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 text-sm w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {FILE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
          <SelectTrigger className="h-9 text-sm w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{STAFF.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">DOL:</span>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm w-36" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm w-36" />
        </div>
        <Button size="sm" onClick={() => navigate("/clients/new")}><Plus className="h-4 w-4 mr-1" /> New Case</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">File No</TableHead>
              <TableHead className="text-xs">Client Name</TableHead>
              <TableHead className="text-xs">Date of Loss</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Clerk Assigned</TableHead>
              <TableHead className="text-xs">Limitation Date</TableHead>
              <TableHead className="text-xs">Days Until</TableHead>
              <TableHead className="text-xs w-16"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/cases/${c.id}`)}>
                  <TableCell className="py-2 text-sm font-medium">{c.fileNo}</TableCell>
                  <TableCell className="py-2 text-sm">{c.client.firstName} {c.client.lastName}</TableCell>
                  <TableCell className="py-2 text-sm">{formatDate(c.dateOfLoss)}</TableCell>
                  <TableCell className="py-2"><Badge variant="outline" className="text-xs">{c.fileStatus}</Badge></TableCell>
                  <TableCell className="py-2 text-sm">{c.clerkAssigned}</TableCell>
                  <TableCell className={cn("py-2 text-sm", getLimTextClass(c.limitationDate))}>{formatDate(c.limitationDate)}</TableCell>
                  <TableCell className="py-2">{getLimBadge(c.limitationDate)}</TableCell>
                  <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">No cases found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
