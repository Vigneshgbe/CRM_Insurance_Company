import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/constants";
import {
  Upload, Eye, Download, Trash2, Search,
  ChevronRight, ChevronDown, FolderOpen, File,
  FileText, Image, FileSpreadsheet, X, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_URL = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

// ── Category tree — matches DOCUMENT_CATEGORY_TREE from constants.ts ─────────
const CATEGORY_TREE = [
  {
    id: "mva", name: "Motor Vehicle (MVA)", children: [
      {
        id: "mva-ab", name: "AB (Accident Benefits)", children: [
          { id: "mva-ab-insurance",    name: "Insurance" },
          { id: "mva-ab-family-doctor",name: "Medical - Family Doctor" },
          { id: "mva-ab-assessment",   name: "Assessment Report" },
          {
            id: "mva-ab-specialist", name: "Specialist Report", children: [
              { id: "mva-ab-specialist-neuro",  name: "Neurological" },
              { id: "mva-ab-specialist-mental", name: "Mental Health" },
              { id: "mva-ab-specialist-ortho",  name: "Orthopedic" },
              { id: "mva-ab-specialist-other",  name: "Other" },
            ]
          },
          { id: "mva-ab-ireport", name: "I Report" },
          { id: "mva-ab-police",  name: "Police Report" },
          { id: "mva-ab-other",   name: "Other Documents" },
        ]
      },
      { id: "mva-tort", name: "Tort" },
    ]
  },
  { id: "slip-fall",   name: "Slip and Fall" },
  { id: "traffic",     name: "Traffic Accident" },
  { id: "immigration", name: "Immigration" },
];

// Flat list of all categories for upload dropdown
function flattenCategories(nodes: any[]): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  function walk(list: any[], prefix = "") {
    for (const n of list) {
      result.push({ id: n.id, name: prefix + n.name });
      if (n.children) walk(n.children, prefix + n.name + " › ");
    }
  }
  walk(nodes);
  return result;
}
const FLAT_CATEGORIES = flattenCategories(CATEGORY_TREE);

// File type icon
function FileIcon({ type }: { type?: string }) {
  if (!type) return <FileText className="h-4 w-4 text-muted-foreground" />;
  if (type.includes("pdf"))   return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes("image")) return <Image className="h-4 w-4 text-blue-500" />;
  if (type.includes("sheet") || type.includes("excel")) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Category tree node ────────────────────────────────────────────────────────
