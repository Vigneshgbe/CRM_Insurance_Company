import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cases, activities } from "@/data/mockData";
import { formatDate, daysUntil, isWithinDays } from "@/lib/formatters";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

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
  const activeCases = cases.filter((c) => c.fileStatus === "Active").length;
  const thisMonth = cases.filter((c) => {
    const d = new Date(c.openDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const pendingSettlements = cases.filter((c) => c.fileStatus === "Pending" || c.fileStatus === "Settled").length;

  const upcomingLimitations = cases
    .filter((c) => isWithinDays(c.limitationDate, 30) && c.fileStatus !== "Closed" && c.fileStatus !== "Settled")
    .sort((a, b) => new Date(a.limitationDate).getTime() - new Date(b.limitationDate).getTime());

  const recentActivities = activities.slice(0, 5);

  const stats = [
    { label: "Total Cases", value: cases.length, className: "border-l-primary" },
    { label: "Active Cases", value: activeCases, className: "border-l-success" },
    { label: "Cases This Month", value: thisMonth, className: "border-l-warning" },
    { label: "Settlements Pending", value: pendingSettlements, className: "border-l-destructive" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
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
                  {cases.map((c) => {
                    const limDays = daysUntil(c.limitationDate);
                    return (
                      <TableRow key={c.id} className="text-sm">
                        <TableCell className="py-2 font-medium">{c.fileNo}</TableCell>
                        <TableCell className="py-2">{c.client.firstName} {c.client.lastName}</TableCell>
                        <TableCell className="py-2">{formatDate(c.dateOfLoss)}</TableCell>
                        <TableCell className="py-2"><Badge className={cn("text-xs", statusColor[c.fileStatus])}>{c.fileStatus}</Badge></TableCell>
                        <TableCell className="py-2">{c.clerkAssigned}</TableCell>
                        <TableCell className={cn("py-2", limDays <= 7 && limDays >= 0 ? "text-destructive font-semibold" : "")}>{formatDate(c.limitationDate)}</TableCell>
                        <TableCell className="py-2">
                          <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                            <Link to={`/cases/${c.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                  {upcomingLimitations.map((c) => {
                    const days = daysUntil(c.limitationDate);
                    return (
                      <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{c.client.firstName} {c.client.lastName}</p>
                          <p className="text-xs text-muted-foreground">{c.fileNo}</p>
                        </div>
                        <Badge variant={days <= 7 ? "destructive" : "secondary"} className="text-xs">
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
              <div className="space-y-3">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm">{a.regarding}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(a.date)} · {a.recordManager}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
