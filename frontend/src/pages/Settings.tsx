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
import { Trash2, Plus, UserCheck, UserX, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";

function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

// ── MySQL TINYINT 0/1 → boolean ────────────────────────────────────────────────
function isActive(val: any): boolean {
  if (val === true  || val === 1 || val === "1") return true;
  if (val === false || val === 0 || val === "0") return false;
  return true;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ["Users", "System"];

export default function Settings() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Users");

  // Is the logged-in user an Admin?
  // display_role is in the JWT only after the auth controller fix + re-login.
  // rawStored is a fallback that reads the saved crm_user JSON directly, which
  // may already have display_role if the backend was fixed before this session.
  const rawStored = (() => {
    try { return JSON.parse(localStorage.getItem("crm_user") || "{}"); } catch { return {}; }
  })();
  const effectiveRole: string =
    (currentUser as any)?.display_role ||
    (currentUser as any)?.displayRole  ||
    rawStored?.display_role            ||
    rawStored?.displayRole             ||
    "";
  const isAdmin = effectiveRole === "Admin";

  // ── Users state ─────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", displayRole: "Staff" });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── System settings state ────────────────────────────────────────────────────
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

  // ── Load on tab switch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "Users")  loadUsers();
    if (activeTab === "System") loadSystemSettings();
  }, [activeTab]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const data = await usersApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast({ title: "Failed to load users", variant: "destructive" });
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

  // ── Generic user action via direct fetch ─────────────────────────────────────
  async function userAction(
    id: string,
    name: string,
    endpoint: string,
    method: string,
    confirmMsg: string,
    successMsg: string,
    localUpdate: (prev: any[]) => any[],
  ) {
    if (!confirm(confirmMsg)) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      toast({ title: successMsg });
      setUsers(prev => localUpdate(prev));
    } catch (err: any) {
      console.error(`[${method} ${endpoint}]`, err);
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  const handleDeactivate = (id: string, name: string) =>
    userAction(
      id, name,
      `/users/${id}`,
      "DELETE",
      `Deactivate "${name}"? They will no longer be able to log in.`,
      `${name} deactivated.`,
      prev => prev.map(u => u.id === id ? { ...u, is_active: 0 } : u),
    );

  const handleReactivate = (id: string, name: string) =>
    userAction(
      id, name,
      `/users/${id}/reactivate`,
      "PUT",
      `Reactivate "${name}"? They will be able to log in again.`,
      `${name} reactivated.`,
      prev => prev.map(u => u.id === id ? { ...u, is_active: 1 } : u),
    );

  const handleHardDelete = (id: string, name: string) =>
    userAction(
      id, name,
      `/users/${id}/permanent`,
      "DELETE",
      `⚠️ PERMANENTLY DELETE "${name}"?\n\nThis cannot be undone. All their data references will remain but this login account will be gone forever.`,
      `${name} permanently deleted.`,
      prev => prev.filter(u => u.id !== id),
    );

  // ── System settings — persisted to localStorage ──────────────────────────────
  function loadSystemSettings() {
    setLoadingSystem(true);
    try {
      const stored = localStorage.getItem("crm_system_settings");
      if (stored) {
        setSystemSettings(JSON.parse(stored));
      } else {
        setSystemSettings({
          appName:     "Padak Pvt Ltd CRM",
          companyName: "Matrix Legal Services",
          adminEmail:  "",
          timezone:    "America/Toronto",
          dateFormat:  "DD/MM/YYYY",
          currency:    "CAD",
        });
      }
    } catch {
      // keep defaults
    } finally {
      setLoadingSystem(false);
    }
  }

  async function handleSaveSystem() {
    setSavingSystem(true);
    try {
      localStorage.setItem("crm_system_settings", JSON.stringify(systemSettings));
      // Notify AppSidebar in the same tab
      window.dispatchEvent(new StorageEvent("storage", {
        key: "crm_system_settings",
        newValue: JSON.stringify(systemSettings),
      }));
      toast({ title: "Settings saved", description: "Sidebar app name updated." });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setSavingSystem(false);
    }
  }

  return (
    <AppLayout title="Settings">
      {/* Tab bar */}
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
        <div className="space-y-3">
          {!isAdmin && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Reactivate and permanent delete actions are restricted to Admin users.
            </div>
          )}

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
                    <TableHead className="text-xs pl-4">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u: any) => {
                      const active   = isActive(u.is_active);
                      const isSelf   = currentUser?.id === u.id;
                      const isBusy   = busyId === u.id;

                      return (
                        <TableRow
                          key={u.id}
                          className={cn(!active && "bg-muted/30 opacity-60")}
                        >
                          <TableCell className="py-2 font-medium pl-4">
                            {u.name}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground text-xs">{u.email}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="secondary" className="text-xs">
                              {u.display_role || u.displayRole || u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                active
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-600 border-red-200"
                              )}
                            >
                              {active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            {isSelf ? (
                              <span className="text-xs text-muted-foreground px-1">—</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                {/* Deactivate — available to all roles for active users */}
                                {active && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                    onClick={() => handleDeactivate(u.id, u.name)}
                                    disabled={isBusy}
                                    title="Deactivate user"
                                  >
                                    <UserX className="h-3.5 w-3.5 mr-1" />
                                    {isBusy ? "..." : "Deactivate"}
                                  </Button>
                                )}

                                {/* Reactivate — Admin only, inactive users */}
                                {!active && isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-green-700 hover:text-green-800 hover:bg-green-50"
                                    onClick={() => handleReactivate(u.id, u.name)}
                                    disabled={isBusy}
                                    title="Reactivate user"
                                  >
                                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                                    {isBusy ? "..." : "Reactivate"}
                                  </Button>
                                )}

                                {/* Permanent delete — Admin only, inactive users only */}
                                {!active && isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleHardDelete(u.id, u.name)}
                                    disabled={isBusy}
                                    title="Permanently delete user"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Delete
                                  </Button>
                                )}

                                {/* Non-admin sees inactive but no actions */}
                                {!active && !isAdmin && (
                                  <span className="text-xs text-muted-foreground px-1">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
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
                  <p className="text-xs text-muted-foreground mb-1">Displayed in the sidebar navigation.</p>
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