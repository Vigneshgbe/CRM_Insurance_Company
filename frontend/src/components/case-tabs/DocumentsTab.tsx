import { useState, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { Upload, Trash2, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("crm_token") || "";

const CATEGORIES = [
  "Insurance","Medical - Family Doctor","Assessment Report","Police Report",
  "Legal Documents","OCF Forms","Client ID","Other Documents",
];

export default function DocumentsTab({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("Other Documents");

  async function load() {
    const r = await fetch(`${API}/cases/${caseId}/documents`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) setDocs(await r.json());
  }

  useEffect(() => { load(); }, [caseId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    fd.append("uploadedBy", user?.name || "Staff");
    try {
      const r = await fetch(`${API}/cases/${caseId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      if (!r.ok) throw new Error("Upload failed");
      toast({ title: "File uploaded" });
      load();
    } catch (err: any) {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`${API}/documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-52 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4 mr-1" />{uploading ? "Uploading..." : "Upload File"}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs">Category</TableHead>
            <TableHead className="text-xs">Uploaded By</TableHead>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No documents uploaded yet.</p>
              </TableCell>
            </TableRow>
          ) : docs.map((d: any) => (
            <TableRow key={d.id}>
              <TableCell className="py-2 text-sm font-medium">
                {d.fileUrl ? (
                  <a href={`http://localhost:5000${d.fileUrl}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{d.name}</a>
                ) : d.name}
              </TableCell>
              <TableCell className="py-2 text-sm">{d.category}</TableCell>
              <TableCell className="py-2 text-sm text-muted-foreground">{d.uploadedBy}</TableCell>
              <TableCell className="py-2 text-sm text-muted-foreground">{formatDate(d.date)}</TableCell>
              <TableCell className="py-2">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteDoc(d.id)}>
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
