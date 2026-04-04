import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cases } from "@/data/mockData";
import { formatDate, daysUntil } from "@/lib/formatters";
import { FILE_STATUSES, CASE_TYPES } from "@/lib/constants";
import { Link } from "react-router-dom";
import { Plus, Eye, Pencil, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

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

const caseTypeShort: Record<string, string> = {
  "Motor Vehicle Accident (MVA)": "MVA",
  "Slip and Fall": "Slip & Fall",
  "Traffic Accident": "Traffic",
  "Immigration": "Immigration",
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [caseTypeFilter, setCaseTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = cases.filter((c) => {
    const matchSearch = search === "" || `${c.client.firstName} ${c.client.lastName} ${c.fileNo}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.fileStatus === statusFilter;
    const matchType = caseTypeFilter === "all" || c.caseType === caseTypeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <AppLayout title="Clients">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <Input placeholder="Search clients or file no..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs h-9 text-sm" />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {FILE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={caseTypeFilter} onValueChange={(v) => { setCaseTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All Case Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Case Types</SelectItem>
              {CASE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button asChild size="sm">
          <Link to="/clients/new"><Plus className="h-4 w-4 mr-1" /> New Client</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">File No</TableHead>
                <TableHead className="text-xs">Client Name</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Case Type</TableHead>
                <TableHead className="text-xs">Date of Loss</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Clerk Assigned</TableHead>
                <TableHead className="text-xs">Limitation Date</TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((c) => {
                const limDays = daysUntil(c.limitationDate);
                return (
                  <TableRow key={c.id} className="text-sm cursor-pointer hover:bg-muted/50">
                    <TableCell className="py-2 font-medium">{c.fileNo}</TableCell>
                    <TableCell className="py-2">{c.client.firstName} {c.client.lastName}</TableCell>
                    <TableCell className="py-2">
                      {c.client.phoneNumber ? (
                        <a href={`tel:${c.client.phoneNumber}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{c.client.phoneNumber}</span>
                        </a>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-xs">{caseTypeShort[c.caseType] || c.caseType}</Badge>
                    </TableCell>
                    <TableCell className="py-2">{formatDate(c.dateOfLoss)}</TableCell>
                    <TableCell className="py-2"><Badge className={cn("text-xs", statusColor[c.fileStatus])}>{c.fileStatus}</Badge></TableCell>
                    <TableCell className="py-2">{c.clerkAssigned}</TableCell>
                    <TableCell className={cn("py-2", limDays <= 7 && limDays >= 0 ? "text-destructive font-semibold" : limDays <= 30 && limDays > 7 ? "text-orange-500" : "")}>{formatDate(c.limitationDate)}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link to={`/cases/${c.id}`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                        <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link to={`/cases/${c.id}`}><Pencil className="h-3.5 w-3.5" /></Link></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
