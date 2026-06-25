import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, daysUntil } from "@/lib/formatters";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { dashboardApi } from "@/lib/api";

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

export default function Dashboard() {
  const [stats, setStats] = useState({ totalCases: 0, activeCases: 0, casesThisMonth: 0, settlementsPending: 0 });
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [upcomingLimitations, setUpcomingLimitations] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    dashboardApi.getStats().then(setStats).catch(console.error);
    dashboardApi.getRecentCases().then(setRecentCases).catch(console.error);
    dashboardApi.getUpcomingLimitations().then(setUpcomingLimitations).catch(console.error);
    dashboardApi.getRecentActivities().then(setRecentActivities).catch(console.error);
  }, []);

  const statCards = [
    { label: "Total Cases", value: stats.totalCases, className: "border-l-primary" },
    { label: "Active Cases", value: stats.activeCases, className: "border-l-success" },
    { label: "Cases This Month", value: stats.casesThisMonth, className: "border-l-warning" },
    { label: "Settlements Pending", value: stats.settlementsPending, className: "border-l-destructive" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label} className={cn("border-l-4", s.className)}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Cases</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">File No</TableHead>
                    <TableHead className="text-xs">Client Name</TableHead>
                    <TableHead className="text-xs">Date of Loss</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Assigned To</TableHead>
                    <TableHead className="text-xs">Limitation</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">No cases yet.</TableCell>
                    </TableRow>
                  ) : (
                    recentCases.map((c: any) => {
                      const limDays = daysUntil(c.limitation_date);
                      return (
                        <TableRow key={c.id} className="text-sm">
                          <TableCell className="py-2 font-medium">{c.file_no}</TableCell>
                          <TableCell className="py-2">{c.first_name} {c.last_name}</TableCell>
                          <TableCell className="py-2">{formatDate(c.date_of_loss)}</TableCell>
                          <TableCell className="py-2">
                            <Badge className={cn("text-xs", statusColor[c.file_status])}>{c.file_status}</Badge>
                          </TableCell>
                          <TableCell className="py-2">{c.clerk_assigned || "—"}</TableCell>
                          <TableCell className={cn("py-2", limDays !== null && limDays <= 7 && limDays >= 0 ? "text-destructive font-semibold" : "")}>
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

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Limitation Dates</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingLimitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming limitations within 30 days.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingLimitations.map((c: any) => {
                    const days = daysUntil(c.limitation_date);
                    return (
                      <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-muted-foreground">{c.file_no}</p>
                        </div>
                        <Badge variant={days !== null && days <= 7 ? "destructive" : "secondary"} className="text-xs">
                          {days} days
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activities.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm">{a.regarding || a.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(a.date)} · {a.record_manager || a.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
