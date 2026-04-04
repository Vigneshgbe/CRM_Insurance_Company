import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_CATEGORY_TREE, type DocumentCategory } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Download, Trash2, Search, ChevronRight, ChevronDown, FolderOpen, File } from "lucide-react";
import { cases, caseDocuments, getCaseById } from "@/data/mockData";
import { cn } from "@/lib/utils";

function getAllDocuments() {
  return caseDocuments.map((d) => {
    const c = getCaseById(d.caseId);
    return { ...d, caseFileNo: c?.fileNo || "N/A" };
  });
}

function flattenCategories(cats: DocumentCategory[]): DocumentCategory[] {
  const result: DocumentCategory[] = [];
  function walk(list: DocumentCategory[]) {
    for (const c of list) {
      result.push(c);
      if (c.children) walk(c.children);
    }
  }
  walk(cats);
  return result;
}

function countDocsInCategory(catId: string, allDocs: ReturnType<typeof getAllDocuments>, allCats: DocumentCategory[]): number {
  const ids = new Set<string>();
  function collectIds(cats: DocumentCategory[]) {
    for (const c of cats) {
      ids.add(c.id);
      if (c.children) collectIds(c.children);
    }
  }
  const target = findCat(allCats, catId);
  if (target) {
    ids.add(target.id);
    if (target.children) collectIds(target.children);
  }
  return allDocs.filter(d => ids.has(d.category)).length;
}

function findCat(cats: DocumentCategory[], id: string): DocumentCategory | undefined {
  for (const c of cats) {
    if (c.id === id) return c;
    if (c.children) {
      const found = findCat(c.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function CategoryTreeNode({
  cat, selectedId, onSelect, allDocs, depth = 0
}: {
  cat: DocumentCategory; selectedId: string; onSelect: (id: string) => void; allDocs: ReturnType<typeof getAllDocuments>; depth?: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = cat.children && cat.children.length > 0;
  const count = countDocsInCategory(cat.id, allDocs, DOCUMENT_CATEGORY_TREE);

  return (
    <div>
      <button
        onClick={() => { onSelect(cat.id); if (hasChildren) setOpen(!open); }}
        className={cn(
          "flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/80 transition-colors",
          selectedId === cat.id && "bg-primary/10 text-primary font-medium"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
        ) : <File className="h-3 w-3 shrink-0 text-muted-foreground" />}
        <FolderOpen className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate">{cat.name}</span>
        <span className="text-muted-foreground text-xs ml-1">{count}</span>
      </button>
      {hasChildren && open && cat.children!.map(child => (
        <CategoryTreeNode key={child.id} cat={child} selectedId={selectedId} onSelect={onSelect} allDocs={allDocs} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function Documents() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const allDocs = getAllDocuments();

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const getCategoryIds = (catId: string): Set<string> => {
    const ids = new Set<string>();
    function collect(cats: DocumentCategory[]) {
      for (const c of cats) { ids.add(c.id); if (c.children) collect(c.children); }
    }
    const cat = findCat(DOCUMENT_CATEGORY_TREE, catId);
    if (cat) { ids.add(cat.id); if (cat.children) collect(cat.children); }
    return ids;
  };

  const filtered = allDocs
    .filter((d) => {
      if (selectedCategory === "all") return true;
      const ids = getCategoryIds(selectedCategory);
      return ids.has(d.category);
    })
    .filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.caseFileNo.toLowerCase().includes(search.toLowerCase()));

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveRename = (id: string, originalName: string) => {
    const ext = originalName.substring(originalName.lastIndexOf("."));
    if (!editName.endsWith(ext)) {
      toast({ title: "Invalid filename", description: `Filename must end with ${ext}`, variant: "destructive" });
      return;
    }
    if (editName.trim() === "") {
      toast({ title: "Invalid filename", description: "Filename cannot be empty", variant: "destructive" });
      return;
    }
    toast({ title: "Document Renamed", description: `"${originalName}" → "${editName}"` });
    setEditingId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string, originalName: string) => {
    if (e.key === "Enter") saveRename(id, originalName);
    if (e.key === "Escape") setEditingId(null);
  };

  return (
    <AppLayout title="Documents">
      <div className="flex gap-4">
        {/* Category Tree Sidebar */}
        <Card className="w-64 shrink-0 hidden lg:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/80 mb-1",
                selectedCategory === "all" && "bg-primary/10 text-primary font-medium"
              )}
            >
              <FolderOpen className="h-3 w-3" />
              <span className="flex-1">All Documents</span>
              <span className="text-muted-foreground">{allDocs.length}</span>
            </button>
            {DOCUMENT_CATEGORY_TREE.map(cat => (
              <CategoryTreeNode key={cat.id} cat={cat} selectedId={selectedCategory} onSelect={setSelectedCategory} allDocs={allDocs} />
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="flex-1">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">All Documents</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-48" />
              </div>
              <Button size="sm" onClick={() => toast({ title: "Upload", description: "File upload will connect to backend." })}>
                <Upload className="h-4 w-4 mr-1" /> Upload
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
                  <TableHead className="text-xs w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className="text-sm">
                    <TableCell className="py-2 font-medium">
                      {editingId === d.id ? (
                        <Input
                          ref={editRef}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => saveRename(d.id, d.name)}
                          onKeyDown={(e) => handleRenameKeyDown(e, d.id, d.name)}
                          className="h-7 text-xs border-primary focus-visible:ring-primary"
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-primary hover:underline"
                          onClick={() => startRename(d.id, d.name)}
                          title="Click to rename"
                        >
                          {d.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-2"><Badge variant="outline" className="text-xs">{d.caseFileNo}</Badge></TableCell>
                    <TableCell className="py-2 text-xs">{d.category}</TableCell>
                    <TableCell className="py-2">{d.uploadedBy}</TableCell>
                    <TableCell className="py-2">{formatDate(d.date)}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No documents found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
