import { useEffect, useState, useRef } from "react";
import { Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { documentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_TREE = [
  {
    name: "Motor Vehicle (MVA)",
    children: [
      {
        name: "AB (Accident Benefits)",
        children: [
          { name: "Insurance" },
          { name: "Medical - Family Doctor" },
          { name: "Assessment Report" },
          { name: "Specialist Report", children: [
            { name: "Neurological" },
            { name: "Mental Health" },
            { name: "Orthopedic" },
            { name: "Other" },
          ]},
          { name: "I Report" },
          { name: "Police Report" },
          { name: "Other Documents" },
        ],
      },
      { name: "Tort" },
    ],
  },
  { name: "Slip and Fall" },
  { name: "Traffic Accident" },
  { name: "Immigration" },
];

function flatCategories(tree: any[], result: string[] = []): string[] {
  for (const node of tree) {
    result.push(node.name);
    if (node.children) flatCategories(node.children, result);
  }
  return result;
}

function countDocs(docs: any[], categoryName: string): number {
  return docs.filter((d) => d.category === categoryName || d.subCategory === categoryName).length;
}

function CategoryNode({ node, docs, selected, onSelect, depth = 0 }: any) {
  const [open, setOpen] = useState(true);
  const count = countDocs(docs, node.name);
  return (
    <div>
      <div
        className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-muted/50 text-sm ${selected === node.name ? "bg-muted font-medium" : ""}`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => onSelect(node.name)}
      >
        <div className="flex items-center gap-1">
          {node.children && (
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="text-muted-foreground">
              {open ? "▾" : "▸"}
            </button>
          )}
          <span>{node.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      {node.children && open && (
        <div>
          {node.children.map((child: any) => (
            <CategoryNode key={child.name} node={child} docs={docs} selected={selected} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Documents() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await documentsApi.getAll({
        search: search || undefined,
        category: selectedCategory || undefined,
      });
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, selectedCategory]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload without a specific case — use a general upload
      // For now, show a message that case must be selected
      toast({ title: "Upload from case page", description: "Please upload documents from inside a case file." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    await documentsApi.delete(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast({ title: "Deleted" });
  }

  const filtered = selectedCategory
    ? docs.filter((d) => d.category === selectedCategory)
    : docs;

  return (
    <div className="flex gap-4 h-full">
      {/* Category sidebar */}
      <div className="w-64 bg-white rounded-lg border p-3 shrink-0">
        <h3 className="font-semibold text-sm mb-2">Categories</h3>
        <div
          className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-muted/50 text-sm ${!selectedCategory ? "bg-muted font-medium" : ""}`}
          onClick={() => setSelectedCategory(null)}
        >
          <span>All Documents</span>
          <span className="text-xs text-muted-foreground">{docs.length}</span>
        </div>
        {CATEGORY_TREE.map((node) => (
          <CategoryNode key={node.name} node={node} docs={docs} selected={selectedCategory} onSelect={setSelectedCategory} />
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 bg-white rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">{selectedCategory || "All Documents"}</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex gap-2">
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Case</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Uploaded By</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No documents found.</td></tr>
            ) : (
              filtered.map((d: any) => (
                <tr key={d.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <a href={`http://localhost:5000${d.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {d.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{d.caseFileNo || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.category || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.uploadedBy || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.date || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(d.id)} className="text-xs text-red-500 hover:underline">Delete</button>
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
