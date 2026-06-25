import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { activitiesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const ACTIVITY_TYPES = ["Note", "Task", "Call", "Email", "Appointment"];

interface Props { caseId: string; }

export default function ActivitiesTab({ caseId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "Call", regarding: "", details: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [caseId]);

  async function load() {
    setLoading(true);
    try {
      const data = await activitiesApi.getByCaseId(caseId);
      setActivities(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.regarding.trim()) { toast({ title: "Regarding field required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const now = new Date();
      await activitiesApi.create(caseId, {
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        type: form.type,
        regarding: form.regarding,
        details: form.details,
        recordManager: user?.name || "System",
        companyGroup: "Internal",
      });
      setForm({ type: "Call", regarding: "", details: "" });
      setShowForm(false);
      toast({ title: "Activity added" });
      load();
    } catch (err) {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this activity?")) return;
    await activitiesApi.delete(caseId, id);
    toast({ title: "Deleted" });
    load();
  }

  const typeColor: Record<string, string> = {
    Note: "bg-gray-100 text-gray-600",
    Task: "bg-purple-100 text-purple-700",
    Call: "bg-blue-100 text-blue-700",
    Email: "bg-green-100 text-green-700",
    Appointment: "bg-orange-100 text-orange-700",
  };

  const filtered = filter === "All" ? activities : activities.filter((a) => a.type === filter);

  return (
    <div className="space-y-4 p-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {["All", ...ACTIVITY_TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === t ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>+ Add Activity</Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm">New Activity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Regarding</Label>
              <Input value={form.regarding} onChange={(e) => setForm({ ...form, regarding: e.target.value })} placeholder="Subject..." />
            </div>
          </div>
          <div>
            <Label>Details</Label>
            <Textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} rows={2} placeholder="Details..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activities found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <div key={a.id} className="bg-white border rounded-lg p-4 flex items-start gap-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${typeColor[a.type] || "bg-gray-100 text-gray-600"}`}>
                {a.type}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.regarding}</p>
                {a.details && <p className="text-sm text-muted-foreground mt-1">{a.details}</p>}
                <p className="text-xs text-muted-foreground mt-1">{a.date} {a.time} · {a.recordManager}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-red-500 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
