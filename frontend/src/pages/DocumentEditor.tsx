import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Save, X, FileDown, FileText, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Undo, Redo, Table, Link, Code, Image, Indent, Outdent,
  Loader2, Cloud, CloudOff,
  FolderOpen, Plus, Clock, ChevronLeft, Trash2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/lib/auth";

// ── Auth helper ───────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("crm_token") || localStorage.getItem("token") || "";
}

// ── Auto-save hook — saves to DB every 30 s when content has changed ──────────
const AUTOSAVE_MS = 30_000;

function useAutoSave(
  docId: string | null,
  getContent: () => string,
  getTitle: () => string,
  getCaseId: () => string | null,
  enabled: boolean,
) {
  const [lastSaved, setLastSaved]   = useState<Date | null>(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState(false);
  const dirtyRef                    = useRef(false);

  const markDirty = useCallback(() => { dirtyRef.current = true; }, []);

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!dirtyRef.current) return true;
    if (!enabled) return false;

    const title   = getTitle();
    const content = getContent();
    const caseId  = getCaseId();

    setSaving(true); setSaveError(false);

    try {
      const url    = docId
        ? `${API_BASE_URL}/editor-documents/${docId}`
        : `${API_BASE_URL}/editor-documents`;
      const method = docId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ title, content, case_id: caseId }),
      });

      if (!res.ok) throw new Error("Save failed");

      dirtyRef.current = false;
      setLastSaved(new Date());
      setSaving(false);
      return true;
    } catch {
      setSaveError(true);
      setSaving(false);
      return false;
    }
  }, [docId, getContent, getTitle, getCaseId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => { saveNow(); }, AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [saveNow, enabled]);

  return { lastSaved, saving, saveError, markDirty, saveNow };
}

