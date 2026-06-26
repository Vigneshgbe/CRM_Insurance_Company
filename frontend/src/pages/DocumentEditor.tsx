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
  FolderOpen, Plus, Clock, ChevronLeft,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { AppSidebar } from "@/components/layout/AppSidebar";

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

  // Called by the editor whenever content changes
  const markDirty = useCallback(() => { dirtyRef.current = true; }, []);

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!dirtyRef.current) return true;          // nothing changed
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

  // Periodic auto-save
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
  const [searchParams] = useSearchParams();

  // URL params:  ?id=<docId>  and/or  ?caseId=<caseId>
  const urlDocId  = searchParams.get("id");
  const urlCaseId = searchParams.get("caseId");

  const [docId,   setDocId]   = useState<string | null>(urlDocId);
  const [caseId,  setCaseId]  = useState<string | null>(urlCaseId);
  const [title,   setTitle]   = useState("Untitled Document");
  const [loading, setLoading] = useState(!!urlDocId);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // ── Document list panel (new) ─────────────────────────────────────────────
  const [showDocList,  setShowDocList]  = useState(!urlDocId); // open by default when no doc loaded
  const [docList,      setDocList]      = useState<any[]>([]);
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

  // Load doc list whenever panel opens
  useEffect(() => {
    if (showDocList) loadDocList();
  }, [showDocList, loadDocList]);

  // Open a saved document from the list
  const openDoc = (doc: any) => {
    // Navigate to editor with the doc id so it loads fresh
    navigate(`/document-editor?id=${doc.id}`, { replace: false });
    // Also do an immediate local load without full remount
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
        }
        setDocId(data.id);
        setHasUnsaved(false);
        window.history.replaceState(null, "", `/document-editor?id=${data.id}`);
      })
      .catch(() => toast({ title: "Failed to load document", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  // New blank document
  const newDoc = () => {
    setDocId(null);
    setCaseId(null);
    setTitle("Untitled Document");
    titleRef.current = "Untitled Document";
    caseIdRef.current = null;
    if (editorRef.current) { editorRef.current.innerHTML = ""; }
    contentRef.current = "";
    setHasUnsaved(false);
    setShowDocList(false);
    window.history.replaceState(null, "", "/document-editor");
  };

  const editorRef    = useRef<HTMLDivElement>(null);
  const contentRef   = useRef("");
  const titleRef     = useRef(title);
  const caseIdRef    = useRef(caseId);

  // Keep refs in sync with state so auto-save always reads latest value
  useEffect(() => { titleRef.current  = title;  }, [title]);
  useEffect(() => { caseIdRef.current = caseId; }, [caseId]);

  const getContent = useCallback(() => contentRef.current,      []);
  const getTitle   = useCallback(() => titleRef.current,        []);
  const getCaseId  = useCallback(() => caseIdRef.current,       []);

  const {
    lastSaved, saving, saveError, markDirty, saveNow,
  } = useAutoSave(docId, getContent, getTitle, getCaseId, !loading);

  // ── Load existing document from DB ─────────────────────────────────────────
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
        }
        setDocId(data.id);
      })
      .catch(() => {
        toast({ title: "Failed to load document", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDocId]);

  // ── Warn on unsaved changes before browser navigation ─────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  // ── Editor input handler ───────────────────────────────────────────────────
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      contentRef.current = editorRef.current.innerHTML;
      setHasUnsaved(true);
      markDirty();
    }
  }, [markDirty]);

  // ── Toolbar commands ───────────────────────────────────────────────────────
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

  // ── Manual save (Save button) ──────────────────────────────────────────────
  const handleSave = async () => {
    markDirty();               // force save even if auto-save didn't fire yet
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

      // If this was a new doc, update the URL so future saves use PUT
      if (isNew && data.id) {
        setDocId(data.id);
        // Silently update URL so refresh doesn't create a duplicate
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

  // ── PDF export via browser print dialog (accurate HTML rendering) ──────────
  const handleExportPDF = () => {
    const content = contentRef.current;
    const docTitle = titleRef.current || "Document";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup blocked", description: "Please allow popups for this site.", variant: "destructive" });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            @page { size: letter; margin: 25mm 20mm; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
            }
            h1 { font-size: 20pt; margin-bottom: 4pt; }
            h2 { font-size: 16pt; }
            h3 { font-size: 14pt; }
            table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
            td, th { border: 1px solid #000; padding: 6pt; }
            img { max-width: 100%; }
            .doc-title {
              font-size: 18pt;
              font-weight: bold;
              text-align: center;
              margin-bottom: 12pt;
              padding-bottom: 6pt;
              border-bottom: 1px solid #000;
            }
          </style>
        </head>
        <body>
          <div class="doc-title">${docTitle}</div>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  // ── DOCX export — real .docx via HTML-to-Word conversion ──────────────────
  const handleExportDOCX = () => {
    const content = contentRef.current;
    const docTitle = titleRef.current || "Document";

    // Word-compatible HTML with mso namespace for .docx-like rendering in Word
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { font-family: Calibri, sans-serif; font-size: 11pt; margin: 0; }
            h1   { font-size: 20pt; }
            h2   { font-size: 16pt; }
            h3   { font-size: 14pt; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #000; padding: 4pt 6pt; }
          </style>
        </head>
        <body>
          <h1>${docTitle}</h1>
          ${content}
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", wordHtml], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = `${docTitle.replace(/[^a-zA-Z0-9 _-]/g, "")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Document exported", description: `${docTitle}.doc downloaded. Open in Microsoft Word.` });
  };

  // ── Close / back ──────────────────────────────────────────────────────────
  const handleClose = async () => {
    if (hasUnsaved) {
      const ok = confirm("You have unsaved changes. Save before leaving?");
      if (ok) {
        await handleSave();
      }
    }
    navigate(-1);
  };

  // ── Status indicator ──────────────────────────────────────────────────────
  const StatusIndicator = () => {
    if (loading)   return <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</span>;
    if (saving)    return <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>;
    if (saveError) return <span className="text-xs text-red-500 flex items-center gap-1"><CloudOff className="h-3 w-3" /> Save failed</span>;
    if (lastSaved) return <span className="text-xs text-muted-foreground flex items-center gap-1"><Cloud className="h-3 w-3" /> Saved {lastSaved.toLocaleTimeString()}</span>;
    if (hasUnsaved) return <span className="text-xs text-amber-500">Unsaved changes</span>;
    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  //
  // Layout: AppSidebar is fixed left-0 w-60 z-30 (same as all other pages).
  // The editor shell is offset with ml-60 so it sits to the right of the
  // sidebar — exactly how AppLayout works on every other page. The outer div
  // is still full-screen height but no longer covers the sidebar.
  //
  return (
    <div className="min-h-screen bg-background">
      {/* ── App Sidebar — identical to every other page ─────────────────── */}
      <AppSidebar />

      {/* ── Editor shell — offset right of the sidebar ──────────────────── */}
      <div className="md:ml-60 flex flex-col h-screen">

        {/* ── Top Bar ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 h-14 border-b bg-background shadow-sm shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Documents list toggle */}
            <button
              onClick={() => setShowDocList(v => !v)}
              title="My Documents"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded px-2 h-7 shrink-0 transition-colors hover:bg-muted/50"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">My Docs</span>
            </button>

            {/* New document button */}
            <button
              onClick={newDoc}
              title="New Document"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded px-2 h-7 shrink-0 transition-colors hover:bg-muted/50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>

            <FileText className="h-5 w-5 text-primary shrink-0" />
            <Input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                titleRef.current = e.target.value;
                setHasUnsaved(true);
                markDirty();
              }}
              placeholder="Untitled Document"
              className="h-9 text-base font-medium max-w-sm border-none shadow-none focus-visible:ring-0 px-0"
            />
            {docId && (
              <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[180px]">
                ID: {docId.slice(0, 8)}…
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block"><StatusIndicator /></span>

            <Button size="sm" onClick={handleSave} disabled={saving || loading}>
              {saving
                ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving</>
                : <><Save className="h-4 w-4 mr-1" /> Save</>
              }
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportPDF} className="hidden sm:inline-flex" disabled={loading}>
              <FileDown className="h-4 w-4 mr-1" /> PDF
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportDOCX} className="hidden sm:inline-flex" disabled={loading}>
              <FileDown className="h-4 w-4 mr-1" /> DOCX
            </Button>

            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-muted/30 overflow-x-auto shrink-0">
          <select
            onChange={e => handleFormatBlock(e.target.value)}
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
              {group.items.map(item => (
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
          <button onClick={insertTable} title="Insert Table"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors">
            <Table className="h-3.5 w-3.5" />
          </button>
          <button onClick={insertLink} title="Insert Link"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors">
            <Link className="h-3.5 w-3.5" />
          </button>
          <button onClick={insertImage} title="Insert Image"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors">
            <Image className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => execCmd("removeFormat")} title="Clear Formatting"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent text-foreground/70 hover:text-foreground transition-colors">
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Main body: doc list panel OR editor ───────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Document List Panel (slides in when showDocList = true) ─── */}
          {showDocList && (
            <div className="w-72 shrink-0 border-r bg-background flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-xs font-semibold text-foreground">Saved Documents</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={newDoc}
                    title="New Document"
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setShowDocList(false)}
                    title="Close panel"
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {docListLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : docList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground px-4 text-center">
                    <FileText className="h-8 w-8 opacity-30" />
                    <p className="text-xs">No saved documents yet.</p>
                    <button
                      onClick={newDoc}
                      className="text-xs text-primary hover:underline"
                    >
                      Create your first document
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {docList.map((doc: any) => (
                      <li key={doc.id}>
                        <button
                          onClick={() => openDoc(doc)}
                          className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors group ${docId === doc.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            <FileText className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${docId === doc.id ? "text-primary" : "text-muted-foreground"}`} />
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-medium truncate ${docId === doc.id ? "text-primary" : "text-foreground"}`}>
                                {doc.title || "Untitled Document"}
                              </p>
                              {doc.updated_at && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(doc.updated_at).toLocaleDateString("en-CA", {
                                    month: "short", day: "numeric", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                  })}
                                </p>
                              )}
                              {doc.case_id && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                  Case linked
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{docList.length} document{docList.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}

          {/* ── Editor column ──────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* ── Loading overlay ──────────────────────────────────────── */}
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Loading document…</span>
                </div>
              </div>
            )}

            {/* ── Editor area ──────────────────────────────────────────── */}
            {!loading && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}