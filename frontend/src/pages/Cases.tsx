import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { casesApi } from "@/lib/api";

const STATUSES = ["All Statuses", "Active", "Closed", "Pending", "On Hold", "Settled", "Litigation", "Mediation", "Arbitration"];
const CASE_TYPES = ["All Case Types", "Motor Vehicle Accident (MVA)", "Slip and Fall", "Traffic Accident", "Immigration"];

function statusColor(status: string) {
  const map: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Litigation: "bg-red-100 text-red-700",
    Settled: "bg-blue-100 text-blue-700",
    Closed: "bg-gray-100 text-gray-500",
    Mediation: "bg-yellow-100 text-yellow-700",
    Arbitration: "bg-red-100 text-red-700",
    "On Hold": "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
}

function daysUntilBadge(dateStr: string) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Past</span>;
  if (days <= 30) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-semibold">URGENT</span>;
  if (days <= 60) return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">{days}d</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{days}d</span>;
}

const PAGE_SIZE = 10;

export default function Cases() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [typeFilter, setTypeFilter] = useState("All Case Types");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await casesApi.getAll({
          search: search || undefined,
          status: statusFilter !== "All Statuses" ? statusFilter : undefined,
          caseType: typeFilter !== "All Case Types" ? typeFilter : undefined,
        });
        setCases(data);
        setPage(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(cases.length / PAGE_SIZE);
  const paginated = cases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Cases</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {CASE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">File No</th>
              <th className="px-4 py-3 font-medium">Client Name</th>
              <th className="px-4 py-3 font-medium">Date of Loss</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Clerk</th>
              <th className="px-4 py-3 font-medium">Limitation Date</th>
              <th className="px-4 py-3 font-medium">Days Until</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No cases found.</td></tr>
            ) : (
              paginated.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{c.fileNo}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/cases/${c.id}`} className="hover:text-primary">
                      {c.client?.firstName} {c.client?.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.dateOfLoss || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(c.fileStatus)}`}>
                      {c.fileStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.clerkAssigned || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.limitationDate || "—"}</td>
                  <td className="px-4 py-3">{c.limitationDate ? daysUntilBadge(c.limitationDate) : "—"}</td>
                  <td className="px-4 py-3">
                    <Link to={`/cases/${c.id}`} className="text-muted-foreground hover:text-foreground">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, cases.length)} of {cases.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
