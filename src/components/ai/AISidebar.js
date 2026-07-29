"use client";

import {
  X, Sparkles, Send, BookOpen, FileText, Languages, HelpCircle,
  List, FileEdit, Zap, Loader2, RotateCcw, PencilLine, Copy, Check,
  Square, History, Trash2, ChevronDown, ChevronRight, MessageSquarePlus, Clock, Download, FileDown,
  Globe, Search, ExternalLink, ArrowRight, ToggleLeft, ToggleRight, FileCheck, Key, Settings
} from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useResizableWidth } from "@/hooks/useResizableWidth";
import { ResizeHandle } from "@/components/ui/ResizeHandle";

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

// ── Research Source Card Component ──────────────────────────────────────────────
function SourceCard({ source, index, onNavigate }) {
  const domain = (() => {
    try { return new URL(source.url).hostname.replace('www.', ''); } catch { return source.url; }
  })();

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 bg-surface-hover/50 border border-border/50 rounded-lg hover:border-accent/30 transition-all cursor-pointer group/src animate-[slideInUp_0.3s_ease-out]"
      onClick={() => onNavigate?.(source.url)}
      title={source.url}
    >
      <div className="w-5 h-5 rounded bg-accent/10 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-accent">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{source.title || domain}</p>
        <p className="text-[10px] text-foreground/40 truncate">{domain}</p>
      </div>
      <ExternalLink size={12} className="text-foreground/30 group-hover/src:text-accent shrink-0 transition-colors" />
    </div>
  );
}

// ── Research Progress Component ─────────────────────────────────────────────────
function ResearchProgress({ status, sources, streamContent, elapsedTime }) {
  const statusMessages = {
    starting: "Initializing research...",
    searching: "Searching the web...",
    analyzing: "Analyzing sources...",
    synthesizing: "Synthesizing findings...",
    writing: "Writing report...",
    researching: "Researching...",
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Progress header */}
      <div className="flex items-center gap-2">
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 rounded-full bg-linear-to-r from-violet-500 to-blue-500 animate-spin opacity-75" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' }} />
          <div className="absolute inset-0.5 rounded-full bg-surface" />
          <div className="absolute inset-0.75 rounded-full bg-linear-to-r from-violet-500 to-blue-500 animate-pulse" />
        </div>
        <span className="text-xs font-medium text-foreground/80">
          {statusMessages[status] || "Researching..."}
        </span>
        {elapsedTime > 0 && (
          <span className="text-[10px] text-foreground/30 ml-auto">{elapsedTime}s</span>
        )}
      </div>

      {/* Animated progress bar */}
      <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-linear-to-r from-violet-500 via-blue-500 to-violet-500 animate-[shimmer_2s_linear_infinite]"
          style={{ width: '100%', backgroundSize: '200% 100%' }}
        />
      </div>

      {/* Sources discovered */}
      {sources.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">
            Sources found ({sources.length})
          </span>
          <div className="flex flex-col gap-1">
            {sources.slice(0, 8).map((src, i) => (
              <SourceCard key={i} source={src} index={i} onNavigate={(url) => {
                if (window.electron?.tabManager) {
                  window.electron.tabManager.navigateTo?.({ url });
                }
              }} />
            ))}
            {sources.length > 8 && (
              <span className="text-[10px] text-foreground/40 px-1">
                +{sources.length - 8} more sources
              </span>
            )}
          </div>
        </div>
      )}

      {/* Streaming content preview */}
      {streamContent && (
        <div className="text-xs text-foreground/60 leading-relaxed border-l-2 border-accent/30 pl-3 max-h-24 overflow-hidden">
          {streamContent.substring(0, 200)}
          {streamContent.length > 200 && "..."}
        </div>
      )}
    </div>
  );
}

