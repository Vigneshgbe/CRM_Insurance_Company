import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, daysUntil } from "@/lib/formatters";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Eye, TrendingUp, TrendingDown, Minus, Plus, UserPlus,
  Upload, FileText, CalendarDays, ChevronLeft, ChevronRight,
  ArrowRight, Scale, Briefcase, Activity, Clock,
} from "lucide-react";
import { dashboardApi } from "@/lib/api";

// ── Status badge colors (original — untouched) ───────────────
const statusColor: Record<string, string> = {
  Active:      "bg-success text-success-foreground",
  Closed:      "bg-muted text-muted-foreground",
  Pending:     "bg-warning text-warning-foreground",
  "On Hold":   "bg-muted text-muted-foreground",
  Settled:     "bg-primary text-primary-foreground",
  Litigation:  "bg-destructive text-destructive-foreground",
  Mediation:   "bg-warning text-warning-foreground",
  Arbitration: "bg-destructive text-destructive-foreground",
};

// ── Donut chart colors ───────────────────────────────────────
const DONUT_COLORS: Record<string, string> = {
  Active:      "hsl(160 84% 39%)",
  Mediation:   "hsl(38 92% 50%)",
  Litigation:  "hsl(0 84% 60%)",
  Settled:     "hsl(21 95% 27%)",
  Pending:     "hsl(25 60% 40%)",
  "On Hold":   "hsl(215 16% 47%)",
  Arbitration: "hsl(0 72% 51%)",
  Closed:      "hsl(215 16% 67%)",
};
const FALLBACK_COLORS = [
  "hsl(21 95% 27%)", "hsl(25 60% 40%)", "hsl(38 92% 50%)",
  "hsl(0 84% 60%)", "hsl(160 84% 39%)", "hsl(215 16% 47%)",
];
function getColor(status: string, idx: number) {
  return DONUT_COLORS[status] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

// ── Donut SVG ────────────────────────────────────────────────
function DonutChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + parseInt(String(d.count), 10), 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 100 100" className="h-36 w-36">
        <circle cx="50" cy="50" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="14" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="hsl(var(--muted-foreground))">No data</text>
      </svg>
    );
  }
  const r = 36; const circ = 2 * Math.PI * r;
  let cumulative = 0;
  const slices = data.map((d, i) => {
    const pct = parseInt(String(d.count), 10) / total;
    const offset = circ * (1 - cumulative);
    const dash = circ * pct;
    const slice = { ...d, pct, offset, dash, color: getColor(d.status, i) };
    cumulative += pct;
    return slice;
  });
  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
        {slices.map((s, i) => (
          <circle key={i} cx="50" cy="50" r={r} fill="none"
            stroke={s.color} strokeWidth="14"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset + circ} />
        ))}
      </svg>
      <div className="absolute text-center pointer-events-none">
        <p className="text-2xl font-bold text-foreground">{total}</p>
        <p className="text-[10px] text-muted-foreground">Total Cases</p>
      </div>
    </div>
  );
}

// ── Sparkline SVG ────────────────────────────────────────────
function SparkLine({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
        No trend data
      </div>
    );
  }
  const W = 280; const H = 72; const PAD = 8;
  const counts = data.map(d => d.count);
  const max = Math.max(...counts, 1);
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2);
    const y = H - PAD - (d.count / max) * (H - PAD * 2);
    return [x, y] as [number, number];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = [
    `${PAD},${H - PAD}`,
    ...pts.map(([x, y]) => `${x},${y}`),
    `${W - PAD},${H - PAD}`,
  ].join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full h-24">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(21 95% 27%)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(21 95% 27%)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={polyline} fill="none"
        stroke="hsl(21 95% 27%)" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5"
          fill="hsl(21 95% 27%)" stroke="white" strokeWidth="1" />
      ))}
      {data.filter((_, i) => i % 2 === 0).map((d) => {
        const origIdx = data.indexOf(d);
        const x = PAD + (origIdx / (data.length - 1 || 1)) * (W - PAD * 2);
        return (
          <text key={origIdx} x={x} y={H + 10} textAnchor="middle"
            fontSize="7" fill="hsl(var(--muted-foreground))">
            {d.date.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}

// ── Mini Calendar ────────────────────────────────────────────
function MiniCalendar({ limitationDates }: { limitationDates: string[] }) {
  const [cur, setCur] = useState(new Date());
  const today = new Date();
  const year = cur.getFullYear();
  const month = cur.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const limSet = new Set(
    limitationDates.map(d => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    })
  );
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">
          {cur.toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
        <div className="flex gap-1">
          <button onClick={() => setCur(new Date(year, month - 1, 1))}
            className="p-1 rounded hover:bg-muted transition-colors">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => setCur(new Date(year, month + 1, 1))}
            className="p-1 rounded hover:bg-muted transition-colors">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isLimit = limSet.has(`${year}-${month}-${day}`);
          return (
            <div key={i} className={cn(
              "text-[11px] h-6 w-6 mx-auto flex items-center justify-center rounded-full cursor-default transition-colors",
              isToday && "bg-primary text-primary-foreground font-bold",
              isLimit && !isToday && "bg-destructive/20 text-destructive font-semibold ring-1 ring-destructive/40",
              !isToday && !isLimit && "hover:bg-muted text-foreground",
            )}>{day}</div>
          );
        })}
      </div>
      {limSet.size > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-destructive/60" />
          Limitation date
        </div>
      )}
    </div>
  );
}

