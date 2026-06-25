import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props { caseId: string; }

const CATEGORIES = [
  "Insurance", "Medical - Family Doctor", "Assessment Report",
  "Specialist Report", "I Report", "Police Report", "Other Documents",
];

export default function DocumentsTab({ caseId }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("Other Documents");

  useEffect(() => { load(); }, [caseId]);

  async function load() {
    setLoading(true);
    try { setDocs(await documentsApi.getByCaseId(caseId)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await documentsApi.upload(caseId, file, category);
      toast({ title: "Document uploaded" });
      load();
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    await documentsApi.delete(id);
    toast({ title: "Deleted" });
    load();
  }

  return (
    <div className="space-y-4 p-4">
      {/* Upload bar */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex gap-2">
          <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Document"}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Uploaded By</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d: any) => (
                <tr key={d.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <a href={`http://localhost:5000${d.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {d.name}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{d.category || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{d.uploadedBy || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{d.date || "—"}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleDelete(d.id)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
