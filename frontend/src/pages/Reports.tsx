import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cases } from "@/data/mockData";
import { formatCurrency, formatDate, daysUntil } from "@/lib/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Reports() {
  const statusData = [
    { status: "Active", count: cases.filter((c) => c.fileStatus === "Active").length },
    { status: "Pending", count: cases.filter((c) => c.fileStatus === "Pending").length },
    { status: "Litigation", count: cases.filter((c) => c.fileStatus === "Litigation").length },
    { status: "Settled", count: cases.filter((c) => c.fileStatus === "Settled").length },
    { status: "Closed", count: cases.filter((c) => c.fileStatus === "Closed").length },
  ];

  const monthData = [
    { month: "Jul", cases: 1 }, { month: "Aug", cases: 2 }, { month: "Sep", cases: 1 },
    { month: "Oct", cases: 3 }, { month: "Nov", cases: 2 }, { month: "Dec", cases: 1 },
  ];

  const limitationAlerts = cases
    .filter((c) => daysUntil(c.limitationDate) <= 90 && daysUntil(c.limitationDate) >= 0)
    .sort((a, b) => daysUntil(a.limitationDate) - daysUntil(b.limitationDate));

  return (
    <AppLayout title="Reports">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Cases by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Cases by Month</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="cases" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Settlements Summary</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">File No</TableHead>
                  <TableHead className="text-xs">Settlement</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.filter(c => c.fileStatus === "Settled").map((c) => (
                  <TableRow key={c.id} className="text-sm">
                    <TableCell className="py-2">{c.client.firstName} {c.client.lastName}</TableCell>
                    <TableCell className="py-2">{c.fileNo}</TableCell>
                    <TableCell className="py-2">{formatCurrency(85000)}</TableCell>
                    <TableCell className="py-2"><Badge className="bg-success text-success-foreground text-xs">Settled</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Limitation Dates Alert</CardTitle></CardHeader>
          <CardContent>
            {limitationAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming limitations within 90 days.</p>
            ) : (
              <div className="space-y-2">
                {limitationAlerts.map((c) => {
                  const days = daysUntil(c.limitationDate);
                  return (
                    <div key={c.id} className="flex justify-between items-center p-2 rounded border">
                      <div>
                        <p className="text-sm font-medium">{c.client.firstName} {c.client.lastName}</p>
                        <p className="text-xs text-muted-foreground">{c.fileNo} · {formatDate(c.limitationDate)}</p>
                      </div>
                      <Badge variant={days <= 7 ? "destructive" : days <= 30 ? "secondary" : "outline"} className="text-xs">
                        {days} days
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
