import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const TABS = ["Users", "Templates", "Lookup Values", "System"];

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Users");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", displayRole: "Staff" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === "Users") loadUsers();
  }, [activeTab]);

  async function loadUsers() {
    setLoading(true);
    try { setUsers(await usersApi.getAll()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.name || !form.email || !form.password) {
      toast({ title: "All fields required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await usersApi.create({ ...form, role: form.displayRole === "Client" ? "client" : "employee" });
      toast({ title: "User added successfully" });
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", displayRole: "Staff" });
      loadUsers();
    } catch (err: any) {
      toast({ title: err.message || "Failed to add user", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this user?")) return;
    try {
      await usersApi.delete(id);
      toast({ title: "User deactivated" });
      loadUsers();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  }

  return (
    <AppLayout title="Settings">
      <div className="flex gap-1 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Users" && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">System Users</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Full name" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Password" />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={form.displayRole} onValueChange={(v) => setForm({...form, displayRole: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={saving}>{saving ? "Adding..." : "Add User"}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Loading...</TableCell></TableRow>
                ) : users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="py-2 font-medium">{u.name}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="py-2">
                      <Badge variant="secondary" className="text-xs">{u.display_role || u.role}</Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={cn("text-xs", u.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "Templates" && (
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Template settings coming soon.</p></CardContent></Card>
      )}
      {activeTab === "Lookup Values" && (
        <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Lookup values settings coming soon.</p></CardContent></Card>
      )}
      {activeTab === "System" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label>Application Name</Label>
              <Input defaultValue="Hypernova CRM" className="mt-1 max-w-xs" />
            </div>
            <div>
              <Label>Company Name</Label>
              <Input defaultValue="Matrix Legal Services" className="mt-1 max-w-xs" />
            </div>
            <Button size="sm">Save Settings</Button>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