// ── Activity icon ────────────────────────────────────────────
const activityIconMap: Record<string, { icon: React.ReactNode; bg: string }> = {
  Note:        { icon: <FileText className="h-3 w-3" />,     bg: "bg-primary/10 text-primary" },
  Task:        { icon: <Briefcase className="h-3 w-3" />,    bg: "bg-warning/10 text-warning" },
  Call:        { icon: <Activity className="h-3 w-3" />,     bg: "bg-success/10 text-success" },
  Email:       { icon: <FileText className="h-3 w-3" />,     bg: "bg-accent/10 text-accent" },
  Appointment: { icon: <CalendarDays className="h-3 w-3" />, bg: "bg-destructive/10 text-destructive" },
};
function ActivityIcon({ type }: { type: string }) {
  const def = activityIconMap[type] ?? { icon: <Clock className="h-3 w-3" />, bg: "bg-muted text-muted-foreground" };
  return (
    <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0", def.bg)}>
      {def.icon}
    </div>
  );
}

// ── Dashboard page ───────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  // original state (untouched)
  const [stats, setStats] = useState({
    totalCases: 0, activeCases: 0, casesThisMonth: 0, settlementsPending: 0,
    vsLastMonth: { totalCases: 0, activeCases: 0, casesThisMonth: 0, settlementsPending: 0 },
  });
  const [recentCases,         setRecentCases]         = useState<any[]>([]);
  const [upcomingLimitations, setUpcomingLimitations] = useState<any[]>([]);
  const [recentActivities,    setRecentActivities]    = useState<any[]>([]);

  // new state
  const [statusBreakdown, setStatusBreakdown] = useState<{ status: string; count: number }[]>([]);
  const [trend,           setTrend]           = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    // original 4 calls — untouched
    dashboardApi.getStats().then(setStats).catch(console.error);
    dashboardApi.getRecentCases().then(setRecentCases).catch(console.error);
    dashboardApi.getUpcomingLimitations().then(setUpcomingLimitations).catch(console.error);
    dashboardApi.getRecentActivities().then(setRecentActivities).catch(console.error);
    // 2 new calls
    dashboardApi.getCaseStatusBreakdown().then(setStatusBreakdown).catch(console.error);
    dashboardApi.getCaseStatusTrend().then(setTrend).catch(console.error);
  }, []);

  const limitationDateStrings = useMemo(
    () => upcomingLimitations.map(u => u.limitation_date),
    [upcomingLimitations]
  );

  const statCards = [
    {
      label: "Total Cases", value: stats.totalCases, sub: "All time cases",
      icon: <Scale className="h-5 w-5" />, iconBg: "bg-primary/10 text-primary",
      pct: stats.vsLastMonth?.totalCases ?? 0,
    },
    {
      label: "Active Cases", value: stats.activeCases, sub: "Currently active",
      icon: <Activity className="h-5 w-5" />, iconBg: "bg-success/10 text-success",
      pct: stats.vsLastMonth?.activeCases ?? 0,
    },
    {
      label: "Cases This Month", value: stats.casesThisMonth, sub: "New cases",
      icon: <Briefcase className="h-5 w-5" />, iconBg: "bg-warning/10 text-warning",
      pct: stats.vsLastMonth?.casesThisMonth ?? 0,
    },
    {
      label: "Settlements Pending", value: stats.settlementsPending, sub: "Awaiting settlement",
      icon: <Clock className="h-5 w-5" />, iconBg: "bg-destructive/10 text-destructive",
      pct: stats.vsLastMonth?.settlementsPending ?? 0,
    },
  ];

  const quickActions = [
    { label: "Add New Case",    sub: "Create a new client & case", icon: <Plus className="h-6 w-6" />,         color: "text-primary bg-primary/10",         onClick: () => navigate("/clients/new") },
    { label: "Add New Client",  sub: "Register a new client",      icon: <UserPlus className="h-6 w-6" />,     color: "text-success bg-success/10",         onClick: () => navigate("/clients/new") },
    { label: "Upload Document", sub: "Upload case documents",      icon: <Upload className="h-6 w-6" />,       color: "text-accent bg-accent/10",           onClick: () => navigate("/documents") },
    { label: "Create OCF",      sub: "Generate OCF forms",         icon: <FileText className="h-6 w-6" />,     color: "text-warning bg-warning/10",         onClick: () => navigate("/cases") },
    { label: "View Cases",      sub: "Browse all cases",           icon: <CalendarDays className="h-6 w-6" />, color: "text-destructive bg-destructive/10", onClick: () => navigate("/cases") },
  ];

  return (
    <AppLayout title="Dashboard">

      {/* Welcome bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <Button onClick={() => navigate("/cases/new")} className="gap-2">
          <Plus className="h-4 w-4" /> New Case
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                  <p className="text-3xl font-bold mt-1 text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.iconBg)}>
                  {s.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                {s.pct > 0
                  ? <TrendingUp className="h-3 w-3 text-success" />
                  : s.pct < 0
                  ? <TrendingDown className="h-3 w-3 text-destructive" />
                  : <Minus className="h-3 w-3 text-muted-foreground" />}
                <span className={cn("text-xs font-medium",
                  s.pct > 0 ? "text-success" : s.pct < 0 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {s.pct > 0 ? "+" : ""}{s.pct}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + right panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 space-y-6">

          {/* Case Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Case Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <DonutChart data={statusBreakdown} />
                  <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 w-full">
                    {statusBreakdown.map((d, i) => (
                      <div key={d.status} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: getColor(d.status, i) }} />
                        <span className="text-xs text-muted-foreground">{d.status}</span>
                        <span className="text-xs font-semibold text-foreground ml-auto">{d.count}</span>
                      </div>
                    ))}
                    {statusBreakdown.length === 0 && (
                      <p className="text-xs text-muted-foreground col-span-2">No cases yet.</p>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Case Trend — Last 14 Days
                  </p>
                  <SparkLine data={trend} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Cases — original table rendering logic, untouched */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Cases</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-7">
                <Link to="/cases">View All <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs pl-4">File No</TableHead>
                    <TableHead className="text-xs">Client Name</TableHead>
                    <TableHead className="text-xs">Date of Loss</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Assigned To</TableHead>
                    <TableHead className="text-xs">Limitation</TableHead>
                    <TableHead className="text-xs w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                        No cases yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentCases.map((c: any) => {
                      const limDays = daysUntil(c.limitation_date);
                      return (
                        <TableRow key={c.id} className="text-sm hover:bg-muted/30">
                          <TableCell className="py-2 pl-4">
                            <Link to={`/cases/${c.id}`} className="font-medium text-primary hover:underline">
                              {c.file_no}
                            </Link>
                          </TableCell>
                          <TableCell className="py-2">{c.first_name} {c.last_name}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{formatDate(c.date_of_loss)}</TableCell>
                          <TableCell className="py-2">
                            <Badge className={cn("text-xs", statusColor[c.file_status])}>{c.file_status}</Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            {c.clerk_assigned ? (
                              <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {c.clerk_assigned.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-xs">{c.clerk_assigned}</span>
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell className={cn("py-2 text-xs",
                            limDays !== null && limDays <= 7 && limDays >= 0
                              ? "text-destructive font-semibold" : "text-muted-foreground"
                          )}>
                            {formatDate(c.limitation_date)}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                              <Link to={`/cases/${c.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming Limitation Dates — original rendering logic, untouched */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">Upcoming Limitation Dates</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-7">
                <Link to="/cases">View All <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingLimitations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No upcoming limitations within 30 days.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingLimitations.map((c: any) => {
                    const days = daysUntil(c.limitation_date);
                    return (
                      <Link key={c.id} to={`/cases/${c.id}`}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {c.first_name} {c.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{c.file_no}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs text-muted-foreground">{formatDate(c.limitation_date)}</p>
                          <Badge variant={days !== null && days <= 7 ? "destructive" : "secondary"}
                            className="text-[10px] mt-0.5">
                            {days} days
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities — original rendering logic, untouched */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Activities</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-7">
                <Link to="/cases">View All <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No recent activities.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.slice(0, 6).map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <ActivityIcon type={a.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-tight">
                          {a.regarding || a.type}
                          {a.file_no && <span className="text-muted-foreground"> · {a.file_no}</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(a.date)} · {a.record_manager || a.author || "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar Overview — new */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">Calendar Overview</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-7">
                <Link to="/cases">View Calendar <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <MiniCalendar limitationDates={limitationDateStrings} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((a) => (
              <button key={a.label} onClick={a.onClick}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/40 transition-all group text-center">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", a.color)}>
                  {a.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{a.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

    </AppLayout>
  );
}