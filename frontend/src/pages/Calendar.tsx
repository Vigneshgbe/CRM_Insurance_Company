import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDate, daysUntil } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, CalendarDays, AlertTriangle,
  Clock, Eye, Filter,
} from "lucide-react";
import { dashboardApi, casesApi } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────
interface LimitationCase {
  id: string;
  file_no: string;
  first_name: string;
  last_name: string;
  limitation_date: string;
  file_status: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  limitations: LimitationCase[];
}

// ── Helpers ────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Active:      "bg-success text-success-foreground",
  Closed:      "bg-muted text-muted-foreground",
  Pending:     "bg-warning text-warning-foreground",
  "On Hold":   "bg-muted text-muted-foreground",
  Settled:     "bg-primary text-primary-foreground",
  Litigation:  "bg-destructive text-destructive-foreground",
  Mediation:   "bg-warning text-warning-foreground",
  Arbitration: "bg-destructive text-destructive-foreground",
};

const URGENCY_COLORS = (days: number | null) => {
  if (days === null) return "bg-muted text-muted-foreground";
  if (days <= 7)  return "bg-destructive text-destructive-foreground";
  if (days <= 14) return "bg-warning text-warning-foreground";
  return "bg-success text-success-foreground";
};

function buildCalendarGrid(year: number, month: number, limitationMap: Map<string, LimitationCase[]>): CalendarDay[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();

  const cells: CalendarDay[] = [];

  // Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    cells.push({ date: d, isCurrentMonth: false, isToday: false, limitations: [] });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = date.toDateString() === today.toDateString();
    cells.push({
      date,
      isCurrentMonth: true,
      isToday,
      limitations: limitationMap.get(key) ?? [],
    });
  }

  // Next month leading days — fill to complete last row
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      cells.push({ date, isCurrentMonth: false, isToday: false, limitations: [] });
    }
  }

  return cells;
}

