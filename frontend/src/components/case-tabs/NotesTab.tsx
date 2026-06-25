import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

interface Note {
  id: string;
  caseId: string;
  date: string;
  time: string;
  author: string;
  text: string;
}

function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

export default function NotesTab({ caseId }: { caseId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${API_BASE_URL}/cases/${caseId}/notes`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => setNotes([]))
      .finally(() => setFetching(false));
  }, [caseId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text: newNote }),
      });
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
      setOpen(false);
      toast({ title: "Note Added" });
    } catch {
      toast({ title: "Failed to add note", variant: "destructive" });
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/cases/${caseId}/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "Note Deleted" });
    } catch {
      toast({ title: "Failed to delete note", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Notes</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Enter note..." rows={4} />
            <Button onClick={addNote}>Save Note</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Time</TableHead>
              <TableHead className="text-xs">Author</TableHead>
              <TableHead className="text-xs">Note</TableHead>
              <TableHead className="text-xs w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching && (
              <TableRow><TableCell colSpan={5} className="py-4 text-center text-sm text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {!fetching && notes.map((n) => (
              <TableRow key={n.id} className="text-sm">
                <TableCell className="py-2">{formatDate(n.date)}</TableCell>
                <TableCell className="py-2">{n.time}</TableCell>
                <TableCell className="py-2">{n.author}</TableCell>
                <TableCell className="py-2 max-w-md truncate">{n.text}</TableCell>
                <TableCell className="py-2">
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNote(n.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!fetching && notes.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-4 text-center text-sm text-muted-foreground">No notes yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
