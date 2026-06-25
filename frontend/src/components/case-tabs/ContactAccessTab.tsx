import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { Plus, Trash2 } from "lucide-react";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

export default function ContactAccessTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", accessLevel: "Read Only", dateAdded: new Date().toISOString().slice(0,10) });

  async function load() {
    const r = await fetch(`${API}/cases/${caseId}/contact-access`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) setContacts(await r.json());
  }

  useEffect(() => { load(); }, [caseId]);

  async function addContact() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/cases/${caseId}/contact-access`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Contact added" });
      setForm({ name: "", role: "", accessLevel: "Read Only", dateAdded: new Date().toISOString().slice(0,10) });
      setOpen(false); load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Remove?")) return;
    await fetch(`${API}/cases/${caseId}/contact-access/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Contact</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Contact Access</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-1">
              <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="mt-1 h-9" /></div>
              <div><Label className="text-xs">Role</Label><Input value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} className="mt-1 h-9" placeholder="e.g. Spouse, Lawyer" /></div>
              <div>
                <Label className="text-xs">Access Level</Label>
                <Select value={form.accessLevel} onValueChange={v => setForm(f=>({...f,accessLevel:v}))}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Read Only">Read Only</SelectItem>
                    <SelectItem value="Full Access">Full Access</SelectItem>
                    <SelectItem value="Limited">Limited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Date Added</Label><Input type="date" value={form.dateAdded} onChange={e => setForm(f=>({...f,dateAdded:e.target.value}))} className="mt-1 h-9" /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={addContact} disabled={saving}>{saving ? "Saving..." : "Add"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs">Role</TableHead>
            <TableHead className="text-xs">Access Level</TableHead>
            <TableHead className="text-xs">Date Added</TableHead>
            <TableHead className="text-xs w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">No contacts added.</TableCell></TableRow>
          ) : contacts.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="py-2 font-medium">{c.name}</TableCell>
              <TableCell className="py-2">{c.role}</TableCell>
              <TableCell className="py-2">{c.accessLevel}</TableCell>
              <TableCell className="py-2">{formatDate(c.dateAdded)}</TableCell>
              <TableCell className="py-2">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
