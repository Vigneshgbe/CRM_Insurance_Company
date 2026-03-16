import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const mockUsers = [
  { id: "1", name: "Amanda Singh", email: "amanda@hypernova.com", role: "Admin" },
  { id: "2", name: "John Baker", email: "john@hypernova.com", role: "Staff" },
  { id: "3", name: "Lisa Park", email: "lisa@hypernova.com", role: "Staff" },
  { id: "4", name: "Maria Costa", email: "maria@hypernova.com", role: "Staff" },
];

export default function Settings() {
  const { toast } = useToast();
  const [appName, setAppName] = useState("Hypernova CRM");

  return (
    <AppLayout title="Settings">
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="lookups">Lookup Values</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Users</CardTitle>
              <Dialog>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add User</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label className="text-xs">Name</Label><Input className="h-9 text-sm mt-1" /></div>
                    <div><Label className="text-xs">Email</Label><Input type="email" className="h-9 text-sm mt-1" /></div>
                    <div><Label className="text-xs">Role</Label>
                      <Select defaultValue="Staff">
                        <SelectTrigger className="h-9 text-sm mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={() => toast({ title: "User Added" })}>Add User</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockUsers.map((u) => (
                    <TableRow key={u.id} className="text-sm">
                      <TableCell className="py-2">{u.name}</TableCell>
                      <TableCell className="py-2">{u.email}</TableCell>
                      <TableCell className="py-2"><Badge variant="secondary" className="text-xs">{u.role}</Badge></TableCell>
                      <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card><CardHeader><CardTitle className="text-base">PDF Templates</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Manage OCF and intake form templates. Upload custom templates for PDF export.</p>
              <Button className="mt-4" size="sm" onClick={() => toast({ title: "Coming Soon", description: "Template management will be available in a future update." })}>Upload Template</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lookups">
          <Card><CardHeader><CardTitle className="text-base">Lookup Values</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Manage dropdown options for all form fields including file statuses, marital statuses, car makes/models, and more.</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card><CardHeader><CardTitle className="text-base">System Settings</CardTitle></CardHeader>
            <CardContent>
              <div className="max-w-sm space-y-4">
                <div><Label className="text-xs">Application Name</Label><Input value={appName} onChange={(e) => setAppName(e.target.value)} className="h-9 text-sm mt-1" /></div>
                <div><Label className="text-xs">Logo</Label><Input type="file" accept="image/*" className="h-9 text-sm mt-1" /></div>
                <Button size="sm" onClick={() => toast({ title: "Settings Saved" })}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