function CategoryNode({ node, selected, onSelect, counts, depth = 0 }: any) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children?.length > 0;
  const count = counts[node.id] || 0;

  return (
    <div>
      <button
        onClick={() => { onSelect(node.id); if (hasChildren) setOpen(!open); }}
        className={cn(
          "flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/80 transition-colors",
          selected === node.id && "bg-primary/10 text-primary font-medium"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren
          ? open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
          : <span className="w-3 shrink-0" />
        }
        <FolderOpen className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{node.name}</span>
        {count > 0 && <span className="text-muted-foreground shrink-0">{count}</span>}
      </button>
      {hasChildren && open && node.children.map((child: any) => (
        <CategoryNode key={child.id} node={child} selected={selected} onSelect={onSelect} counts={counts} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── PDF / Image Preview Modal ─────────────────────────────────────────────────
function PreviewModal({ doc, onClose }: { doc: any; onClose: () => void }) {
  const isPdf   = doc.fileType?.includes("pdf");
  const isImage = doc.fileType?.includes("image");
  const previewUrl = doc.fileUrl ? `${BASE_URL}${doc.fileUrl}` : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-medium truncate pr-4">{doc.name}</DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              {previewUrl && (
                <a
                  href={previewUrl}
                  download={doc.name}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          {!previewUrl ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              No preview available
            </div>
          ) : isPdf ? (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh] border rounded"
              title={doc.name}
            />
          ) : isImage ? (
            <img
              src={previewUrl}
              alt={doc.name}
              className="max-w-full max-h-[70vh] mx-auto rounded border object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-sm text-muted-foreground">
              <FileText className="h-12 w-12 opacity-30" />
              <p>Preview not available for this file type.</p>
              <a
                href={previewUrl}
                download={doc.name}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Download className="h-4 w-4" /> Download to view
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("mva-ab-other");
  const [uploading, setUploading] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [drag, setDrag] = useState(false);

  // Search cases as user types
  useEffect(() => {
    if (!caseSearch.trim()) { setCases([]); return; }
    const t = setTimeout(() => {
      fetch(`${API_BASE_URL}/cases?search=${encodeURIComponent(caseSearch)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setCases(Array.isArray(data) ? data.slice(0, 8) : []));
    }, 300);
    return () => clearTimeout(t);
  }, [caseSearch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !selectedCase) {
      toast({ title: "Select a file and a case", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const res = await fetch(`${API_BASE_URL}/cases/${selectedCase.id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!res.ok) throw new Error();
      toast({ title: "File uploaded successfully" });
      onUploaded();
      onClose();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Case search */}
          <div>
            <Label className="text-xs">Case *</Label>
            <Input
              placeholder="Search by file no or client name..."
              value={caseSearch}
              onChange={(e) => { setCaseSearch(e.target.value); setSelectedCase(null); }}
              className="h-8 text-xs mt-1"
            />
            {cases.length > 0 && !selectedCase && (
              <div className="border rounded mt-1 max-h-40 overflow-y-auto">
                {cases.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex justify-between"
                    onClick={() => { setSelectedCase(c); setCaseSearch(`${c.fileNo} — ${c.client?.firstName || ""} ${c.client?.lastName || ""}`); setCases([]); }}
                  >
                    <span className="font-medium">{c.fileNo}</span>
                    <span className="text-muted-foreground">{c.client?.firstName} {c.client?.lastName}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCase && (
              <div className="mt-1 flex items-center gap-2 text-xs text-success">
                <span>✓ {selectedCase.fileNo}</span>
                <button onClick={() => { setSelectedCase(null); setCaseSearch(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {FLAT_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              drag ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
            )}
            onClick={() => document.getElementById("doc-file-input")?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            {file ? (
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">Drag & drop or click to select</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Images, Word, Excel — max 20MB</p>
              </div>
            )}
            <input
              id="doc-file-input"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleUpload} disabled={uploading || !file || !selectedCase}>
              {uploading ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Uploading...</> : <><Upload className="h-3.5 w-3.5 mr-1" /> Upload</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Documents Page ───────────────────────────────────────────────────────
export default function Documents() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Build category counts from loaded docs
  const counts: Record<string, number> = {};
  docs.forEach((d) => {
    if (d.category) counts[d.category] = (counts[d.category] || 0) + 1;
  });

  const loadDocs = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/documents?search=${encodeURIComponent(search)}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => toast({ title: "Failed to load documents", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [search]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(loadDocs, 300);
    return () => clearTimeout(t);
  }, [loadDocs]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast({ title: "Document deleted" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: editName.trim() }),
      });
      setDocs((prev) => prev.map((d) => d.id === id ? { ...d, name: editName.trim() } : d));
      setEditingId(null);
      toast({ title: "Document renamed" });
    } catch {
      toast({ title: "Failed to rename", variant: "destructive" });
    }
  };

  const handleDownload = (doc: any) => {
    if (!doc.fileUrl) { toast({ title: "No file available" }); return; }
    const a = document.createElement("a");
    a.href = `${BASE_URL}${doc.fileUrl}`;
    a.download = doc.name;
    a.click();
  };

  // Filter by selected category
  const filtered = docs.filter((d) => {
    if (selectedCategory === "all") return true;
    return d.category === selectedCategory;
  });

  return (
    <AppLayout title="Documents">
      <div className="flex gap-4 h-full">
        {/* Category Sidebar */}
        <Card className="w-60 shrink-0">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/80 mb-1",
                selectedCategory === "all" && "bg-primary/10 text-primary font-medium"
              )}
            >
              <FolderOpen className="h-3 w-3" />
              <span className="flex-1">All Documents</span>
              <span className="text-muted-foreground">{docs.length}</span>
            </button>
            {CATEGORY_TREE.map((node) => (
              <CategoryNode
                key={node.id}
                node={node}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                counts={counts}
              />
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {selectedCategory === "all"
                ? "All Documents"
                : FLAT_CATEGORIES.find((c) => c.id === selectedCategory)?.name || "Documents"}
              <span className="text-muted-foreground font-normal text-sm ml-2">({filtered.length})</span>
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-52"
                />
              </div>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Case</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Uploaded By</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Size</TableHead>
                  <TableHead className="text-xs w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No documents found.</p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowUpload(true)}>
                        <Upload className="h-3.5 w-3.5 mr-1" /> Upload first document
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d) => (
                    <TableRow key={d.id} className="text-sm">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <FileIcon type={d.fileType} />
                          {editingId === d.id ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => handleRename(d.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename(d.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="h-7 text-xs"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:text-primary hover:underline font-medium"
                              onClick={() => { setEditingId(d.id); setEditName(d.name); }}
                              title="Click to rename"
                            >
                              {d.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {d.caseFileNo
                          ? <Badge variant="outline" className="text-xs font-mono">{d.caseFileNo}</Badge>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {FLAT_CATEGORIES.find((c) => c.id === d.category)?.name || d.category || "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{d.uploadedBy || "—"}</TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{formatDate(d.date)}</TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">{formatBytes(d.fileSize)}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            title="Preview"
                            onClick={() => setPreviewDoc(d)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            title="Download"
                            onClick={() => handleDownload(d)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => handleDelete(d.id, d.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={loadDocs} />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </AppLayout>
  );
}
