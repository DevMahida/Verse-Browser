"use client";

import {
  X, Sparkles, Send, BookOpen, FileText, Languages, HelpCircle,
  List, FileEdit, Zap, Loader2, RotateCcw, PencilLine, Copy, Check,
  Square, History, Trash2, ChevronDown, MessageSquarePlus, Clock, Download, FileDown
} from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";

// Available OpenRouter models — slugs verified from /api/v1/models (2026-07-13)
const AI_MODELS = [
  // ── Meta Llama ──────────────────────────────────────────────
  { group: "Meta",     label: "Llama 3.1 8B",          value: "meta-llama/llama-3.1-8b-instruct" },
  { group: "Meta",     label: "Llama 3.1 70B",          value: "meta-llama/llama-3.1-70b-instruct" },
  { group: "Meta",     label: "Llama 3.3 70B",          value: "meta-llama/llama-3.3-70b-instruct" },
  { group: "Meta",     label: "Llama 4 Scout",          value: "meta-llama/llama-4-scout" },
  { group: "Meta",     label: "Llama 4 Maverick",       value: "meta-llama/llama-4-maverick" },
  // ── Google ──────────────────────────────────────────────────
  { group: "Google",   label: "Gemini 2.5 Flash",       value: "google/gemini-2.5-flash" },
  { group: "Google",   label: "Gemini 2.5 Pro",         value: "google/gemini-2.5-pro" },
  { group: "Google",   label: "Gemma 3 27B",            value: "google/gemma-3-27b-it" },
  // ── Anthropic ───────────────────────────────────────────────
  { group: "Anthropic",label: "Claude Sonnet 4.6",      value: "anthropic/claude-sonnet-4.6" },
  { group: "Anthropic",label: "Claude Haiku 4.5",       value: "anthropic/claude-haiku-4.5" },
  // ── DeepSeek ────────────────────────────────────────────────
  { group: "DeepSeek", label: "DeepSeek R1",            value: "deepseek/deepseek-r1" },
  { group: "DeepSeek", label: "DeepSeek V3 Chat",       value: "deepseek/deepseek-chat-v3-0324" },
  { group: "DeepSeek", label: "DeepSeek R1 Distill 70B",value: "deepseek/deepseek-r1-distill-llama-70b" },
  // ── Mistral ─────────────────────────────────────────────────
  { group: "Mistral",  label: "Mistral Large 2512",     value: "mistralai/mistral-large-2512" },
  { group: "Mistral",  label: "Mistral Small 3.2 24B",  value: "mistralai/mistral-small-3.2-24b-instruct" },
  { group: "Mistral",  label: "Mistral Nemo",           value: "mistralai/mistral-nemo" },
  // ── Qwen ────────────────────────────────────────────────────
  { group: "Qwen",     label: "Qwen 3 235B",            value: "qwen/qwen3-235b-a22b" },
  { group: "Qwen",     label: "Qwen 2.5 72B",           value: "qwen/qwen-2.5-72b-instruct" },
  // ── OpenAI ──────────────────────────────────────────────────
  { group: "OpenAI",   label: "GPT-4o",                 value: "openai/gpt-4o" },
  { group: "OpenAI",   label: "GPT-4o Mini",            value: "openai/gpt-4o-mini" },
];