// ── Toolbar config ────────────────────────────────────────────────────────────
const TOOLBAR_GROUPS = [
  {
    items: [
      { cmd: "undo",  icon: Undo,  label: "Undo"  },
      { cmd: "redo",  icon: Redo,  label: "Redo"  },
    ],
  },
  {
    items: [
      { cmd: "bold",      icon: Bold,      label: "Bold"      },
      { cmd: "italic",    icon: Italic,    label: "Italic"    },
      { cmd: "underline", icon: Underline, label: "Underline" },
    ],
  },
  {
    items: [
      { cmd: "justifyLeft",   icon: AlignLeft,   label: "Left"   },
      { cmd: "justifyCenter", icon: AlignCenter, label: "Center" },
      { cmd: "justifyRight",  icon: AlignRight,  label: "Right"  },
    ],
  },
  {
    items: [
      { cmd: "insertUnorderedList", icon: List,         label: "Bullets" },
      { cmd: "insertOrderedList",   icon: ListOrdered,  label: "Numbers" },
    ],
  },
  {
    items: [
      { cmd: "outdent", icon: Outdent, label: "Outdent" },
      { cmd: "indent",  icon: Indent,  label: "Indent"  },
    ],
  },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function DocumentEditor() {
  const navigate       = useNavigate();
  const { toast }      = useToast();
  const { user }       = useAuth();

  const isAdmin = (() => {
    if (!user) return false;
    const role = (user as any).display_role || (user as any).displayRole || "";
    if (role === "Admin") return true;
    try {
      const raw = JSON.parse(localStorage.getItem("crm_user") || "{}");
      return (raw?.display_role || raw?.displayRole || "") === "Admin";
    } catch { return false; }
  })();

  const [searchParams] = useSearchParams();
  const urlDocId  = searchParams.get("id");
  const urlCaseId = searchParams.get("caseId");

  const [docId,   setDocId]   = useState<string | null>(urlDocId);
  const [caseId,  setCaseId]  = useState<string | null>(urlCaseId);
  const [title,   setTitle]   = useState("Untitled Document");
  const [loading, setLoading] = useState(!!urlDocId);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [wordCount,  setWordCount]  = useState(0);

  const [showDocList,    setShowDocList]    = useState(!urlDocId);
  const [docList,        setDocList]        = useState<any[]>([]);
  const [docListLoading, setDocListLoading] = useState(false);

  const loadDocList = useCallback(() => {
    setDocListLoading(true);
    fetch(`${API_BASE_URL}/editor-documents`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => {
        if (!r.ok) return r.json().then(e => Promise.reject(e.error || `HTTP ${r.status}`));
        return r.json();
      })
      .then(data => setDocList(Array.isArray(data) ? data : []))
      .catch((err) => {
        toast({ title: "Failed to load documents", description: String(err), variant: "destructive" });
      })
      .finally(() => setDocListLoading(false));
  }, [toast]);

  useEffect(() => {
    if (showDocList) loadDocList();
  }, [showDocList, loadDocList]);

  const openDoc = (doc: any) => {
    navigate(`/document-editor?id=${doc.id}`, { replace: false });
    setShowDocList(false);
    setLoading(true);
    fetch(`${API_BASE_URL}/editor-documents/${doc.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setTitle(data.title || "Untitled Document");
        titleRef.current = data.title || "Untitled Document";
        if (data.case_id) { setCaseId(data.case_id); caseIdRef.current = data.case_id; }
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || "";
          contentRef.current = data.content || "";
          updateWordCount(data.content || "");
        }
        setDocId(data.id);
        setHasUnsaved(false);
        window.history.replaceState(null, "", `/document-editor?id=${data.id}`);
      })
      .catch(() => toast({ title: "Failed to load document", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  const newDoc = () => {
    setDocId(null);
    setCaseId(null);
    setTitle("Untitled Document");
    titleRef.current = "Untitled Document";
    caseIdRef.current = null;
    if (editorRef.current) { editorRef.current.innerHTML = ""; }
    contentRef.current = "";
    setWordCount(0);
    setHasUnsaved(false);
    setShowDocList(false);
    window.history.replaceState(null, "", "/document-editor");
  };

  const handleDeleteDoc = async (e: React.MouseEvent, doc: any) => {
    e.stopPropagation();
    if (!confirm(`Delete "${doc.title || "Untitled Document"}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/editor-documents/${doc.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      if (docId === doc.id) { newDoc(); }
      setDocList(prev => prev.filter(d => d.id !== doc.id));
      toast({ title: "Document deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const editorRef  = useRef<HTMLDivElement>(null);
  const contentRef = useRef("");
  const titleRef   = useRef(title);
  const caseIdRef  = useRef(caseId);

  useEffect(() => { titleRef.current  = title;  }, [title]);
  useEffect(() => { caseIdRef.current = caseId; }, [caseId]);

  const getContent = useCallback(() => contentRef.current, []);
  const getTitle   = useCallback(() => titleRef.current,   []);
  const getCaseId  = useCallback(() => caseIdRef.current,  []);

  const { lastSaved, saving, saveError, markDirty, saveNow } =
    useAutoSave(docId, getContent, getTitle, getCaseId, !loading);

  // ── Word count helper (reads existing contentRef, no new state logic) ──────
  const updateWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    setWordCount(text ? text.split(" ").length : 0);
  };

  useEffect(() => {
    if (!urlDocId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API_BASE_URL}/editor-documents/${urlDocId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setTitle(data.title || "Untitled Document");
        titleRef.current = data.title || "Untitled Document";
        if (data.case_id) { setCaseId(data.case_id); caseIdRef.current = data.case_id; }
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || "";
          contentRef.current = data.content || "";
          updateWordCount(data.content || "");
        }
        setDocId(data.id);
      })
      .catch(() => {
        toast({ title: "Failed to load document", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDocId]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      contentRef.current = editorRef.current.innerHTML;
      updateWordCount(editorRef.current.innerHTML);
      setHasUnsaved(true);
      markDirty();
    }
  }, [markDirty]);

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
    const html =
      '<table style="border-collapse:collapse;width:100%;margin:8px 0">' +
      "<tr>" +
      '<td style="border:1px solid hsl(var(--border));padding:8px">Cell 1</td>' +
      '<td style="border:1px solid hsl(var(--border));padding:8px">Cell 2</td>' +
      '<td style="border:1px solid hsl(var(--border));padding:8px">Cell 3</td>' +
      "</tr><tr>" +
      '<td style="border:1px solid hsl(var(--border));padding:8px">&nbsp;</td>' +
      '<td style="border:1px solid hsl(var(--border));padding:8px">&nbsp;</td>' +
      '<td style="border:1px solid hsl(var(--border));padding:8px">&nbsp;</td>' +
      "</tr></table>";
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

  const handleSave = async () => {
    markDirty();
    const title   = getTitle();
    const content = getContent();
    const cId     = getCaseId();

    try {
      const isNew = !docId;
      const url    = isNew
        ? `${API_BASE_URL}/editor-documents`
        : `${API_BASE_URL}/editor-documents/${docId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ title, content, case_id: cId }),
      });

      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();

      if (isNew && data.id) {
        setDocId(data.id);
        window.history.replaceState(
          null, "",
          `${window.location.pathname}?id=${data.id}${cId ? `&caseId=${cId}` : ""}`,
        );
      }

      setHasUnsaved(false);
      toast({ title: "Document saved", description: `"${title || "Untitled"}" saved successfully.` });
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    const content = contentRef.current;
    const docTitle = titleRef.current || "Document";
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup blocked", description: "Please allow popups for this site.", variant: "destructive" });
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html><html>
        <head>
          <title>${docTitle}</title>
          <style>
            @page { size: letter; margin: 25mm 20mm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #000; }
            h1 { font-size: 20pt; margin-bottom: 4pt; }
            h2 { font-size: 16pt; } h3 { font-size: 14pt; }
            table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
            td, th { border: 1px solid #000; padding: 6pt; }
            img { max-width: 100%; }
            .doc-title { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 12pt; padding-bottom: 6pt; border-bottom: 1px solid #000; }
          </style>
        </head>
        <body><div class="doc-title">${docTitle}</div>${content}</body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  const handleExportDOCX = () => {
    const content = contentRef.current;
    const docTitle = titleRef.current || "Document";
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8"><title>${docTitle}</title>
          <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
          <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; margin: 0; }
            h1 { font-size: 20pt; } h2 { font-size: 16pt; } h3 { font-size: 14pt; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #000; padding: 4pt 6pt; }
          </style>
        </head>
        <body><h1>${docTitle}</h1>${content}</body>
      </html>`;
    const blob = new Blob(["\ufeff", wordHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.replace(/[^a-zA-Z0-9 _-]/g, "")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Document exported", description: `${docTitle}.doc downloaded. Open in Microsoft Word.` });
  };

  const handleClose = async () => {
    if (hasUnsaved) {
      const ok = confirm("You have unsaved changes. Save before leaving?");
      if (ok) { await handleSave(); }
    }
    navigate(-1);
  };

  // ── Status indicator ──────────────────────────────────────────────────────
  const StatusIndicator = () => {
    if (loading)    return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Loading…</span>;
    if (saving)     return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Saving…</span>;
    if (saveError)  return <span className="flex items-center gap-1.5 text-xs text-destructive"><CloudOff className="h-3 w-3" />Save failed</span>;
    if (lastSaved)  return <span className="flex items-center gap-1.5 text-xs text-success"><Cloud className="h-3 w-3" />Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>;
    if (hasUnsaved) return <span className="flex items-center gap-1.5 text-xs text-warning"><span className="h-1.5 w-1.5 rounded-full bg-warning inline-block" />Unsaved</span>;
    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30">
      <AppSidebar />

      <div className="md:ml-60 flex flex-col h-screen">

        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-4 h-14 border-b bg-background shadow-sm shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">

            {/* Docs panel toggle */}
            <button
              onClick={() => setShowDocList(v => !v)}
              title="My Documents"
              className={`flex items-center gap-1.5 text-xs border rounded-md px-2.5 h-8 shrink-0 transition-colors ${
                showDocList
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border-border"
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">My Docs</span>
            </button>

            {/* New doc */}
            <button
              onClick={newDoc}
              title="New Document"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 h-8 shrink-0 transition-colors hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">New</span>
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-1 shrink-0" />

            {/* Doc icon + title input */}
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <Input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                titleRef.current = e.target.value;
                setHasUnsaved(true);
                markDirty();
              }}
              placeholder="Untitled Document"
              className="h-8 text-sm font-semibold max-w-xs border-none shadow-none focus-visible:ring-0 px-1 bg-transparent"
            />

            {/* Doc ID chip */}
            {docId && (
              <span className="hidden lg:inline text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono truncate max-w-[120px]">
                {docId.slice(0, 8)}…
              </span>
            )}
          </div>

          {/* Right side: status + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:flex"><StatusIndicator /></span>

            {/* Word count */}
            <span className="hidden lg:inline text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {wordCount.toLocaleString()} words
            </span>

            <div className="w-px h-5 bg-border mx-1" />

            <Button size="sm" onClick={handleSave} disabled={saving || loading}
              className="h-8 text-xs gap-1.5">
              {saving
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                : <><Save className="h-3.5 w-3.5" />Save</>}
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportPDF}
              className="hidden sm:inline-flex h-8 text-xs gap-1.5" disabled={loading}>
              <FileDown className="h-3.5 w-3.5" />PDF
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportDOCX}
              className="hidden sm:inline-flex h-8 text-xs gap-1.5" disabled={loading}>
              <FileDown className="h-3.5 w-3.5" />DOCX
            </Button>

            <button onClick={handleClose}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-b bg-background shrink-0 overflow-x-auto">

          {/* Format block selector */}
          <select
            onChange={e => handleFormatBlock(e.target.value)}
            className="h-7 text-xs rounded-md border border-input bg-muted/50 px-2 mr-2 text-foreground cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>Style</option>
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="blockquote">Blockquote</option>
            <option value="pre">Code Block</option>
          </select>

          {/* Toolbar groups */}
          {TOOLBAR_GROUPS.map((group, gi) => (
            <div key={gi} className="flex items-center gap-0.5">
              {gi > 0 && <div className="w-px h-4 bg-border mx-1.5" />}
              {group.items.map(item => (
                <button
                  key={item.cmd}
                  onClick={() => execCmd(item.cmd)}
                  title={item.label}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          ))}

          {/* Extra commands */}
          <div className="w-px h-4 bg-border mx-1.5" />
          {[
            { fn: insertTable,                          icon: Table,  label: "Insert Table"  },
            { fn: insertLink,                           icon: Link,   label: "Insert Link"   },
            { fn: insertImage,                          icon: Image,  label: "Insert Image"  },
            { fn: () => execCmd("removeFormat"),        icon: Code,   label: "Clear Format"  },
          ].map(({ fn, icon: Icon, label }) => (
            <button key={label} onClick={fn} title={label}
              className="h-7 w-7 flex items-center justify-center rounded-md text-foreground/60 hover:text-foreground hover:bg-muted transition-colors">
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* ── Body: doc list panel + editor ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Document list panel ── */}
          {showDocList && (
            <div className="w-68 shrink-0 border-r bg-background flex flex-col overflow-hidden"
              style={{ width: "272px" }}>

              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Documents</span>
                  {docList.length > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {docList.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={newDoc} title="New Document"
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setShowDocList(false)} title="Close"
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* New doc CTA */}
              <div className="px-3 py-2 border-b">
                <button onClick={newDoc}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  New document
                </button>
              </div>

              {/* Doc list */}
              <div className="flex-1 overflow-y-auto py-1">
                {docListLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-xs">Loading…</span>
                  </div>
                ) : docList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No documents yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Create your first document to get started</p>
                    </div>
                    <button onClick={newDoc}
                      className="text-xs text-primary hover:underline font-medium">
                      Create document →
                    </button>
                  </div>
                ) : (
                  <ul className="px-2 space-y-0.5">
                    {docList.map((doc: any) => (
                      <li key={doc.id} className="relative group/item">
                        <button
                          onClick={() => openDoc(doc)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                            docId === doc.id
                              ? "bg-primary/10 ring-1 ring-primary/20"
                              : "hover:bg-muted/60"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 pr-7">
                            <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                              docId === doc.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate leading-tight ${
                                docId === doc.id ? "text-primary" : "text-foreground"
                              }`}>
                                {doc.title || "Untitled Document"}
                              </p>
                              {doc.updated_at && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="h-2.5 w-2.5 shrink-0" />
                                  {new Date(doc.updated_at).toLocaleDateString("en-CA", {
                                    month: "short", day: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                  })}
                                </p>
                              )}
                              {doc.case_id && (
                                <span className="inline-block mt-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                  Case linked
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Delete — Admin only */}
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteDoc(e, doc)}
                            title="Delete document"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Panel footer */}
              <div className="border-t px-4 py-2 bg-muted/20">
                <p className="text-[10px] text-muted-foreground">
                  {docList.length} document{docList.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {/* ── Editor column ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {loading && (
              <div className="flex-1 flex items-center justify-center bg-muted/20">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-background border flex items-center justify-center shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <span className="text-sm font-medium">Loading document…</span>
                </div>
              </div>
            )}

            {!loading && (
              <div className="flex-1 overflow-auto bg-muted/30">
                {/* Paper canvas */}
                <div className="max-w-4xl mx-auto my-8 px-6">
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    suppressContentEditableWarning
                    className="min-h-[calc(100vh-220px)] bg-background rounded-xl shadow-md border border-border/60 p-10 focus:outline-none focus:ring-2 focus:ring-ring/30"
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: "14px",
                      lineHeight: "1.8",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </div>

                {/* Footer bar — word count + page info */}
                <div className="max-w-4xl mx-auto px-6 pb-6 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {wordCount.toLocaleString()} word{wordCount !== 1 ? "s" : ""}
                  </span>
                  {docId && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {docId.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}