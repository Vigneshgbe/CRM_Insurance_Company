import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Download, ArrowLeft, Clock } from "lucide-react";

// 12 merge fields from the analysis
const MERGE_FIELDS = [
  { key: "{{client_name}}", label: "Client Full Name" },
  { key: "{{client_first_name}}", label: "Client First Name" },
  { key: "{{client_last_name}}", label: "Client Last Name" },
  { key: "{{case_number}}", label: "Case File Number" },
  { key: "{{date_of_loss}}", label: "Date of Loss" },
  { key: "{{limitation_date}}", label: "Limitation Date" },
  { key: "{{date_of_birth}}", label: "Date of Birth" },
  { key: "{{client_address}}", label: "Client Address" },
  { key: "{{client_phone}}", label: "Client Phone" },
  { key: "{{client_email}}", label: "Client Email" },
  { key: "{{clerk_assigned}}", label: "Clerk Assigned" },
  { key: "{{today_date}}", label: "Today's Date" },
];

const CATEGORIES = [
  "General Correspondence",
  "Legal Documents",
  "Client Letters",
  "Insurance Forms",
  "Internal Memos",
  "Other",
];

export default function TemplateEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState(searchParams.get("name") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "General Correspondence");
  const [content, setContent] = useState(searchParams.get("content") || "");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save every 30 seconds
  const autoSave = useCallback(() => {
    if (!name.trim() || !content.trim()) return;
    localStorage.setItem("crm_template_draft", JSON.stringify({ name, category, content, savedAt: new Date().toISOString() }));
    setLastSaved(new Date());
    setIsDirty(false);
  }, [name, category, content]);

  useEffect(() => {
    // Load draft on mount
    const draft = localStorage.getItem("crm_template_draft");
    if (draft && !searchParams.get("content")) {
      try {
        const d = JSON.parse(draft);
        if (d.name && !name) { setName(d.name); setCategory(d.category || "General Correspondence"); setContent(d.content || ""); }
      } catch {}
    }
  }, []);

  useEffect(() => {
    setIsDirty(true);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(autoSave, 30000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [name, category, content, autoSave]);

  function insertField(field: string) {
    const ta = textareaRef.current;
    if (!ta) { setContent(c => c + field); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newContent = content.slice(0, start) + field + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + field.length, start + field.length);
    }, 0);
  }

  function handleSave() {
    if (!name.trim()) { toast({ title: "Template name is required", variant: "destructive" }); return; }
    if (!content.trim()) { toast({ title: "Template content is required", variant: "destructive" }); return; }
    autoSave();
    toast({ title: "Template saved", description: `"${name}" saved to drafts.` });
  }

  function handleExport() {
    if (!content.trim()) { toast({ title: "Nothing to export", variant: "destructive" }); return; }
    const blob = new Blob([`Template: ${name}\nCategory: ${category}\n\n${"=".repeat(50)}\n\n${content}`], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `${name.replace(/\s+/g, "_") || "template"}_${new Date().toISOString().slice(0,10)}.txt`,
    });
    a.click();
    toast({ title: "Template exported" });
  }

  function handleNew() {
    if (isDirty && (name || content)) {
      if (!confirm("Discard unsaved changes and create a new template?")) return;
    }
    localStorage.removeItem("crm_template_draft");
    setName(""); setCategory("General Correspondence"); setContent(""); setLastSaved(null); setIsDirty(false);
  }

  return (
    <AppLayout title="Template Editor">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/templates")}>
            <ArrowLeft className="h-4 w-4 mr-1" />Back
          </Button>
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />Auto-saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isDirty && <Badge variant="outline" className="text-xs">Unsaved</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNew}>New</Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />Save Draft</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Editor panel */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Template Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Demand Letter" className="mt-1 h-9" />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Template Content</CardTitle>
              <p className="text-xs text-muted-foreground">Use merge fields from the panel on the right to insert client/case data automatically</p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`Dear {{client_name}},\n\nRe: Motor Vehicle Accident — File No. {{case_number}}\nDate of Loss: {{date_of_loss}}\n\nWe are writing with respect to the above matter...\n\nYours truly,\n{{clerk_assigned}}\nMatrix Legal Services`}
                className="min-h-[420px] font-mono text-sm resize-y"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{content.length} characters</span>
                <span className="text-xs text-muted-foreground">{content.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Merge fields panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Merge Fields</CardTitle>
              <p className="text-xs text-muted-foreground">Click to insert at cursor position</p>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1">
              {MERGE_FIELDS.map(f => (
                <button
                  key={f.key}
                  onClick={() => insertField(f.key)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-primary/10 hover:text-primary transition-colors group"
                >
                  <p className="font-mono text-primary group-hover:text-primary">{f.key}</p>
                  <p className="text-muted-foreground text-[10px]">{f.label}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Tips</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-2">
              <p>• Click any merge field to insert it at your cursor position</p>
              <p>• Template is auto-saved every 30 seconds to browser storage</p>
              <p>• Use <strong>Export</strong> to download as a .txt file</p>
              <p>• When filling, select a case to auto-populate all merge fields</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
