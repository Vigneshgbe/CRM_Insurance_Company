import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contactAccessApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface Props { caseId: string; }

export default function ContactAccessTab({ caseId }: Props) {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", accessLevel: "Read Only" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [caseId]);

  async function load() {
    setLoading(true);
    try { setContacts(await contactAccessApi.getByCaseId(caseId)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.name) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await contactAccessApi.create(caseId, { ...form, dateAdded: new Date().toISOString().slice(0, 10) });
      setForm({ name: "", role: "", accessLevel: "Read Only" });
      setShowForm(false);
      toast({ title: "Contact added" });
      load();
    } catch (err) {
      toast({ title: "Failed to add", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this contact?")) return;
    await contactAccessApi.delete(caseId, id);
    toast({ title: "Removed" });
    load();
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>+ Add Contact</Button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm">Add Contact Access</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Spouse" />
            </div>
            <div>
              <Label>Access Level</Label>
              <select
                value={form.accessLevel}
                onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Read Only</option>
                <option>Full Access</option>
                <option>Documents Only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Add"}</Button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Access Level</th>
              <th className="px-4 py-2 font-medium">Date Added</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">No contacts added yet.</td></tr>
            ) : (
              contacts.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.role || "—"}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{c.accessLevel}</span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{c.dateAdded}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
