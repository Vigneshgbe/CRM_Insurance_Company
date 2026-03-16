import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getContactAccessByCaseId, type ContactAccess } from "@/data/mockData";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

export default function ContactAccessTab({ caseId }: { caseId: string }) {
  const [access, setAccess] = useState<ContactAccess[]>(getContactAccessByCaseId(caseId));
  const [open, setOpen] = useState(false);
  const [newAccess, setNewAccess] = useState({ name: "", role: "Staff", accessLevel: "Read Only" });
  const { toast } = useToast();

  const add = () => {
    const item: ContactAccess = {
      id: `ca${Date.now()}`, caseId, name: newAccess.name, role: newAccess.role,
      accessLevel: newAccess.accessLevel, dateAdded: new Date().toISOString().split("T")[0],
    };
    setAccess([...access, item]);
    setOpen(false);
    setNewAccess({ name: "", role: "Staff", accessLevel: "Read Only" });
    toast({ title: "Access Added" });
  };

  const remove = (id: string) => {
    setAccess(access.filter((a) => a.id !== id));
    toast({ title: "Access Removed" });
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contact Access</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Access</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Access</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name</Label><Input value={newAccess.name} onChange={(e) => setNewAccess({ ...newAccess, name: e.target.value })} className="h-8 text-sm mt-1" /></div>
              <div><Label className="text-xs">Role</Label>
                <Select value={newAccess.role} onValueChange={(v) => setNewAccess({ ...newAccess, role: v })}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Clerk">Clerk</SelectItem>
                    <SelectItem value="Secretary">Secretary</SelectItem>
                    <SelectItem value="Lawyer">Lawyer</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Access Level</Label>
                <Select value={newAccess.accessLevel} onValueChange={(v) => setNewAccess({ ...newAccess, accessLevel: v })}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full">Full</SelectItem>
                    <SelectItem value="Read Only">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={add} className="w-full">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs">Role</TableHead>
            <TableHead className="text-xs">Access Level</TableHead>
            <TableHead className="text-xs">Date Added</TableHead>
            <TableHead className="text-xs w-10"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {access.map((a) => (
              <TableRow key={a.id} className="text-sm">
                <TableCell className="py-2">{a.name}</TableCell>
                <TableCell className="py-2">{a.role}</TableCell>
                <TableCell className="py-2"><Badge variant="secondary" className="text-xs">{a.accessLevel}</Badge></TableCell>
                <TableCell className="py-2">{formatDate(a.dateAdded)}</TableCell>
                <TableCell className="py-2"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(a.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
