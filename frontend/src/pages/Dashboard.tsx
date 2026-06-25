import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { dashboardApi } from "@/lib/api";

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

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

function limitationColor(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d === null) return "";
  if (d <= 7) return "text-red-600 font-semibold";
  if (d <= 30) return "text-orange-500";
  return "";
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    casesThisMonth: 0,
    settlementsPending: 0,
  });
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [limitations, setLimitations] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, rc, lim, act] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentCases(),
          dashboardApi.getUpcomingLimitations(),
          dashboardApi.getRecentActivities(),
        ]);
        setStats(s);
        setRecentCases(rc);
        setLimitations(lim);
        setActivities(act);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Total Cases</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.totalCases}</p>
          <div className="mt-2 h-1 w-full bg-green-500 rounded" />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Active Cases</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.activeCases}</p>
          <div className="mt-2 h-1 w-full bg-blue-500 rounded" />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Cases This Month</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.casesThisMonth}</p>
          <div className="mt-2 h-1 w-full bg-yellow-500 rounded" />
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Settlements Pending</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.settlementsPending}</p>
          <div className="mt-2 h-1 w-full bg-orange-500 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-foreground">Recent Cases</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">File No</th>
                  <th className="px-4 py-2 font-medium">Client Name</th>
                  <th className="px-4 py-2 font-medium">Date of Loss</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Assigned To</th>
                  <th className="px-4 py-2 font-medium">Limitation</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {recentCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No cases yet.
                    </td>
                  </tr>
                ) : (
                  recentCases.map((c: any) => (
                    <tr key={c.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{c.file_no}</td>
                      <td className="px-4 py-2">
                        {c.first_name} {c.last_name}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{c.date_of_loss}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(c.file_status)}`}>
                          {c.file_status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{c.clerk_assigned || "—"}</td>
                      <td className={`px-4 py-2 text-xs ${limitationColor(c.limitation_date)}`}>
                        {c.limitation_date || "—"}
                      </td>
                      <td className="px-4 py-2">
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
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming Limitations */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-foreground">Upcoming Limitation Dates</h2>
            </div>
            <div className="p-4 space-y-2">
              {limitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming limitations within 30 days.</p>
              ) : (
                limitations.map((l: any) => (
                  <div key={l.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{l.first_name} {l.last_name}</p>
                      <p className="text-xs text-muted-foreground">{l.file_no}</p>
                    </div>
                    <span className={`text-xs font-semibold ${limitationColor(l.limitation_date)}`}>
                      {l.limitation_date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-foreground">Recent Activities</h2>
            </div>
            <div className="p-4 space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activities.</p>
              ) : (
                activities.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex gap-2 items-start text-sm">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <p className="font-medium">{a.regarding || a.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.date} · {a.record_manager || a.author}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
