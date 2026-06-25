import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";
const TYPES = ["Note","Task","Call","Email","Appointment"];

export default function ActivitiesTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "Note", regarding: "", details: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5) });

  async function load() {
    const r = await fetch(`${API}/cases/${caseId}/activities`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) setActivities(await r.json());
  }

  useEffect(() => { load(); }, [caseId]);

  async function addActivity() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...form, recordManager: user?.name || "Staff", companyGroup: "Internal" }),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Activity added" });
      setForm({ type: "Note", regarding: "", details: "", date: new Date().toISOString().slice(0,10), time: new Date().toTimeString().slice(0,5) });
      setOpen(false); load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function deleteActivity(id: string) {
    if (!confirm("Delete?")) return;
    await fetch(`${API}/cases/${caseId}/activities/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  const filtered = filter === "All" ? activities : activities.filter(a => a.type === filter);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          {["All", ...TYPES].map(t => (
            <Button key={t} size="sm" variant={filter === t ? "default" : "outline"} className="h-7 text-xs" onClick={() => setFilter(t)}>{t}</Button>
          ))}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Activity</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-1">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Time</Label><Input type="time" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))} className="mt-1 h-9" /></div>
              </div>
              <div><Label className="text-xs">Regarding</Label><Input value={form.regarding} onChange={e => setForm(f=>({...f,regarding:e.target.value}))} className="mt-1 h-9" /></div>
              <div><Label className="text-xs">Details</Label><Textarea value={form.details} onChange={e => setForm(f=>({...f,details:e.target.value}))} className="mt-1" rows={4} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={addActivity} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activities yet.</p>
        ) : filtered.map((a: any) => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{a.type}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(a.date)} {a.time && `· ${a.time}`} · {a.recordManager}</span>
                  </div>
                  {a.regarding && <p className="text-sm font-medium">{a.regarding}</p>}
                  {a.details && <p className="text-sm text-muted-foreground mt-0.5">{a.details}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteActivity(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
