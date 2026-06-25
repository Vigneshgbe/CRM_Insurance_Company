import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, daysUntil } from "@/lib/formatters";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { casesApi } from "@/lib/api";

const FILE_STATUSES = ["Active", "Closed", "Pending", "On Hold", "Settled", "Litigation", "Mediation", "Arbitration"];
const CASE_TYPES = ["Motor Vehicle Accident (MVA)", "Slip and Fall", "Traffic Accident", "Immigration"];

const statusColor: Record<string, string> = {
  Active: "bg-success text-success-foreground",
  Closed: "bg-muted text-muted-foreground",
  Pending: "bg-warning text-warning-foreground",
  "On Hold": "bg-muted text-muted-foreground",
  Settled: "bg-primary text-primary-foreground",
  Litigation: "bg-destructive text-destructive-foreground",
  Mediation: "bg-warning text-warning-foreground",
  Arbitration: "bg-destructive text-destructive-foreground",
};

function LimitationBadge({ date }: { date: string }) {
  if (!date) return <span>—</span>;
  const days = daysUntil(date);
  if (days < 0) return <Badge variant="secondary" className="text-xs">Past</Badge>;
  if (days <= 30) return <Badge variant="destructive" className="text-xs">URGENT</Badge>;
  if (days <= 60) return <Badge variant="outline" className="text-xs text-warning border-warning">{days}d</Badge>;
  return <Badge variant="outline" className="text-xs text-success border-success">{days}d</Badge>;
}

const PAGE_SIZE = 10;

export default function Cases() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await casesApi.getAll({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          caseType: typeFilter !== "all" ? typeFilter : undefined,
        });
        setCases(data);
        setPage(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(cases.length / PAGE_SIZE);
  const paginated = cases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppLayout title="Cases">
      <div className="flex gap-3 flex-wrap mb-4">
        <Input
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 h-9 text-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {FILE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All Case Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Case Types</SelectItem>
            {CASE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">File No</TableHead>
                <TableHead className="text-xs">Client Name</TableHead>
                <TableHead className="text-xs">Date of Loss</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Clerk</TableHead>
                <TableHead className="text-xs">Limitation Date</TableHead>
                <TableHead className="text-xs">Days Until</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No cases found.</TableCell></TableRow>
              ) : (
                paginated.map((c: any) => (
                  <TableRow key={c.id} className="text-sm">
                    <TableCell className="py-2 font-medium">{c.fileNo}</TableCell>
                    <TableCell className="py-2">
                      <Link to={`/cases/${c.id}`} className="hover:text-primary">{c.client?.firstName} {c.client?.lastName}</Link>
                    </TableCell>
                    <TableCell className="py-2">{formatDate(c.dateOfLoss)}</TableCell>
                    <TableCell className="py-2">
                      <Badge className={cn("text-xs", statusColor[c.fileStatus])}>{c.fileStatus}</Badge>
                    </TableCell>
                    <TableCell className="py-2">{c.clerkAssigned || "—"}</TableCell>
                    <TableCell className="py-2 text-xs">{formatDate(c.limitationDate)}</TableCell>
                    <TableCell className="py-2"><LimitationBadge date={c.limitationDate} /></TableCell>
                    <TableCell className="py-2">
                      <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                        <Link to={`/cases/${c.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, cases.length)} of {cases.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
