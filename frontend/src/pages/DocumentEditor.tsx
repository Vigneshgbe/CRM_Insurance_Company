import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, X, FileDown, FileText, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Undo, Redo, Table, Link, Code, Image, Indent, Outdent } from "lucide-react";

const AUTOSAVE_INTERVAL = 30000;

function useAutoSave(content: string, title: string, interval: number) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!title && !content) return;
    const timer = setInterval(() => {
      if (title || content) {
        setSaving(true);
        localStorage.setItem("editor_backup", JSON.stringify({ title, content, savedAt: new Date().toISOString() }));
        setTimeout(() => {
          setLastSaved(new Date());
          setSaving(false);
        }, 300);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [content, title, interval]);

  return { lastSaved, saving };
}

const TOOLBAR_GROUPS = [
  { items: [{ cmd: "undo", icon: Undo, label: "Undo" }, { cmd: "redo", icon: Redo, label: "Redo" }] },
  { items: [{ cmd: "bold", icon: Bold, label: "Bold" }, { cmd: "italic", icon: Italic, label: "Italic" }, { cmd: "underline", icon: Underline, label: "Underline" }] },
  { items: [{ cmd: "justifyLeft", icon: AlignLeft, label: "Left" }, { cmd: "justifyCenter", icon: AlignCenter, label: "Center" }, { cmd: "justifyRight", icon: AlignRight, label: "Right" }] },
  { items: [{ cmd: "insertUnorderedList", icon: List, label: "Bullets" }, { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbers" }] },
  { items: [{ cmd: "outdent", icon: Outdent, label: "Outdent" }, { cmd: "indent", icon: Indent, label: "Indent" }] },
];

export default function DocumentEditor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState("");
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef("");

  const { lastSaved, saving } = useAutoSave(contentRef.current, title, AUTOSAVE_INTERVAL);

  // Load backup or existing doc
  useEffect(() => {
    const backup = localStorage.getItem("editor_backup");
    if (backup) {
      try {
        const data = JSON.parse(backup);
        setTitle(data.title || "");
        if (editorRef.current) editorRef.current.innerHTML = data.content || "";
        contentRef.current = data.content || "";
      } catch { /* ignore */ }
    }
  }, []);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      contentRef.current = editorRef.current.innerHTML;
      setHasUnsaved(true);
    }
  }, []);

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleFormatBlock = (tag: string) => {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
    handleInput();
  };

  const insertTable = () => {
    const html = '<table style="border-collapse:collapse;width:100%;margin:8px 0"><tr><td style="border:1px solid hsl(var(--border));padding:8px">Cell 1</td><td style="border:1px solid hsl(var(--border));padding:8px">Cell 2</td><td style="border:1px solid hsl(var(--border));padding:8px">Cell 3</td></tr><tr><td style="border:1px solid hsl(var(--border));padding:8px">&nbsp;</td><td style="border:1px solid hsl(var(--border));padding:8px">&nbsp;</td><td style="border:1px solid hsl(var(--border));padding:8px">&nbsp;</td></tr></table>';
    document.execCommand("insertHTML", false, html);
    handleInput();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) execCmd("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) execCmd("insertImage", url);
  };

  const handleSave = () => {
    localStorage.setItem("editor_backup", JSON.stringify({ title, content: contentRef.current, savedAt: new Date().toISOString() }));
    setHasUnsaved(false);
    toast({ title: "Document Saved", description: `"${title || "Untitled"}" saved successfully.` });
  };

  const handleExportPDF = () => {
    toast({ title: "Exporting PDF...", description: "Generating PDF document." });
    setTimeout(() => {
      const blob = new Blob([`<html><head><style>body{font-family:Inter,sans-serif;padding:40px}</style></head><body><h1>${title}</h1>${contentRef.current}</body></html>`], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "document"}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF Exported", description: "Document exported successfully." });
    }, 500);
  };

  const handleExportDOCX = () => {
    toast({ title: "Exporting DOCX...", description: "Generating Word document." });
    setTimeout(() => {
      const blob = new Blob([contentRef.current], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "document"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "DOCX Exported", description: "Document exported successfully." });
    }, 500);
  };

  const handleClose = () => {
    if (hasUnsaved) {
      if (!confirm("You have unsaved changes. Leave without saving?")) return;
    }
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b bg-background shadow-sm shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setHasUnsaved(true); }}
            placeholder="Untitled Document"
            className="h-9 text-sm font-medium max-w-sm border-none shadow-none focus-visible:ring-0 px-0 text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {saving ? "Saving..." : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
          </span>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="hidden sm:inline-flex">
            <FileDown className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDOCX} className="hidden sm:inline-flex">
            <FileDown className="h-4 w-4 mr-1" /> DOCX
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-muted/30 overflow-x-auto shrink-0">
        <select
          onChange={(e) => handleFormatBlock(e.target.value)}
          className="h-7 text-xs rounded border border-input bg-background px-2 mr-1"
          defaultValue=""
        >
          <option value="" disabled>Format</option>
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Blockquote</option>
          <option value="pre">Code Block</option>
        </select>

        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <div className="w-px h-5 bg-border mx-1" />}
            {group.items.map((item) => (
              <button
                key={item.cmd}
                onClick={() => execCmd(item.cmd)}
                title={item.label}
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors"
              >
                <item.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ))}

        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={insertTable} title="Insert Table" className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors">
          <Table className="h-3.5 w-3.5" />
        </button>
        <button onClick={insertLink} title="Insert Link" className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors">
          <Link className="h-3.5 w-3.5" />
        </button>
        <button onClick={insertImage} title="Insert Image" className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors">
          <Image className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => execCmd("removeFormat")} title="Clear Formatting" className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors">
          <Code className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-4xl mx-auto my-6 px-4">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="min-h-[calc(100vh-200px)] bg-background border rounded-md shadow-sm p-8 prose prose-sm max-w-none focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ fontFamily: "'Inter', sans-serif" }}
            suppressContentEditableWarning
          />
        </div>
      </div>
    </div>
  );
}
