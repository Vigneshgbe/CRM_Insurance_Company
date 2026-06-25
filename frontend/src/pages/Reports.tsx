import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { formatDate, daysUntil } from "@/lib/formatters";
import { reportsApi } from "@/lib/api";

export default function Reports() {
  const [statusData, setStatusData] = useState<any[]>([]);
  const [monthData, setMonthData] = useState<any[]>([]);
  const [limitations, setLimitations] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

  useEffect(() => {
    reportsApi.getStatusSummary().then(setStatusData).catch(console.error);
    reportsApi.getMonthly().then(setMonthData).catch(console.error);
    reportsApi.getLimitations().then(setLimitations).catch(console.error);
    reportsApi.getSettlements().then(setSettlements).catch(console.error);
  }, []);

  return (
    <AppLayout title="Reports">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cases by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cases by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="cases" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Limitation Date Alerts (Next 90 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">File No</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Limitation Date</TableHead>
                  <TableHead className="text-xs">Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limitations.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4 text-sm">No upcoming limitations.</TableCell></TableRow>
                ) : (
                  limitations.map((l: any) => {
                    const days = daysUntil(l.limitation_date);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="py-2 text-xs font-mono">{l.file_no}</TableCell>
                        <TableCell className="py-2 text-xs">{l.first_name} {l.last_name}</TableCell>
                        <TableCell className="py-2 text-xs">{formatDate(l.limitation_date)}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant={days <= 30 ? "destructive" : "secondary"} className="text-xs">{days}d</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Settlements Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">File No</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Settlement</TableHead>
                  <TableHead className="text-xs">Pay to Client</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4 text-sm">No settled cases yet.</TableCell></TableRow>
                ) : (
                  settlements.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="py-2 text-xs font-mono">{s.file_no}</TableCell>
                      <TableCell className="py-2 text-xs">{s.first_name} {s.last_name}</TableCell>
                      <TableCell className="py-2 text-xs">{s.final_settlement ? `$${Number(s.final_settlement).toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="py-2 text-xs">{s.pay_to_client ? `$${Number(s.pay_to_client).toLocaleString()}` : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