function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function AISidebar() {
  const {
    setAISidebarOpen, activeTabId, splitTabId, focusedPane, tabs,
    aiQueryToExecute, setAiQueryToExecute,
    aiChatSessions, currentAiSessionId, selectedAiModel,
    saveAiSession, deleteAiSession, setCurrentAiSessionId,
    clearAllAiSessions, setSelectedAiModel,
  } = useBrowserStore();

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [targetLang, setTargetLang] = useState("Spanish");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [view, setView] = useState("chat"); // "chat" | "history"
  const [showModelMenu, setShowModelMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const modelMenuRef = useRef(null);

  const selectedModel = AI_MODELS.find(m => m.value === selectedAiModel);
  const selectedModelLabel = selectedModel?.label || selectedAiModel?.split('/').pop() || "Select Model";

  // Close model menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Auto-save session whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const id = sessionId || `session-${Date.now()}`;
    if (!sessionId) setSessionId(id);
    const firstUserMsg = messages.find(m => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.substring(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
      : "New chat";
    saveAiSession({ id, title, messages, updatedAt: Date.now() });
    setCurrentAiSessionId(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    if (aiQueryToExecute) {
      const query = aiQueryToExecute;
      setAiQueryToExecute(null);
      handleChat(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiQueryToExecute]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExport = async (content, format, userPrompt) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format, userPrompt })
      });
      if (!res.ok) throw new Error("Export failed");
      
      // Get the suggested filename from the response headers, or generate a fallback
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `export.${format}`;
      if (contentDisposition && contentDisposition.includes('filename="')) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportConversation = async (format) => {
    if (messages.length === 0) return;
    const fullContent = messages.map(m => {
      const role = m.role === 'user' ? 'You' : 'AI Assistant';
      return `**${role}:**\n${m.content}`;
    }).join('\n\n---\n\n');

    await handleExport(fullContent, format, "Full Conversation Transcript");
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setSessionId(null);
    setCurrentAiSessionId(null);
    setView("chat");
  };

  const loadSession = (session) => {
    setMessages(session.messages);
    setSessionId(session.id);
    setCurrentAiSessionId(session.id);
    setView("chat");
  };

  const getPageContent = async (type = "text") => {
    const tabId = focusedPane === "secondary" && splitTabId ? splitTabId : activeTabId;
    if (!window.electron || !window.electron.tabManager) return "";
    try {
      if (type === "selected") {
        return await window.electron.tabManager.executeJavaScript({ tabId, code: "window.getSelection().toString()" });
      } else {
        const code = `
          (function() {
            var clone = document.body.cloneNode(true);
            ['script','style','noscript','svg','iframe'].forEach(function(tag) {
              clone.querySelectorAll(tag).forEach(function(el) { el.remove(); });
            });
            return clone.innerText || clone.textContent || '';
          })()
        `;
        return await window.electron.tabManager.executeJavaScript({ tabId, code });
      }
    } catch (e) {
      console.error("Failed to extract page content", e);
      return "";
    }
  };

  const buildPayload = (extra) => ({ ...extra, model: selectedAiModel });

  const handleAction = async (endpoint, actionLabel, extraParams = {}, useSelectedOnly = false) => {
    if (isLoading || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsLoading(true);
    setView("chat");
    setMessages(prev => [...prev, { role: "user", content: `Please ${actionLabel.toLowerCase()}` }]);

    try {
      const tabId = focusedPane === "secondary" && splitTabId ? splitTabId : activeTabId;
      const currentTab = tabs?.find(t => t.id === tabId) || {};
      let content = await getPageContent("selected");
      if (!content && !useSelectedOnly) content = await getPageContent("text");

      if (!content) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: useSelectedOnly ? "Please select some text on the page first." : "I couldn't read the content of this page."
        }]);
        return;
      }

      abortControllerRef.current = new AbortController();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          endpoint,
          payload: buildPayload({
            text: content.substring(0, 15000),
            title: currentTab.title || "",
            url: currentTab.url || "",
            ...extraParams
          })
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

      let responseText = "No response received.";
      if (data.answer) responseText = data.answer;
      else if (data.result) responseText = data.result;
      else if (data.faqs) responseText = Array.isArray(data.faqs) ? data.faqs.join("\n\n") : data.faqs;

      setMessages(prev => [...prev, { role: "assistant", content: responseText, model: selectedAiModel }]);
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: "Response stopped.", model: selectedAiModel }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}`, model: null }]);
      }
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleChat = async (queryOverride) => {
    const query = typeof queryOverride === "string" ? queryOverride.trim() : input.trim();
    if (!query || isLoading || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setInput("");
    setIsLoading(true);
    setView("chat");
    setMessages(prev => [...prev, { role: "user", content: query }]);

    try {
      const tabId = focusedPane === "secondary" && splitTabId ? splitTabId : activeTabId;
      const currentTab = tabs?.find(t => t.id === tabId) || {};
      const pageText = await getPageContent("text");
      const selectedText = await getPageContent("selected");

      abortControllerRef.current = new AbortController();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          endpoint: "/rag",
          payload: buildPayload({
            text: (pageText || "").substring(0, 15000),
            query,
            title: currentTab.title || "",
            url: currentTab.url || "",
            selected_text: (selectedText || "").substring(0, 2000),
          })
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
      setMessages(prev => [...prev, { role: "assistant", content: data.answer || data.result || "No response received.", model: selectedAiModel }]);
    } catch (e) {
      if (e.name === "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: "Response stopped.", model: selectedAiModel }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}`, model: null }]);
      }
    } finally {
      isProcessingRef.current = false;
      setIsLoading(false);
    }
  };

  const actions = [
    { icon: <FileText size={16} />, label: "Summarize this page", endpoint: "/summarize" },
    { icon: <HelpCircle size={16} />, label: "Explain this article", endpoint: "/explain" },
    { icon: <List size={16} />, label: "List key points", endpoint: "/key-points" },
    { icon: <List size={16} />, label: "Generate FAQs", endpoint: "/faqs" },
    { icon: <FileEdit size={16} />, label: "Create study notes", endpoint: "/study-notes" },
    { icon: <Zap size={16} />, label: "Extract Emails", endpoint: "/extract", params: { extraction_goal: "email addresses" } },
    { icon: <Zap size={16} />, label: "Generate Twitter Post", endpoint: "/generate-post", params: { platform: "Twitter" } },
    { icon: <BookOpen size={16} />, label: "Rewrite Professionally", endpoint: "/rewrite", params: { style: "professional" } },
  ];

  const suggestedQuestions = [
    "What are the pricing plans?",
    "Where is the refund policy?",
    "Who is the founder?",
  ];

  // ── HISTORY VIEW ─────────────────────────────────────────────────────────────
  const HistoryView = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">Chat History</span>
        {aiChatSessions.length > 0 && (
          <button
            onClick={() => { clearAllAiSessions(); }}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 size={12} /> Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {aiChatSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-3">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
              <Clock size={22} />
            </div>
            <p className="text-sm text-foreground/60">No chat history yet.<br />Start a conversation to see it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {aiChatSessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-start gap-3 px-4 py-3 hover:bg-surface-hover cursor-pointer transition-colors ${currentAiSessionId === session.id ? "bg-accent/8 border-l-2 border-accent" : ""}`}
                onClick={() => loadSession(session)}
              >
                <MessageSquarePlus size={16} className="text-accent/70 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{session.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-foreground/40">{formatRelativeTime(session.updatedAt)}</span>
                    <span className="text-xs text-foreground/30">·</span>
                    <span className="text-xs text-foreground/40">{session.messages.length} msgs</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAiSession(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-foreground/40 transition-all cursor-pointer shrink-0"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── MAIN RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center font-medium text-foreground">
          <Sparkles className="w-5 h-5 text-accent mr-2" />
          AI Assistant
        </div>
        <div className="flex items-center space-x-1">
          {/* New Chat */}
          <button
            onClick={startNewChat}
            className="text-foreground/70 hover:text-accent p-1.5 rounded-md transition-colors cursor-pointer"
            title="New Chat"
          >
            <MessageSquarePlus size={16} />
          </button>
          {/* History toggle */}
          <button
            onClick={() => setView(view === "history" ? "chat" : "history")}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${view === "history" ? "text-accent bg-accent/10" : "text-foreground/70 hover:text-accent"}`}
            title="Chat History"
          >
            <History size={16} />
          </button>
          {/* Reset current chat */}
          {messages.length > 0 && view === "chat" && (
            <>
              <button
                onClick={() => handleExportConversation('pdf')}
                disabled={isExporting}
                className="text-foreground/70 hover:text-accent p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                title="Export Conversation as PDF"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => handleExportConversation('docx')}
                disabled={isExporting}
                className="text-foreground/70 hover:text-accent p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                title="Export Conversation as DOCX"
              >
                <FileDown size={16} />
              </button>
              <button
                onClick={startNewChat}
                className="text-foreground/70 hover:text-accent p-1.5 rounded-md transition-colors cursor-pointer"
                title="Clear Chat"
              >
                <RotateCcw size={16} />
              </button>
            </>
          )}
          {/* Close */}
          <button
            onClick={() => setAISidebarOpen(false)}
            className="text-foreground/70 hover:text-foreground p-1.5 rounded-md transition-colors cursor-pointer"
            title="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 no-scrollbar flex flex-col space-y-6 relative">
        {view === "history" ? (
          <HistoryView />
        ) : messages.length === 0 ? (
          <>
            {/* Greeting */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Hello! I&apos;m your AI assistant.</h2>
              <p className="text-sm text-foreground/70 leading-relaxed">
                I can help you understand, summarize, and work with the content of any web page.
              </p>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Try these actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAction(action.endpoint, action.label, action.params || {})}
                    disabled={isLoading}
                    className="flex items-center p-2.5 rounded-lg bg-surface border border-border hover:border-border/60 hover:bg-surface-hover transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="text-accent mr-2.5 group-hover:text-accent-hover transition-colors">{action.icon}</div>
                    <span className="text-xs text-foreground/80 font-medium truncate">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Translation */}
            <div>
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Translate Selected Text</h3>
              <div className="flex gap-2">
                <select
                  className="bg-surface border border-border rounded-lg px-2 text-xs text-foreground outline-none w-1/3"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                >
                  {["Spanish","French","German","Chinese","Japanese","Hindi","English"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAction("/translate", `Translate to ${targetLang}`, { target_language: targetLang }, true)}
                  disabled={isLoading}
                  className="flex-1 bg-surface border border-border hover:border-border/60 hover:bg-surface-hover text-foreground/80 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer group"
                >
                  <Languages size={16} className="text-accent group-hover:text-accent-hover transition-colors" />
                  Translate
                </button>
              </div>
            </div>

            {/* Suggested Questions */}
            <div>
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Chat with any website</h3>
              <div className="flex flex-col space-y-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(q)}
                    className="text-left text-sm text-foreground/70 bg-surface hover:bg-surface-hover border border-border px-4 py-2.5 rounded-xl transition-colors w-fit cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} group/msg relative w-full`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-sm shadow-sm ${msg.role === "user" ? "bg-accent text-white rounded-br-sm whitespace-pre-wrap" : "bg-surface border border-border text-foreground rounded-bl-sm"}`}>
                  {msg.role === "user" ? (
                    <div className="flex items-start gap-2">
                      <span>{msg.content}</span>
                      {!isLoading && (
                        <button
                          onClick={() => { setInput(msg.content); setMessages([]); }}
                          className="text-white/70 hover:text-white transition-colors cursor-pointer mt-0.5"
                          title="Edit"
                        >
                          <PencilLine size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col w-full">
                      <ReactMarkdown
                        components={{
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold my-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold my-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold my-2" {...props} />,
                          a: ({node, ...props}) => <a className="text-accent hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                {msg.role === "assistant" && !isLoading && (
                  <div className="flex items-center gap-2 mt-1.5 px-2">
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="p-1.5 hover:bg-foreground/5 rounded-md text-foreground/50 hover:text-foreground/80 transition-colors cursor-pointer flex items-center justify-center"
                      title="Copy"
                    >
                      {copiedIndex === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleExport(msg.content, 'pdf', messages[idx - 1]?.content)}
                      disabled={isExporting}
                      className="p-1.5 hover:bg-foreground/5 rounded-md text-foreground/50 hover:text-foreground/80 transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
                      title="Download PDF"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleExport(msg.content, 'docx', messages[idx - 1]?.content)}
                      disabled={isExporting}
                      className="p-1.5 hover:bg-foreground/5 rounded-md text-foreground/50 hover:text-foreground/80 transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
                      title="Download DOCX"
                    >
                      <FileDown size={14} />
                    </button>
                    {msg.model && (
                      <span className="flex items-center gap-1 text-[10px] text-foreground/30 bg-surface-hover/50 border border-border/40 rounded-full px-2 py-0.5">
                        <Sparkles size={9} className="text-accent/50" />
                        {AI_MODELS.find(m => m.value === msg.model)?.label || msg.model.split("/").pop()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start">
                <div className="px-4 py-3 rounded-2xl bg-surface border border-border rounded-bl-sm flex items-center space-x-2">
                  <Loader2 size={14} className="text-accent animate-spin" />
                  <span className="text-xs text-foreground/70">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border mt-auto shrink-0">
        {/* Model selector row */}
        <div className="flex items-center justify-between mb-2 px-1" ref={modelMenuRef}>
          <span className="text-xs text-foreground/40">Model</span>
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(v => !v)}
              className="flex items-center gap-1.5 text-xs text-foreground/70 hover:text-accent bg-surface border border-border rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
            >
              <Sparkles size={11} className="text-accent" />
              {selectedModelLabel}
              <ChevronDown size={11} className={`transition-transform ${showModelMenu ? "rotate-180" : ""}`} />
            </button>

            {showModelMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-60 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Select Model</span>
                </div>
                <div className="overflow-y-auto max-h-72 no-scrollbar">
                  {(() => {
                    const groups = [...new Set(AI_MODELS.map(m => m.group))];
                    return groups.map(group => (
                      <div key={group}>
                        <div className="px-3 py-1.5 bg-surface-hover/50 border-b border-border/50">
                          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{group}</span>
                        </div>
                        {AI_MODELS.filter(m => m.group === group).map(m => (
                          <button
                            key={m.value}
                            onClick={() => { setSelectedAiModel(m.value); setShowModelMenu(false); }}
                            className={`w-full text-left px-3 py-2.5 text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                              selectedAiModel === m.value
                                ? "bg-accent/15 text-accent font-semibold"
                                : "text-foreground/80 hover:bg-surface-hover"
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                              selectedAiModel === m.value ? "bg-accent scale-125" : "bg-transparent"
                            }`} />
                            <span className="truncate">{m.label}</span>
                            {selectedAiModel === m.value && (
                              <Check size={11} className="text-accent ml-auto shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Text input */}
        <div className="relative flex items-center bg-surface border border-border rounded-xl focus-within:border-accent/50 p-2 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChat()}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-foreground disabled:opacity-50"
            placeholder="Ask anything about this page..."
          />
          {isLoading ? (
            <button
              onClick={handleStop}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Stop"
            >
              <Square size={16} className="fill-current" />
            </button>
          ) : (
            <button
              onClick={() => handleChat()}
              disabled={!input.trim()}
              className="p-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={16} />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center mt-3 px-1 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full mr-2 bg-emerald-500" />
          AI Ready · {aiChatSessions.length} saved {aiChatSessions.length === 1 ? "chat" : "chats"}
        </div>
      </div>
    </div>
  );
}
