import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

export default function NotesTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch(`${API}/cases/${caseId}/notes`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) setNotes(await r.json());
  }

  useEffect(() => { load(); }, [caseId]);

  async function addNote() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ date, time, author: user?.name || "Staff", text }),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Note added" });
      setText(""); setOpen(false); load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function deleteNote(noteId: string) {
    if (!confirm("Delete this note?")) return;
    await fetch(`${API}/cases/${caseId}/notes/${noteId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 h-9" /></div>
                <div><Label className="text-xs">Time</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 h-9" /></div>
              </div>
              <div><Label className="text-xs">Note</Label><Textarea value={text} onChange={e => setText(e.target.value)} className="mt-1" rows={5} placeholder="Enter note..." /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={addNote} disabled={saving}>{saving ? "Saving..." : "Save Note"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No notes yet.</p>
        ) : notes.map((n: any) => (
          <Card key={n.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{formatDate(n.date)} {n.time && `· ${n.time}`} · <span className="font-medium">{n.author}</span></p>
                  <p className="text-sm whitespace-pre-wrap">{n.text}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteNote(n.id)}>
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