// ── Calendar Page ──────────────────────────────────────────────
export default function CalendarPage() {
  const today = new Date();
  const [curYear,  setCurYear]  = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [filter,   setFilter]   = useState<"all" | "critical" | "upcoming">("all");

  const [allCases,      setAllCases]      = useState<LimitationCase[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch all cases to get limitation dates across all months
    casesApi.getAll()
      .then((cases: any[]) => {
        const mapped: LimitationCase[] = cases
          .filter(c => c.limitationDate || c.limitation_date)
          .map(c => ({
            id:               c.id,
            file_no:          c.fileNo || c.file_no,
            first_name:       c.client?.firstName || c.first_name || "",
            last_name:        c.client?.lastName  || c.last_name  || "",
            limitation_date:  c.limitationDate    || c.limitation_date,
            file_status:      c.fileStatus        || c.file_status,
          }));
        setAllCases(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build a map: "YYYY-MM-DD" → cases with limitation on that date
  const limitationMap = useMemo(() => {
    const map = new Map<string, LimitationCase[]>();
    allCases.forEach(c => {
      if (!c.limitation_date) return;
      const key = String(c.limitation_date).slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return map;
  }, [allCases]);

  const calendarDays = useMemo(
    () => buildCalendarGrid(curYear, curMonth, limitationMap),
    [curYear, curMonth, limitationMap]
  );

  // Sidebar list — all cases with limitations, sorted by date, filterable
  const sidebarCases = useMemo(() => {
    const withDays = allCases
      .filter(c => c.limitation_date)
      .map(c => ({ ...c, days: daysUntil(c.limitation_date) }))
      .sort((a, b) => {
        if (a.days === null) return 1;
        if (b.days === null) return -1;
        return a.days - b.days;
      });

    if (filter === "critical") return withDays.filter(c => c.days !== null && c.days <= 7);
    if (filter === "upcoming") return withDays.filter(c => c.days !== null && c.days <= 30);
    return withDays;
  }, [allCases, filter]);

  const prevMonth = () => {
    if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); }
    else setCurMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1); }
    else setCurMonth(m => m + 1);
  };
  const goToday = () => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); };

  const monthName = new Date(curYear, curMonth, 1).toLocaleString("default", { month: "long", year: "numeric" });

  // Stats
  const criticalCount  = allCases.filter(c => { const d = daysUntil(c.limitation_date); return d !== null && d <= 7; }).length;
  const upcomingCount  = allCases.filter(c => { const d = daysUntil(c.limitation_date); return d !== null && d <= 30; }).length;
  const totalCount     = allCases.length;

  return (
    <AppLayout title="Calendar">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {/* <h2 className="text-lg font-semibold text-foreground">Case Calendar</h2> */}
          <p className="text-sm text-muted-foreground">Limitation dates and case deadlines overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={goToday} className="gap-2">
          <CalendarDays className="h-4 w-4" /> Today
        </Button>
      </div>

      {/* ── Summary stat strip ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Critical (≤7 days)</p>
              <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Upcoming (≤30 days)</p>
              <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total with Limits</p>
              <p className="text-2xl font-bold text-foreground">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main grid: Calendar (3/5) + Sidebar list (2/5) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Full Calendar ── */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{monthName}</CardTitle>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={nextMonth}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((cell, i) => {
                  const hasLimit = cell.limitations.length > 0;
                  const firstLimit = cell.limitations[0];
                  const days = firstLimit ? daysUntil(firstLimit.limitation_date) : null;
                  const isCritical  = days !== null && days <= 7;
                  const isUpcoming  = days !== null && days <= 14 && days > 7;

                  return (
                    <div key={i} className={cn(
                      "min-h-[80px] p-1.5 border-b border-r border-border/50 transition-colors",
                      !cell.isCurrentMonth && "bg-muted/20",
                      cell.isToday && "bg-primary/5",
                      hasLimit && cell.isCurrentMonth && "bg-destructive/3",
                    )}>
                      {/* Date number */}
                      <div className={cn(
                        "h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium mb-1",
                        cell.isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : cell.isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                      )}>
                        {cell.date.getDate()}
                      </div>

                      {/* Limitation pills */}
                      {cell.isCurrentMonth && cell.limitations.map((lim, li) => (
                        li < 2 ? (
                          <Link key={lim.id} to={`/cases/${lim.id}`}
                            className={cn(
                              "block w-full text-[9px] font-medium px-1 py-0.5 rounded mb-0.5 truncate leading-tight",
                              isCritical  ? "bg-destructive/15 text-destructive" :
                              isUpcoming  ? "bg-warning/15 text-warning" :
                                            "bg-primary/10 text-primary"
                            )}
                            title={`${lim.first_name} ${lim.last_name} — ${lim.file_no}`}
                          >
                            {lim.file_no}
                          </Link>
                        ) : li === 2 ? (
                          <span key="more" className="block text-[9px] text-muted-foreground px-1">
                            +{cell.limitations.length - 2} more
                          </span>
                        ) : null
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 px-4 pt-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-destructive/20" />
                  <span className="text-xs text-muted-foreground">Critical ≤7d</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-warning/20" />
                  <span className="text-xs text-muted-foreground">Upcoming ≤14d</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-primary/15" />
                  <span className="text-xs text-muted-foreground">Limitation date</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar: sorted limitation list ── */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Limitation Dates</CardTitle>
                <div className="flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              {/* Filter tabs */}
              <div className="flex gap-1 mt-2">
                {(["all","upcoming","critical"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize",
                      filter === f
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}>
                    {f === "all" ? "All" : f === "upcoming" ? "≤30 days" : "Critical"}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
              ) : sidebarCases.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No limitation dates found.
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {sidebarCases.map((c) => {
                    const days = c.days;
                    return (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-foreground truncate">
                              {c.first_name} {c.last_name}
                            </p>
                            <Badge className={cn("text-[10px] shrink-0", STATUS_COLORS[c.file_status])}>
                              {c.file_status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.file_no}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Limit: {formatDate(c.limitation_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <Badge className={cn("text-xs", URGENCY_COLORS(days))}>
                            {days !== null
                              ? days === 0 ? "Today!"
                              : days < 0   ? `${Math.abs(days)}d ago`
                              : `${days}d`
                              : "—"}
                          </Badge>
                          <Link to={`/cases/${c.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </AppLayout>
  );
}