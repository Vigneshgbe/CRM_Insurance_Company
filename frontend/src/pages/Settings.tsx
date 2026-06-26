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
import { cn } from "@/lib/utils";
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/constants";

function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

// ── Tabs — Templates and Lookup Values removed ────────────────────────────────
const TABS = ["Users", "System"];

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Users");

  // ── Users state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", displayRole: "Staff" });
  const [saving, setSaving] = useState(false);

  // ── System settings state ──────────────────────────────────────────────────
  const [systemSettings, setSystemSettings] = useState({
    appName: "",
    companyName: "",
    adminEmail: "",
    timezone: "America/Toronto",
    dateFormat: "DD/MM/YYYY",
    currency: "CAD",
  });
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [savingSystem, setSavingSystem] = useState(false);

  // ── Load users ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "Users") loadUsers();
    if (activeTab === "System") loadSystemSettings();
  }, [activeTab]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      setUsers(await usersApi.getAll());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleAddUser() {
    if (!form.name || !form.email || !form.password) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await usersApi.create({
        ...form,
        role: form.displayRole === "Client" ? "client" : "employee",
      });
      toast({ title: "User added successfully" });
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", displayRole: "Staff" });
      loadUsers();
    } catch (err: any) {
      toast({ title: err.message || "Failed to add user", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Deactivate this user?")) return;
    try {
      await usersApi.delete(id);
      toast({ title: "User deactivated" });
      loadUsers();
    } catch {
      toast({ title: "Failed to deactivate user", variant: "destructive" });
    }
  }

  // ── System settings — stored in localStorage as simple key-value ──────────
  // A full backend settings table is a future task; for now we persist to
  // localStorage so values survive refresh without extra DB work.
  function loadSystemSettings() {
    setLoadingSystem(true);
    try {
      const stored = localStorage.getItem("crm_system_settings");
      if (stored) {
        setSystemSettings(JSON.parse(stored));
      } else {
        // Default values
        setSystemSettings({
          appName:     "Hypernova CRM",
          companyName: "Matrix Legal Services",
          adminEmail:  "",
          timezone:    "America/Toronto",
          dateFormat:  "DD/MM/YYYY",
          currency:    "CAD",
        });
      }
    } catch {
      // Keep defaults on parse error
    } finally {
      setLoadingSystem(false);
    }
  }

  async function handleSaveSystem() {
    setSavingSystem(true);
    try {
      // Persist to localStorage
      localStorage.setItem("crm_system_settings", JSON.stringify(systemSettings));
      toast({ title: "Settings saved" });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setSavingSystem(false);
    }
  }

  return (
    <AppLayout title="Settings">
      {/* Tab bar — only Users and System */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Users Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "Users" && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">System Users</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add User
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined}>
                <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={form.displayRole}
                      onValueChange={(v) => setForm({ ...form, displayRole: v })}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                    <Button onClick={handleAddUser} disabled={saving}>
                      {saving ? "Adding..." : "Add User"}
                    </Button>
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
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="py-2 font-medium">{u.name}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="text-xs">
                          {u.display_role || u.displayRole || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          className={cn(
                            "text-xs",
                            u.is_active !== false
                              ? "bg-success/20 text-success border-success/30"
                              : "bg-muted text-muted-foreground"
                          )}
                          variant="outline"
                        >
                          {u.is_active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── System Tab ────────────────────────────────────────────────────── */}
      {activeTab === "System" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSystem ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-4 max-w-md">
                <div>
                  <Label className="text-xs">Application Name</Label>
                  <Input
                    value={systemSettings.appName}
                    onChange={(e) => setSystemSettings({ ...systemSettings, appName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Company Name</Label>
                  <Input
                    value={systemSettings.companyName}
                    onChange={(e) => setSystemSettings({ ...systemSettings, companyName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Admin Email</Label>
                  <Input
                    type="email"
                    value={systemSettings.adminEmail}
                    onChange={(e) => setSystemSettings({ ...systemSettings, adminEmail: e.target.value })}
                    placeholder="admin@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Timezone</Label>
                  <Select
                    value={systemSettings.timezone}
                    onValueChange={(v) => setSystemSettings({ ...systemSettings, timezone: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Toronto">America/Toronto (ET)</SelectItem>
                      <SelectItem value="America/Vancouver">America/Vancouver (PT)</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago (CT)</SelectItem>
                      <SelectItem value="America/Denver">America/Denver (MT)</SelectItem>
                      <SelectItem value="America/Halifax">America/Halifax (AT)</SelectItem>
                      <SelectItem value="America/St_Johns">America/St_Johns (NT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date Format</Label>
                  <Select
                    value={systemSettings.dateFormat}
                    onValueChange={(v) => setSystemSettings({ ...systemSettings, dateFormat: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select
                    value={systemSettings.currency}
                    onValueChange={(v) => setSystemSettings({ ...systemSettings, currency: v })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2">
                  <Button size="sm" onClick={handleSaveSystem} disabled={savingSystem}>
                    {savingSystem ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}