import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Download, Trash2, Search } from "lucide-react";
import { cases, caseDocuments, getCaseById } from "@/data/mockData";

function getAllDocuments() {
  return caseDocuments.map((d) => {
    const c = getCaseById(d.caseId);
    return { ...d, caseFileNo: c?.fileNo || "N/A" };
  });
}

export default function Documents() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const allDocs = getAllDocuments();

  const filtered = allDocs
    .filter((d) => filter === "all" || d.category === filter)
    .filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.caseFileNo.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Documents">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">All Documents</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-48" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
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
                  <TableCell className="py-2 font-medium">{d.name}</TableCell>
                  <TableCell className="py-2"><Badge variant="outline" className="text-xs">{d.caseFileNo}</Badge></TableCell>
                  <TableCell className="py-2">{d.category}</TableCell>
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
    </AppLayout>
  );
}
