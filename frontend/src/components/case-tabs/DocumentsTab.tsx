import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDocumentsByCaseId } from "@/data/mockData";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Download, Trash2, FileText } from "lucide-react";

export default function DocumentsTab({ caseId }: { caseId: string }) {
  const docs = getDocumentsByCaseId(caseId);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();
  const filtered = filter === "all" ? docs : docs.filter((d) => d.category === filter);

  const templates = [
    { name: "OCF-6 Expenses Claim Form", endpoint: "/api/export/ocf-6" },
    { name: "OCF-10 Election of Benefits", endpoint: "/api/export/ocf-10" },
    { name: "Matrix Intake Form", endpoint: "/api/export/intake" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documents</CardTitle>
          <div className="flex gap-2">
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
            <TableHeader><TableRow>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Uploaded By</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs w-24"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} className="text-sm">
                  <TableCell className="py-2 font-medium">{d.name}</TableCell>
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
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="py-4 text-center text-sm text-muted-foreground">No documents.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">PDF Template Export</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {templates.map((t) => (
              <div key={t.name} className="border rounded p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => toast({ title: "Export", description: `${t.name} export initiated.` })}>
                  Export PDF
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
