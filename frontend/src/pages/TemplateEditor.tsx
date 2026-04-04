import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, X, Maximize2, Minimize2 } from "lucide-react";

const CATEGORIES = ["Medical Forms", "Insurance Forms", "Legal Documents", "Court Forms", "Internal Forms", "Other"];

const MERGE_FIELDS = [
  "{{client_name}}", "{{case_number}}", "{{date_of_loss}}", "{{claim_number}}",
  "{{policy_number}}", "{{client_address}}", "{{client_phone}}", "{{client_email}}",
  "{{date_of_birth}}", "{{adjuster_name}}", "{{insurance_company}}", "{{today_date}}",
];

export default function TemplateEditor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoSave = useCallback(() => {
    if (name && content) {
      setLastSaved(new Date());
    }
  }, [name, content]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  const insertMergeField = (field: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newContent = content.substring(0, start) + field + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + field.length, start + field.length);
    }, 0);
  };

  const handleSave = (exit: boolean) => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Template name is required.", variant: "destructive" });
      return;
    }
    setLastSaved(new Date());
    toast({ title: "Template Saved", description: `"${name}" has been saved.` });
    if (exit) navigate("/templates");
  };

  const handleExportPDF = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "template"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Template exported as text file." });
  };

  return (
    <AppLayout title="Template Editor">
      <div className={fullscreen ? "fixed inset-0 z-50 bg-background p-4 overflow-auto" : ""}>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name..."
              className="h-9 text-sm max-w-xs font-medium"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && <span className="text-xs text-muted-foreground">Saved {lastSaved.toLocaleTimeString()}</span>}
            <Button variant="outline" size="sm" onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>Export</Button>
            <Button variant="outline" size="sm" onClick={() => handleSave(false)}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button size="sm" onClick={() => handleSave(true)}>Save & Exit</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/templates")}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Merge Fields Panel */}
          <Card className="lg:col-span-1">
            <CardContent className="p-3">
              <Label className="text-xs font-semibold mb-2 block">Insert Merge Field</Label>
              <p className="text-xs text-muted-foreground mb-3">Click to insert at cursor position</p>
              <div className="flex flex-wrap gap-1.5">
                {MERGE_FIELDS.map(f => (
                  <button
                    key={f}
                    onClick={() => insertMergeField(f)}
                    className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 font-mono transition-colors"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <Card className="lg:col-span-3">
            <CardContent className="p-3">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your template content here...

Use merge fields like {{client_name}} to create dynamic placeholders that will be replaced with actual case data when filling the template.

You can format your template with sections, paragraphs, and any text layout you need."
                className="w-full min-h-[500px] p-4 border rounded-md bg-background text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                style={{ fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace" }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
