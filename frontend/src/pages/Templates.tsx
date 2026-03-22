import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, FileCheck, ClipboardList, Upload, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TemplateFillModal from "@/components/templates/TemplateFillModal";

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fileName: string;
  fileSize: string;
  uploadedDate: string;
}

const SYSTEM_TEMPLATES = [
  { id: "ocf-6", name: "OCF-6 Expenses Claim Form", icon: DollarSign, description: "Claim expenses not submitted by health care provider", fieldsCount: 12 },
  { id: "ocf-10", name: "OCF-10 Election of Benefits", icon: FileCheck, description: "Election of Income Replacement, Non-Earner or Caregiver Benefit", fieldsCount: 8 },
  { id: "matrix-intake", name: "Matrix Intake Form", icon: ClipboardList, description: "Initial client interview and intake data collection form", fieldsCount: 45 },
];

const TEMPLATE_CATEGORIES = ["Medical Forms", "Insurance Forms", "Legal Documents", "Court Forms", "Internal Forms", "Other"];

export default function Templates() {
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fillModal, setFillModal] = useState<{ open: boolean; templateId: string; templateName: string }>({ open: false, templateId: "", templateName: "" });
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [uploadForm, setUploadForm] = useState({ name: "", description: "", category: "", fileName: "", fileSize: "" });

  const handleUpload = () => {
    if (!uploadForm.name) { toast({ title: "Error", description: "Template name is required.", variant: "destructive" }); return; }
    const newT: CustomTemplate = {
      id: `custom-${Date.now()}`,
      name: uploadForm.name,
      description: uploadForm.description,
      category: uploadForm.category || "Other",
      fileName: uploadForm.fileName || "template.pdf",
      fileSize: uploadForm.fileSize || "1.2 MB",
      uploadedDate: new Date().toLocaleDateString("en-CA"),
    };
    setCustomTemplates((prev) => [...prev, newT]);
    setUploadForm({ name: "", description: "", category: "", fileName: "", fileSize: "" });
    setUploadOpen(false);
    toast({ title: "Template Uploaded", description: `${newT.name} has been added.` });
  };

  const handleDelete = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Template Deleted" });
  };

  const openFill = (id: string, name: string) => setFillModal({ open: true, templateId: id, templateName: name });

  return (
    <AppLayout title="Templates">
      {/* System Templates */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">System Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEM_TEMPLATES.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">System Template</Badge>
                </div>
                <CardTitle className="text-sm mt-2">{t.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t.fieldsCount} fillable fields</span>
                  <Button size="sm" onClick={() => openFill(t.id, t.name)}>Fill & Export</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Custom Templates</h2>
          <Button size="sm" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4 mr-1" /> Upload Template</Button>
        </div>

        {customTemplates.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No custom templates yet</p>
            <p className="text-sm text-muted-foreground mb-4">Upload your own PDF templates to fill and export</p>
            <Button variant="outline" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4 mr-1" /> Upload Template</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTemplates.map((t) => (
              <Card key={t.id} className="relative">
                <button onClick={() => handleDelete(t.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                  <CardTitle className="text-sm mt-2">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-xs mb-2">{t.category}</Badge>
                  <p className="text-xs text-muted-foreground mb-3">{t.description || "No description"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Uploaded: {t.uploadedDate}</span>
                    <Button size="sm" onClick={() => openFill(t.id, t.name)}>Fill & Export</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload New Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Template Name *</Label>
              <Input value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} className="h-9 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} className="text-sm mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={uploadForm.category} onValueChange={(v) => setUploadForm({ ...uploadForm, category: v })}>
                <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{TEMPLATE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50" onClick={() => setUploadForm({ ...uploadForm, fileName: "template.pdf", fileSize: "2.4 MB" })}>
              {uploadForm.fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{uploadForm.fileName}</span>
                  <span className="text-xs text-muted-foreground">({uploadForm.fileSize})</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Drop PDF template here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Only PDF files accepted. Max size: 10MB</p>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload}>Upload Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fill & Export Modal */}
      {fillModal.open && (
        <TemplateFillModal
          templateId={fillModal.templateId}
          templateName={fillModal.templateName}
          onClose={() => setFillModal({ open: false, templateId: "", templateName: "" })}
        />
      )}
    </AppLayout>
  );
}
