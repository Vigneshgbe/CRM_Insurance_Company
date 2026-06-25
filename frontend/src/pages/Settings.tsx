import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"users" | "system">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee", displayRole: "Staff" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.name || !form.email || !form.password) {
      toast({ title: "Fill all fields", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await usersApi.create(form);
      toast({ title: "User added" });
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "employee", displayRole: "Staff" });
      loadUsers();
    } catch (err: any) {
      toast({ title: err.message || "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this user?")) return;
    await usersApi.delete(id);
    toast({ title: "User deactivated" });
    loadUsers();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["users", "system"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "users" ? "Users" : "System"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="bg-white rounded-lg border">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">System Users</h2>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="flex gap-2">
              <Plus className="w-4 h-4" /> Add User
            </Button>
          </div>

          {/* Add user form */}
          {showAdd && (
            <div className="p-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={form.displayRole}
                  onChange={(e) => setForm({ ...form, displayRole: e.target.value, role: e.target.value === "Client" ? "client" : "employee" })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Staff</option>
                  <option>Client</option>
                </select>
              </div>
              <Button onClick={handleAdd} disabled={saving}>{saving ? "Adding..." : "Add"}</Button>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      {u.display_role || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(u.id)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "system" && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold">System Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Application Name</Label>
              <Input defaultValue="Hypernova CRM" />
            </div>
            <div>
              <Label>Company Name</Label>
              <Input defaultValue="Matrix Legal Services" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">More system settings coming soon.</p>
        </div>
      )}
    </div>
  );
}
