"use client";

import { X, Sparkles, Send, Settings, BookOpen, FileText, Languages, HelpCircle, List, FileEdit, Zap, Loader2, RotateCcw, PencilLine } from "lucide-react";
import { useBrowserStore } from "@/store/useBrowserStore";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function AISidebar() {
  const { setAISidebarOpen, activeTabId, splitTabId, focusedPane, tabs, openRouterApiKey, setOpenRouterApiKey } = useBrowserStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [targetLang, setTargetLang] = useState("Spanish");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getPageContent = async (type = 'text') => {
    const tabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
    const webview = document.getElementById(`webview-${tabId}`);
    if (!webview) return "";
    
    try {
      if (type === 'html') {
        return await webview.executeJavaScript('document.documentElement.outerHTML');
      } else if (type === 'selected') {
        return await webview.executeJavaScript('window.getSelection().toString()');
      } else {
        return await webview.executeJavaScript('document.body.innerText');
      }
    } catch (e) {
      console.error("Failed to extract page content", e);
      return "";
    }
  };

  const handleAction = async (endpoint, actionLabel, extraParams = {}, useSelectedOnly = false) => {
    if (isLoading) return;
    setIsLoading(true);
    
    setMessages(prev => [...prev, { role: 'user', content: `Please ${actionLabel.toLowerCase()}` }]);

    try {
      const tabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
      const currentTab = tabs?.find(t => t.id === tabId) || {};
      let content = await getPageContent('selected');
      
      // If no text is selected and we don't strictly require it, fallback to the full page text
      if (!content && !useSelectedOnly) {
        content = await getPageContent('text');
      }
      
      if (!content) {
        setMessages(prev => [...prev, { role: 'assistant', content: useSelectedOnly ? "Please select some text on the page first." : "I couldn't read the content of this page." }]);
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          endpoint,
          payload: {
            text: content.substring(0, 15000), // Send up to 15k chars for safety
            title: currentTab.title || '',
            url: currentTab.url || '',
            api_key: openRouterApiKey || null,
            ...extraParams
          }
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      
      // Handle the various response formats
      let responseText = "No response received.";
      if (data.answer) responseText = data.answer;
      else if (data.result) responseText = data.result;
      else if (data.faqs) {
        responseText = Array.isArray(data.faqs) ? data.faqs.join('\n\n') : data.faqs;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!input.trim() || isLoading) return;
    
    const query = input.trim();
    setInput("");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: query }]);

    try {
      const tabId = focusedPane === 'secondary' && splitTabId ? splitTabId : activeTabId;
      const currentTab = tabs?.find(t => t.id === tabId) || {};
      const html = await getPageContent('html');
      const selectedText = await getPageContent('selected');
      
      const res = await fetch(`/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          endpoint: '/rag',
          payload: {
            html: html || "<html><body>No content</body></html>",
            query: query,
            chunk_size: 50,
            overlap: 10,
            top_k: 3,
            title: currentTab.title || '',
            url: currentTab.url || '',
            selected_text: selectedText || '',
            api_key: openRouterApiKey || null
          }
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || data.result || "No response received." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
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
    "Who is the founder?"
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center font-medium text-foreground">
          <Sparkles className="w-5 h-5 text-accent mr-2" />
          AI Assistant
        </div>
        <div className="flex items-center space-x-1">
          {messages.length > 0 && (
            <button 
              onClick={() => {
                setMessages([]);
                setInput("");
              }}
              className="text-foreground/70 hover:text-accent p-1.5 rounded-md transition-colors cursor-pointer mr-1"
              title="New Chat / Back to Actions"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button 
            onClick={() => setAISidebarOpen(false)}
            className="text-foreground/70 hover:text-foreground p-1.5 rounded-md transition-colors cursor-pointer"
            title="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 no-scrollbar flex flex-col space-y-6 relative">
        
        {showSettings ? (
          <div className="flex flex-col h-full items-center justify-center text-center space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-2">
              <Settings size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground">API Configuration</h3>
            <p className="text-sm text-foreground/70 mb-4 px-4">
              Enter your OpenRouter API key to power the AI assistant. This key is stored locally on your device.
            </p>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={openRouterApiKey}
              onChange={(e) => setOpenRouterApiKey(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={() => setShowSettings(false)}
              disabled={!openRouterApiKey}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Save & Continue
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-foreground/50 hover:text-foreground/80 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : messages.length === 0 ? (
          <>
            {/* Greeting */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Hello! I&apos;m your AI assistant.</h2>
              <p className="text-sm text-foreground/70 leading-relaxed">
                I can help you understand, summarize, and work with the content of any web page.
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Try these actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {actions.map((action, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleAction(action.endpoint, action.label, action.params || {})}
                    disabled={isLoading}
                    className="flex items-center p-2.5 rounded-lg bg-surface border border-border hover:border-border/60 hover:bg-surface-hover transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-accent mr-2.5 group-hover:text-accent-hover transition-colors">
                      {action.icon}
                    </div>
                    <span className="text-xs text-foreground/80 font-medium truncate">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Translation Action */}
            <div>
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Translate Selected Text</h3>
              <div className="flex gap-2">
                <select 
                  className="bg-surface border border-border rounded-lg px-2 text-xs text-foreground outline-none w-1/3"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  title="Select Target Language"
                >
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                </select>
                <button
                  onClick={() => handleAction('/translate', `Translate to ${targetLang}`, { target_language: targetLang }, true)}
                  disabled={isLoading}
                  className="flex-1 bg-surface border border-border hover:border-border/60 hover:bg-surface-hover text-foreground/80 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                >
                  <Languages size={16} className="text-accent group-hover:text-accent-hover transition-colors" />
                  Translate
                </button>
              </div>
            </div>

            {/* Chat with website */}
            <div>
              <h3 className="text-sm font-medium text-foreground/80 mb-3">Chat with any website</h3>
              <div className="flex flex-col space-y-2">
                {suggestedQuestions.map((q, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setInput(q); }}
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
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group relative`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-sm shadow-sm ${msg.role === 'user' ? 'bg-accent text-white rounded-br-sm whitespace-pre-wrap' : 'bg-surface border border-border text-foreground rounded-bl-sm'}`}>
                  {msg.role === 'user' ? (
                    <div className="flex items-start gap-2">
                      <span>{msg.content}</span>
                      <button
                        onClick={() => {
                          setInput(msg.content);
                          setMessages([]);
                        }}
                        className="text-white/70 hover:text-white transition-colors cursor-pointer mt-0.5"
                        title="Edit Search"
                      >
                        <PencilLine size={14} />
                      </button>
                    </div>
                  ) : (
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
                        a: ({node, ...props}) => <a className="text-accent hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
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
      <div className="p-4 border-t border-border mt-auto">
        <div className="relative flex items-center bg-surface border border-border rounded-xl focus-within:border-accent/50 p-2 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground px-2 disabled:opacity-50"
            placeholder="Ask anything about this page..."
          />
          <button 
            onClick={handleChat}
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-accent hover:bg-accent/10 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Footer Status */}
        <div className="flex items-center justify-between mt-4 px-2 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full mr-2 bg-emerald-500" />
            Backend connected
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="hover:text-foreground transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