export default function AISidebar() {
  const {
    setAISidebarOpen, activeTabId, splitTabId, focusedPane, tabs,
    aiQueryToExecute, setAiQueryToExecute,
    aiChatSessions, currentAiSessionId, selectedAiModel,
    saveAiSession, deleteAiSession, setCurrentAiSessionId,
    clearAllAiSessions, setSelectedAiModel,
    researchMode, setResearchMode, profileId,
    openRouterApiKey, setOpenRouterApiKey,
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
  const [expandedResearch, setExpandedResearch] = useState({}); // { [msgIdx]: true/false }

  // Deep Research state
  const [researchStatus, setResearchStatus] = useState("idle"); // idle | researching | complete | error
  const [researchSources, setResearchSources] = useState([]);
  const [researchStreamContent, setResearchStreamContent] = useState("");
  const [researchElapsed, setResearchElapsed] = useState(0);
  const [researchModel, setResearchModel] = useState("mini"); // mini | pro
  const [researchOutputLength, setResearchOutputLength] = useState("standard"); // short | standard | long
  const [includePageContext, setIncludePageContext] = useState(true);

  // Deep Search API Key State
  const [hasTavilyKey, setHasTavilyKey] = useState(false);
  const [tavilyKeyInput, setTavilyKeyInput] = useState("");
  const [maskedTavilyKey, setMaskedTavilyKey] = useState("");
  const [showTavilySettings, setShowTavilySettings] = useState(false);

  useEffect(() => {
    if (window.electron?.getTavilyKey && profileId) {
      window.electron.getTavilyKey(profileId).then(key => {
        if (key) {
          setHasTavilyKey(true);
          setMaskedTavilyKey(key.substring(0, 5) + "••••••" + key.substring(key.length - 4));
        } else {
          setHasTavilyKey(false);
          setMaskedTavilyKey("");
        }
      }).catch(console.error);
    }
  }, [profileId, researchMode]);

  const handleSaveTavilyKey = async () => {
    const key = tavilyKeyInput.trim();
    if (!key.startsWith("tvly-")) {
      alert("Invalid Tavily Key. It should start with tvly-");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key, query: "test" })
      });
      if (!res.ok) throw new Error("Invalid key");
      
      await window.electron.setTavilyKey(profileId, key);
      setHasTavilyKey(true);
      setMaskedTavilyKey(key.substring(0, 5) + "••••••" + key.substring(key.length - 4));
      setTavilyKeyInput("");
      setShowTavilySettings(false);
    } catch (e) {
      alert("That key didn't work. Please check it and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTavilyKey = async () => {
    if (window.electron?.removeTavilyKey) {
      await window.electron.removeTavilyKey(profileId);
      setHasTavilyKey(false);
      setMaskedTavilyKey("");
      setShowTavilySettings(false);
    }
  };

  const messagesEndRef = useRef(null);
  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const modelMenuRef = useRef(null);
  const researchTimerRef = useRef(null);

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
      if (researchMode) {
        handleResearch(query);
      } else {
        handleChat(query);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiQueryToExecute]);

  // Cleanup research timer on unmount
  useEffect(() => {
    return () => {
      if (researchTimerRef.current) clearInterval(researchTimerRef.current);
    };
  }, []);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExport = async (content, format, userPrompt) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await window.electron.exportDocument({ content, format, userPrompt });
      if (!result || !result.success) {
        throw new Error(result?.error || "Export failed");
      }
      
      // IPC returns a buffer and a filename
      const blob = new Blob([result.buffer], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
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
    if (researchTimerRef.current) {
      clearInterval(researchTimerRef.current);
      researchTimerRef.current = null;
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setSessionId(null);
    setCurrentAiSessionId(null);
    setView("chat");
    setResearchStatus("idle");
    setResearchSources([]);
    setResearchStreamContent("");
    setResearchElapsed(0);
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

  const buildPayload = (extra) => ({
    ...extra,
    model: selectedAiModel,
    apiKey: openRouterApiKey || undefined,
  });

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
      // Use IPC for AI requests instead of Next.js API route
      const result = await window.electron.aiRequest({
        endpoint,
        payload: buildPayload({
          text: content.substring(0, 15000),
          title: currentTab.title || "",
          url: currentTab.url || "",
          ...extraParams
        })
      });

      if (abortControllerRef.current.signal.aborted) throw new Error("AbortError");
      if (result.error) throw new Error(result.error);
      
      let responseText = "No response received.";
      if (result.answer) responseText = result.answer;
      else if (result.result) responseText = result.result;
      else if (result.faqs) responseText = Array.isArray(result.faqs) ? result.faqs.join("\n\n") : result.faqs;

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

  // ── Deep Research Handler ──────────────────────────────────────────────────────
  const handleResearch = async (queryOverride) => {
    const query = typeof queryOverride === "string" ? queryOverride.trim() : input.trim();
    if (!query || isLoading || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setInput("");
    setIsLoading(true);
    setView("chat");
    setResearchStatus("researching");
    setResearchSources([]);
    setResearchStreamContent("");
    setResearchElapsed(0);

    setMessages(prev => [...prev, { role: "user", content: query, isResearch: true }]);

    // Start elapsed timer
    const startTime = Date.now();
    researchTimerRef.current = setInterval(() => {
      setResearchElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      let activeKey = "";
      if (window.electron?.getTavilyKey) {
        activeKey = await window.electron.getTavilyKey(profileId) || "";
      }

      // Get page context if enabled
      let pageContext = "";
      if (includePageContext) {
        pageContext = await getPageContent("text");
        pageContext = (pageContext || "").substring(0, 4000);
      }

      abortControllerRef.current = new AbortController();

      // Build the research input — optionally include page context
      let researchInput = query;
      if (pageContext && pageContext.trim()) {
        researchInput = `${query}\n\nContext from current webpage:\n${pageContext.substring(0, 4000)}`;
      }

      const tavilyPayload = {
        input: researchInput,
        model: researchModel,
        stream: true,
        output_length: researchOutputLength,
        citation_format: 'numbered',
      };

      const res = await fetch("https://api.tavily.com/research", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeKey.trim()}`
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify(tavilyPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `Research failed: ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        // ── SSE streaming mode ──
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let collectedSources = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              // Handle different event types from Tavily's stream
              if (event.error) {
                throw new Error(event.error);
              }

              // Source discovery events
              if (event.sources) {
                collectedSources = event.sources;
                setResearchSources([...collectedSources]);
              } else if (event.source) {
                collectedSources.push(event.source);
                setResearchSources([...collectedSources]);
              }

              // Status updates
              if (event.status) {
                setResearchStatus(event.status === "completed" ? "complete" : "researching");
              }

              // Content streaming (OpenAI-compatible format)
              const delta = event.choices?.[0]?.delta;
              if (delta?.content) {
                fullContent += delta.content;
                setResearchStreamContent(fullContent);
              }

              // Direct content field
              if (event.content && typeof event.content === "string") {
                fullContent = event.content;
                setResearchStreamContent(fullContent);
              }

              // Final output
              if (event.output) {
                fullContent = event.output;
              }

            } catch (parseErr) {
              // Skip non-JSON events
              if (parseErr.message && !parseErr.message.includes("JSON")) {
                throw parseErr;
              }
            }
          }
        }

        // Research complete — finalize
        clearInterval(researchTimerRef.current);
        researchTimerRef.current = null;
        setResearchStatus("complete");

        // Build the final message with sources
        let finalContent = fullContent || "Research completed but no content was generated.";
        if (collectedSources.length > 0) {
          finalContent += "\n\n---\n\n**Sources:**\n";
          collectedSources.forEach((src, i) => {
            finalContent += `${i + 1}. [${src.title || src.url}](${src.url})\n`;
          });
        }

        setMessages(prev => [...prev, {
          role: "assistant",
          content: finalContent,
          model: `tavily-${researchModel}`,
          isResearch: true,
          sources: collectedSources,
        }]);

        // Auto-export as PDF
        handleExport(finalContent, 'pdf', query);

      } else {
        // ── JSON response (non-streaming / polling fallback) ──
        const data = await res.json();

        if (data.request_id && data.status !== "completed") {
          // Polling mode
          let pollResult = data;
          while (pollResult.status !== "completed" && pollResult.status !== "failed") {
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch("https://api.tavily.com/get_research", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${activeKey.trim()}`
              },
              signal: abortControllerRef.current.signal,
              body: JSON.stringify({ request_id: pollResult.request_id }),
            });
            pollResult = await pollRes.json();

            if (pollResult.sources) {
              setResearchSources(pollResult.sources);
            }
          }

          if (pollResult.status === "failed") {
            throw new Error("Research task failed.");
          }

          clearInterval(researchTimerRef.current);
          researchTimerRef.current = null;
          setResearchStatus("complete");

          let finalContent = pollResult.content || "Research completed.";
          if (pollResult.sources?.length > 0) {
            finalContent += "\n\n---\n\n**Sources:**\n";
            pollResult.sources.forEach((src, i) => {
              finalContent += `${i + 1}. [${src.title || src.url}](${src.url})\n`;
            });
          }

          setMessages(prev => [...prev, {
            role: "assistant",
            content: finalContent,
            model: `tavily-${researchModel}`,
            isResearch: true,
            sources: pollResult.sources || [],
          }]);

          // Auto-export as PDF
          handleExport(finalContent, 'pdf', query);

        } else {
          // Direct completed response
          clearInterval(researchTimerRef.current);
          researchTimerRef.current = null;
          setResearchStatus("complete");

          let finalContent = data.content || "Research completed.";
          if (data.sources?.length > 0) {
            finalContent += "\n\n---\n\n**Sources:**\n";
            data.sources.forEach((src, i) => {
              finalContent += `${i + 1}. [${src.title || src.url}](${src.url})\n`;
            });
          }

          setMessages(prev => [...prev, {
            role: "assistant",
            content: finalContent,
            model: `tavily-${researchModel}`,
            isResearch: true,
            sources: data.sources || [],
          }]);

          // Auto-export as PDF
          handleExport(finalContent, 'pdf', query);
        }
      }

    } catch (err) {
      clearInterval(researchTimerRef.current);
      researchTimerRef.current = null;
      setResearchStatus("error");

      if (err.name === "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: "Research stopped.", model: null, isResearch: true }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Research error: ${err.message}`, model: null, isResearch: true }]);
      }
    } finally {
      isProcessingRef.current = false;
      setIsLoading(false);
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
      // Use IPC for RAG chat request
      const result = await window.electron.aiRequest({
        endpoint: "/rag",
        payload: buildPayload({
          text: (pageText || "").substring(0, 15000),
          query,
          title: currentTab.title || "",
          url: currentTab.url || "",
          selected_text: (selectedText || "").substring(0, 2000),
        })
      });

      if (abortControllerRef.current.signal.aborted) throw new Error("AbortError");
      if (result.error) throw new Error(result.error);
      
      setMessages(prev => [...prev, { role: "assistant", content: result.answer || result.result || "No response received.", model: selectedAiModel }]);
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

  const handleSubmit = () => {
    if (researchMode) {
      handleResearch();
    } else {
      handleChat();
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

  const researchSuggestions = [
    "Latest advances in quantum computing",
    "Compare React, Vue, and Svelte in 2026",
    "What is the current state of AGI research?",
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

  const { width, panelRef, handleProps } = useResizableWidth({ min: 280, max: 700, defaultWidth: 350 });

  // ── MAIN RENDER ───────────────────────────────────────────────────────────────
  return (
    <div ref={panelRef} className="flex flex-col h-full relative" style={{ width }}>
      <ResizeHandle handleProps={handleProps} />
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center font-medium text-foreground">
          {researchMode ? (
            <>
              <Globe className="w-5 h-5 text-violet-400 mr-2" />
              Deep Research
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-accent mr-2" />
              AI Assistant
            </>
          )}
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
                  {researchMode ? (
                    <>
                      <h2 className="text-xl font-bold text-foreground mb-2">
                        <span className="bg-linear-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Deep Research</span>
                      </h2>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        I&apos;ll search the web from multiple angles, analyze sources, and synthesize a comprehensive report with citations.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-foreground mb-2">Hello! I&apos;m your AI assistant.</h2>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        I can help you understand, summarize, and work with the content of any web page.
                      </p>
                    </>
                  )}
                </div>

                {researchMode ? (
                  <>
                    {/* Research Config */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-foreground/80">Research Settings</h3>
                        {hasTavilyKey && (
                          <button 
                            onClick={() => setShowTavilySettings(true)}
                            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer bg-violet-400/10 px-2 py-1 rounded"
                          >
                            <Globe size={12} /> {maskedTavilyKey}
                          </button>
                        )}
                      </div>
                  <div className="flex flex-col gap-2">
                    {/* Model selection */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/50 w-16">Model</span>
                      <div className="flex gap-1 flex-1">
                        {[
                          { value: "mini", label: "Mini", desc: "Fast ~30s" },
                          { value: "pro", label: "Pro", desc: "Thorough ~2min" },
                        ].map(m => (
                          <button
                            key={m.value}
                            onClick={() => setResearchModel(m.value)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              researchModel === m.value
                                ? "bg-linear-to-r from-violet-500/20 to-blue-500/20 text-violet-300 border border-violet-500/30"
                                : "bg-surface border border-border text-foreground/60 hover:border-border/60"
                            }`}
                          >
                            <div>{m.label}</div>
                            <div className="text-[10px] opacity-60">{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Output length */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/50 w-16">Length</span>
                      <div className="flex gap-1 flex-1">
                        {["short", "standard", "long"].map(l => (
                          <button
                            key={l}
                            onClick={() => setResearchOutputLength(l)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                              researchOutputLength === l
                                ? "bg-linear-to-r from-violet-500/20 to-blue-500/20 text-violet-300 border border-violet-500/30"
                                : "bg-surface border border-border text-foreground/60 hover:border-border/60"
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Page context toggle */}
                    <div className="flex items-center justify-between px-1 py-1">
                      <span className="text-xs text-foreground/50">Include page context</span>
                      <button
                        onClick={() => setIncludePageContext(!includePageContext)}
                        className="cursor-pointer text-foreground/50 hover:text-foreground transition-colors"
                      >
                        {includePageContext ? (
                          <ToggleRight size={20} className="text-violet-400" />
                        ) : (
                          <ToggleLeft size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Research Suggestions */}
                <div>
                  <h3 className="text-sm font-medium text-foreground/80 mb-3">Try researching</h3>
                  <div className="flex flex-col space-y-2">
                    {researchSuggestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(q)}
                        className="text-left text-sm text-foreground/70 bg-surface hover:bg-surface-hover border border-border px-4 py-2.5 rounded-xl transition-colors w-fit cursor-pointer flex items-center gap-2"
                      >
                        <Globe size={14} className="text-violet-400/60 shrink-0" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
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
                    {/* Deep Research action card */}
                    <button
                      onClick={() => setResearchMode(true)}
                      disabled={isLoading}
                      className="flex items-center p-2.5 rounded-lg bg-linear-to-r from-violet-500/5 to-blue-500/5 border border-violet-500/20 hover:border-violet-500/40 hover:from-violet-500/10 hover:to-blue-500/10 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer col-span-2"
                    >
                      <div className="text-violet-400 mr-2.5 group-hover:text-violet-300 transition-colors"><Globe size={16} /></div>
                      <div className="flex-1">
                        <span className="text-xs text-foreground/80 font-medium">Deep Research</span>
                        <span className="text-[10px] text-foreground/40 ml-2">Multi-source analysis with citations</span>
                      </div>
                      <ArrowRight size={14} className="text-foreground/30 group-hover:text-violet-400 transition-colors" />
                    </button>
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
            )}
          </>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} group/msg relative w-full`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-sm shadow-sm ${
                  msg.role === "user"
                    ? msg.isResearch
                      ? "bg-linear-to-r from-violet-600 to-blue-600 text-white rounded-br-sm whitespace-pre-wrap"
                      : "bg-accent text-white rounded-br-sm whitespace-pre-wrap"
                    : "bg-surface border border-border text-foreground rounded-bl-sm"
                }`}>
                  {msg.role === "user" ? (
                    <div className="flex items-start gap-2">
                      {msg.isResearch && <Globe size={14} className="text-white/70 mt-0.5 shrink-0" />}
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
                  ) : msg.isResearch ? (
                    /* ── Research Report Download Card ───────────────────── */
                    <div className="flex flex-col w-full gap-3">
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                          <FileCheck size={16} className="text-violet-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Research Report Ready</p>
                          <p className="text-[10px] text-foreground/40">
                            {msg.sources?.length ? `${msg.sources.length} sources analyzed` : "Report generated"}
                            {msg.model && ` · Tavily ${msg.model.replace('tavily-', '').toUpperCase()}`}
                          </p>
                        </div>
                      </div>

                      {/* Download Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExport(msg.content, 'pdf', messages[idx - 1]?.content)}
                          disabled={isExporting}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-linear-to-r from-violet-500/15 to-blue-500/15 border border-violet-500/25 hover:border-violet-500/40 rounded-xl text-violet-300 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Download size={14} />
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleExport(msg.content, 'docx', messages[idx - 1]?.content)}
                          disabled={isExporting}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-surface-hover/50 border border-border/50 hover:border-border rounded-xl text-foreground/60 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                        >
                          <FileDown size={14} />
                          Download DOCX
                        </button>
                      </div>

                      {/* Sources preview */}
                      {msg.sources?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.slice(0, 4).map((src, si) => {
                            const domain = (() => {
                              try { return new URL(src.url).hostname.replace('www.', ''); } catch { return src.url; }
                            })();
                            return (
                              <a
                                key={si}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-surface-hover/30 border border-border/30 rounded-md text-[10px] text-foreground/40 hover:text-accent hover:border-accent/30 transition-colors"
                                title={src.title || src.url}
                              >
                                <ExternalLink size={8} />
                                {domain}
                              </a>
                            );
                          })}
                          {msg.sources.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 text-[10px] text-foreground/30">
                              +{msg.sources.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expand/Collapse Report Toggle */}
                      <button
                        onClick={() => setExpandedResearch(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="flex items-center gap-1.5 text-[11px] text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer w-fit"
                      >
                        <ChevronRight size={12} className={`transition-transform ${expandedResearch[idx] ? "rotate-90" : ""}`} />
                        {expandedResearch[idx] ? "Hide report" : "View report inline"}
                      </button>

                      {/* Expandable Report Content */}
                      {expandedResearch[idx] && (
                        <div className="border-t border-border/30 pt-3 mt-1">
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
                  ) : (
                    /* ── Regular Chat Message ───────────────────────────── */
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
                {/* Action buttons for regular (non-research) messages */}
                {msg.role === "assistant" && !isLoading && !msg.isResearch && (
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

            {/* Research in-progress indicator */}
            {isLoading && researchMode && researchStatus === "researching" && (
              <div className="flex items-start">
                <div className="px-4 py-3 rounded-2xl bg-surface border border-violet-500/20 rounded-bl-sm w-full max-w-[90%]">
                  <ResearchProgress
                    status={researchStatus}
                    sources={researchSources}
                    streamContent={researchStreamContent}
                    elapsedTime={researchElapsed}
                  />
                </div>
              </div>
            )}

            {/* Regular loading indicator */}
            {isLoading && !researchMode && (
              <div className="flex items-start">
                <div className="px-4 py-3 rounded-2xl bg-surface border border-border rounded-bl-sm flex items-center space-x-2">
                  <Loader2 size={14} className="text-accent animate-spin" />
                  <span className="text-xs text-foreground/70">AI is thinking...</span>
                </div>
              </div>
            )}

            {/* Research loading with non-researching status (initial loading state) */}
            {isLoading && researchMode && researchStatus !== "researching" && (
              <div className="flex items-start">
                <div className="px-4 py-3 rounded-2xl bg-surface border border-violet-500/20 rounded-bl-sm flex items-center space-x-2">
                  <Loader2 size={14} className="text-violet-400 animate-spin" />
                  <span className="text-xs text-foreground/70">Starting deep research...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t mt-auto shrink-0 ${researchMode ? "border-violet-500/20" : "border-border"}`}>
        {/* Mode toggle + Model selector row */}
        <div className="flex items-center justify-between mb-2 px-1" ref={modelMenuRef}>
          {/* Research mode toggle */}
          <button
            onClick={() => setResearchMode(!researchMode)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              researchMode
                ? "bg-linear-to-r from-violet-500/15 to-blue-500/15 text-violet-300 border border-violet-500/30 hover:border-violet-500/50"
                : "text-foreground/50 hover:text-foreground/70 bg-surface border border-border hover:border-border/60"
            }`}
            title={researchMode ? "Switch to Chat mode" : "Switch to Deep Research mode"}
          >
            <Globe size={12} className={researchMode ? "text-violet-400" : ""} />
            {researchMode ? "Research" : "Research"}
          </button>

          {/* Model selector — shown in chat mode */}
          {!researchMode && (
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
          )}

          {/* Research model indicator — shown in research mode */}
          {researchMode && (
            <div className="flex items-center gap-1.5 text-xs text-violet-300/60">
              <span className="uppercase tracking-wider text-[10px]">Tavily {researchModel}</span>
            </div>
          )}
        </div>

        {/* Text input */}
        <div className={`relative flex items-center border rounded-xl p-2 transition-colors ${
          researchMode
            ? "bg-surface border-violet-500/20 focus-within:border-violet-500/40"
            : "bg-surface border-border focus-within:border-accent/50"
        }`}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-foreground disabled:opacity-50"
            placeholder={researchMode ? "What would you like me to research?" : "Ask anything about this page..."}
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
              onClick={handleSubmit}
              disabled={!input.trim() || (researchMode && !hasTavilyKey)}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                researchMode
                  ? "bg-violet-500/10 hover:bg-violet-500/20 text-violet-400"
                  : "bg-accent/10 hover:bg-accent/20 text-accent"
              }`}
            >
              {researchMode ? <Search size={16} /> : <Send size={16} />}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center mt-3 px-1 text-xs text-gray-500">
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${researchMode ? "bg-violet-400" : "bg-emerald-500"}`} />
          {researchMode ? "Research Mode" : "AI Ready"} · {aiChatSessions.length} saved {aiChatSessions.length === 1 ? "chat" : "chats"}
        </div>
      </div>

      {/* Custom keyframes style */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
