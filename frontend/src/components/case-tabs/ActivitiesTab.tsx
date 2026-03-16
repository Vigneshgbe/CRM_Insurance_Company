import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActivitiesByCaseId, type Activity } from "@/data/mockData";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const typeBadge: Record<string, string> = {
  Note: "bg-primary text-primary-foreground",
  Task: "bg-warning text-warning-foreground",
  Call: "bg-success text-success-foreground",
  Email: "bg-secondary text-secondary-foreground",
  Appointment: "bg-destructive text-destructive-foreground",
};

export default function ActivitiesTab({ caseId }: { caseId: string }) {
  const [activities, setActivities] = useState<Activity[]>(getActivitiesByCaseId(caseId));
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: "Note", regarding: "", details: "", assignedTo: "" });
  const { toast } = useToast();

  const filtered = filter === "All" ? activities : activities.filter((a) => a.type === filter);

  const addActivity = () => {
    const a: Activity = {
      id: `a${Date.now()}`, caseId, date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5), type: newActivity.type,
      regarding: newActivity.regarding, details: newActivity.details,
      recordManager: "Amanda Singh", companyGroup: "Internal",
    };
    setActivities([a, ...activities]);
    setOpen(false);
    setNewActivity({ type: "Note", regarding: "", details: "", assignedTo: "" });
    toast({ title: "Activity Added" });
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Activities</CardTitle>
        <div className="flex gap-2">
          <div className="flex gap-0.5">
            {["All", ...ACTIVITY_TYPES].map((t) => (
              <Button key={t} variant={filter === t ? "default" : "outline"} size="sm" className="text-xs h-7 px-2" onClick={() => setFilter(t)}>{t}</Button>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Activity</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Type</Label>
                  <Select value={newActivity.type} onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Regarding</Label><Input value={newActivity.regarding} onChange={(e) => setNewActivity({ ...newActivity, regarding: e.target.value })} className="h-8 text-sm mt-1" /></div>
                <div><Label className="text-xs">Details</Label><Textarea value={newActivity.details} onChange={(e) => setNewActivity({ ...newActivity, details: e.target.value })} rows={3} className="text-sm mt-1" /></div>
                <div><Label className="text-xs">Assigned To</Label><Input value={newActivity.assignedTo} onChange={(e) => setNewActivity({ ...newActivity, assignedTo: e.target.value })} className="h-8 text-sm mt-1" /></div>
                <Button onClick={addActivity} className="w-full">Add Activity</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Time</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Regarding</TableHead>
            <TableHead className="text-xs">Record Manager</TableHead>
            <TableHead className="text-xs">Company/Group</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id} className="text-sm">
                <TableCell className="py-2">{formatDate(a.date)}</TableCell>
                <TableCell className="py-2">{a.time}</TableCell>
                <TableCell className="py-2"><Badge className={cn("text-xs", typeBadge[a.type] || "bg-secondary")}>{a.type}</Badge></TableCell>
                <TableCell className="py-2">{a.regarding}</TableCell>
                <TableCell className="py-2">{a.recordManager}</TableCell>
                <TableCell className="py-2">{a.companyGroup}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="py-4 text-center text-sm text-muted-foreground">No activities.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
