import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Search, FileText } from "lucide-react";
import { documentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";

// Category tree from constants.ts — kept exactly as original
const DOCUMENT_CATEGORY_TREE = [
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
            { name: "Neurological" }, { name: "Mental Health" }, { name: "Orthopedic" }, { name: "Other" },
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

function countDocs(docs: any[], name: string, node: any): number {
  let count = docs.filter((d) => d.category === name).length;
  if (node.children) {
    for (const child of node.children) count += countDocs(docs, child.name, child);
  }
  return count;
}

function CategoryNode({ node, docs, selected, onSelect, depth = 0 }: any) {
  const [open, setOpen] = useState(true);
  const count = countDocs(docs, node.name, node);
  return (
    <div>
      <div
        onClick={() => onSelect(node.name)}
        className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer text-sm hover:bg-muted/50 ${selected === node.name ? "bg-muted font-medium" : ""}`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <div className="flex items-center gap-1">
          {node.children && (
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="text-muted-foreground text-xs w-4">
              {open ? "▾" : "▸"}
            </button>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {count > 0 && <span className="text-xs text-muted-foreground ml-1 shrink-0">{count}</span>}
      </div>
      {node.children && open && node.children.map((child: any) => (
        <CategoryNode key={child.name} node={child} docs={docs} selected={selected} onSelect={onSelect} depth={depth + 1} />
      ))}
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await documentsApi.getAll({ search: search || undefined });
      setDocs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await documentsApi.delete(id);
      toast({ title: "Document deleted" });
      load();
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    try {
      await documentsApi.rename(id, editName.trim());
      setEditingId(null);
      load();
    } catch { toast({ title: "Failed to rename", variant: "destructive" }); }
  }

  const filtered = selectedCategory ? docs.filter((d) => d.category === selectedCategory) : docs;

  return (
    <AppLayout title="Documents">
      <div className="flex gap-4 h-full">
        {/* Category sidebar */}
        <Card className="w-56 shrink-0">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Categories</p>
            <div
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer text-sm hover:bg-muted/50 mb-1 ${!selectedCategory ? "bg-muted font-medium" : ""}`}
            >
              <span>All Documents</span>
              <span className="text-xs text-muted-foreground">{docs.length}</span>
            </div>
            {DOCUMENT_CATEGORY_TREE.map((node) => (
              <CategoryNode key={node.name} node={node} docs={docs} selected={selectedCategory} onSelect={setSelectedCategory} />
            ))}
          </CardContent>
        </Card>

        {/* Main area */}
        <Card className="flex-1">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-sm">{selectedCategory || "All Documents"} ({filtered.length})</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-52 h-8 text-sm"
                />
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={() => toast({ title: "Upload from inside a case file", description: "Go to Cases → open a case → Documents tab to upload" })} />
              <Button size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Case</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Uploaded By</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No documents found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d: any) => (
                    <TableRow key={d.id} className="text-sm">
                      <TableCell className="py-2">
                        {editingId === d.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleRename(d.id)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRename(d.id); if (e.key === "Escape") setEditingId(null); }}
                            className="h-7 text-xs"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-primary"
                            onClick={() => { setEditingId(d.id); setEditName(d.name); }}
                          >
                            {d.name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground font-mono text-xs">{d.caseFileNo || "—"}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{d.category || "—"}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{d.uploadedBy || "—"}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{formatDate(d.date)}</TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(d.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
