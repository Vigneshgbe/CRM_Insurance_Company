import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { notesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface Props { caseId: string; }

export default function NotesTab({ caseId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [caseId]);

  async function load() {
    setLoading(true);
    try {
      const data = await notesApi.getByCaseId(caseId);
      setNotes(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const now = new Date();
      await notesApi.create(caseId, {
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        author: user?.name || "System",
        text: text.trim(),
      });
      setText("");
      toast({ title: "Note added" });
      load();
    } catch (err) {
      toast({ title: "Failed to save note", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this note?")) return;
    await notesApi.delete(caseId, noteId);
    toast({ title: "Note deleted" });
    load();
  }

  return (
    <div className="space-y-4 p-4">
      {/* Add note */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm">Add Note</h3>
        <Textarea
          placeholder="Type your note here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button onClick={handleAdd} disabled={saving || !text.trim()} size="sm">
            {saving ? "Saving..." : "Add Note"}
          </Button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note: any) => (
            <div key={note.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
                </div>
                <button onClick={() => handleDelete(note.id)} className="ml-3 text-muted-foreground hover:text-red-500 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {note.date} {note.time} · {note.author}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
