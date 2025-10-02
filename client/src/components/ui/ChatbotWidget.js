import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  RefreshCw,
  Loader2,
  Sparkles,
  Lightbulb,
  Target,
  BookOpen,
  Clipboard,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

/**
 * ChatbotWidget - AI-powered assistant for MockMate
 * Provides real-time interview coaching and feature guidance
 */
const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [chatbotAvailable, setChatbotAvailable] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [serviceNotice, setServiceNotice] = useState("");
  const [isDocked, setIsDocked] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const controllerRef = useRef(null);
  const autoRetriedRef = useRef(false);
  const { getToken, userId } = useAuth();

  // Load history
  useEffect(() => {
    try {
      const key = userId
        ? `mockmate_chat_history_${userId}`
        : "mockmate_chat_history_guest";
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {}
  }, [userId]);

  // Persist history
  useEffect(() => {
    try {
      const key = userId
        ? `mockmate_chat_history_${userId}`
        : "mockmate_chat_history_guest";
      localStorage.setItem(key, JSON.stringify(messages));
    } catch {}
  }, [messages, userId]);

  // Soft cap history
  useEffect(() => {
    if (messages.length > 200) setMessages((prev) => prev.slice(-200));
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when open
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Suggestions
  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await api.get("/chatbot/suggestions");
      setSuggestions(response.data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  useEffect(() => {
    if (isOpen && suggestions.length === 0) loadSuggestions();
  }, [isOpen, suggestions.length]);

  // Health
  useEffect(() => {
    (async () => {
      try {
        const response = await api.get("/chatbot/health");
        setChatbotAvailable(!!response.data.chatbot.available);
      } catch {
        setChatbotAvailable(false);
      }
    })();
  }, []);

  // Cleanup
  useEffect(
    () => () => {
      try {
        controllerRef.current?.abort();
      } catch {}
    },
    []
  );

  const baseURL = () =>
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_BASE_URL ||
    "/api";
  const buildHeaders = async () => {
    const token = getToken ? await getToken() : null;
    const headers = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };
  const abortStream = () => {
    try {
      controllerRef.current?.abort();
    } catch {}
    controllerRef.current = null;
  };

  async function streamFromHistory(
    history,
    context,
    addAssistantPlaceholder = true
  ) {
    abortStream();
    setConnectionLost(false);

    if (addAssistantPlaceholder) {
      const ts = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: ts, isStreaming: true },
      ]);
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const res = await fetch(`${baseURL()}/chatbot/stream`, {
      method: "POST",
      headers: await buildHeaders(),
      body: JSON.stringify({
        messages: history.map(({ role, content }) => ({ role, content })),
        context,
      }),
      credentials: "include",
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finished = false;

    while (reader && !finished) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\n\n/);
      buffer = events.pop() || "";
      for (const evt of events) {
        const lines = evt.split(/\n/).map((l) => l.trim());
        let eventName = "message";
        let dataPayload = "";
        for (const line of lines) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          if (line.startsWith("data:")) dataPayload += line.slice(5).trim();
        }
        if (eventName === "chunk") {
          try {
            const data = JSON.parse(dataPayload || "{}");
            const text = data.text || "";
            if (!text) continue;
            setMessages((prev) => {
              const u = [...prev];
              const i = u.length - 1;
              if (!u[i]) return prev;
              u[i] = { ...u[i], content: (u[i].content || "") + text };
              return u;
            });
          } catch {}
        } else if (eventName === "done") {
          setMessages((prev) => {
            const u = [...prev];
            const i = u.length - 1;
            if (u[i]) u[i] = { ...u[i], isStreaming: false };
            return u;
          });
          finished = true;
          break;
        } else if (eventName === "error") {
          setMessages((prev) => {
            const u = [...prev];
            const i = u.length - 1;
            if (u[i]) u[i] = { ...u[i], isStreaming: false };
            return u;
          });
          finished = true;
          break;
        }
      }
    }

    if (!finished) {
      setMessages((prev) => {
        const u = [...prev];
        const i = u.length - 1;
        if (u[i])
          u[i] = {
            ...u[i],
            isStreaming: false,
            content: `${
              u[i].content || ""
            }\n\n( Connection lost. You can retry. )`,
          };
        return u;
      });
      setConnectionLost(true);
      if (!autoRetriedRef.current) {
        autoRetriedRef.current = true;
        setTimeout(() => {
          if (connectionLost) retryLastMessage({ isAuto: true });
        }, 1200);
      }
    } else {
      setConnectionLost(false);
      autoRetriedRef.current = false;
    }

    if (!isOpen) setUnreadCount((c) => c + 1);
  }

  async function sendMessage(messageText) {
    if (!messageText.trim()) return;
    const userMessage = {
      role: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const context = {
        currentPage: window.location.pathname,
        timestamp: new Date().toISOString(),
      };
      const history = [...messages, userMessage];
      await streamFromHistory(history, context, true);
    } catch (error) {
      // Fallback: try non-streaming chat endpoint for resilience
      try {
        const context = {
          currentPage: window.location.pathname,
          timestamp: new Date().toISOString(),
        };
        const payload = {
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
          context,
        };
        const resp = await api.post("/chatbot/chat", payload);
        const assistant = {
          role: "assistant",
          content: resp?.data?.message || "",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistant]);
      } catch (fallbackErr) {
        let errorMessage = "Sorry, I encountered an error. Please try again.";
        const status = fallbackErr?.response?.status || fallbackErr?.status;
        if (status === 429)
          errorMessage =
            "Too many requests. Please wait a moment and try again.";
        else if (status === 503) {
          errorMessage =
            "Chatbot service is currently unavailable. Please try again later.";
          setChatbotAvailable(false);
        } else if (status === 402) {
          errorMessage =
            "Chatbot credits are exhausted on the provider. Please add credits on xAI to continue.";
          setServiceNotice(
            "Service temporarily limited: provider credits exhausted"
          );
        }
        toast.error(errorMessage);
        const errorMsg = {
          role: "assistant",
          content: errorMessage,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function retryLastMessage({ isAuto } = {}) {
    try {
      let lastUserIdx = -1;
      for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (messages[i].role === "user") {
          lastUserIdx = i;
          break;
        }
      }
      if (lastUserIdx === -1) {
        toast.error("Nothing to retry.");
        setConnectionLost(false);
        return;
      }
      const trimmed = messages.slice(0, lastUserIdx + 1);
      setMessages(trimmed);
      const context = {
        currentPage: window.location.pathname,
        timestamp: new Date().toISOString(),
      };
      await streamFromHistory(trimmed, context, true);
      setConnectionLost(false);
      if (!isAuto) toast.success("Retried.");
    } catch {
      toast.error("Retry failed. Please try again.");
    }
  }

  const resetChat = () => {
    setMessages([]);
    loadSuggestions();
    toast.success("Chat reset");
  };
  const clearHistory = () => {
    const key = userId
      ? `mockmate_chat_history_${userId}`
      : "mockmate_chat_history_guest";
    try {
      localStorage.removeItem(key);
    } catch {}
    setMessages([]);
    toast.success("History cleared");
  };

  const toggleWidget = () => {
    const next = !isOpen;
    if (!next) abortStream();
    setIsOpen(next);
    if (!isOpen) setUnreadCount(0);
  };
  const isDisabled = !chatbotAvailable;

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] ${isDocked ? "" : ""}`}>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={isDisabled ? undefined : toggleWidget}
          disabled={isDisabled}
          title={
            isDisabled
              ? "AI Assistant temporarily unavailable"
              : "Open AI Assistant"
          }
          className={`relative rounded-full p-4 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDisabled
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white hover:scale-110 focus:ring-teal-400"
          }`}
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && !isDisabled && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 shadow">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-xl shadow-2xl w-[90vw] max-w-md h-[70vh] max-h-[36rem] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden"
            role="dialog"
            aria-label="AI Assistant"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full shadow ${
                      chatbotAvailable ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold tracking-wide">
                      AI Assistant
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">
                      Beta
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-50">Powered by Grok</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetChat}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  aria-label="Reset chat"
                  title="Reset chat"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={clearHistory}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  aria-label="Clear history"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsDocked((v) => {
                      const next = !v;
                      if (!v && isOpen) setIsOpen(false); // when minimizing, close widget to show dock
                      return next;
                    });
                  }}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  aria-label="Minimize"
                  title={isDocked ? "Undock" : "Minimize to dock"}
                >
                  <span className="text-xs">{isDocked ? "↗" : "_"}</span>
                </button>
                <button
                  onClick={() => {
                    const next = false;
                    if (!next) abortStream();
                    setIsOpen(next);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Inline service notice (e.g., provider credits exhausted) */}
            {serviceNotice && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs border-b border-amber-200/60 dark:border-amber-800/40">
                {serviceNotice}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-5">
                    Hi! I'm your MockMate AI assistant. How can I help you
                    today?
                  </p>

                  {/* Suggestions */}
                  {isLoadingSuggestions ? (
                    <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading suggestions...</span>
                      </div>
                      {serviceNotice && (
                        <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {serviceNotice}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(s)}
                          className="text-left p-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start gap-2">
                            {i % 4 === 0 && (
                              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
                            )}
                            {i % 4 === 1 && (
                              <Target className="w-4 h-4 text-teal-500 mt-0.5" />
                            )}
                            {i % 4 === 2 && (
                              <BookOpen className="w-4 h-4 text-cyan-500 mt-0.5" />
                            )}
                            {i % 4 === 3 && (
                              <Sparkles className="w-4 h-4 text-violet-500 mt-0.5" />
                            )}
                            <span>{s}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {[
                      { label: "Explain this page", icon: Lightbulb },
                      { label: "Start a mock interview", icon: Target },
                      { label: "How to improve", icon: Sparkles },
                      { label: "See resources", icon: BookOpen },
                    ].map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(qa.label)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-500 dark:hover:border-teal-500"
                      >
                        <qa.icon className="w-3.5 h-3.5" />
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`group relative max-w-[80%] rounded-xl p-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow"
                        : message.isError
                        ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                    {message.role !== "user" && !message.isError && (
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() =>
                          navigator.clipboard.writeText(message.content)
                        }
                        title="Copy"
                        aria-label="Copy message"
                      >
                        <Clipboard className="w-4 h-4" />
                      </button>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-teal-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Connection lost bar with Retry action */}
            {connectionLost && (
              <div className="px-4 py-2 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between">
                <span>
                  Connection lost while streaming. You can retry the last
                  message.
                </span>
                <button
                  onClick={() => retryLastMessage()}
                  className="px-2 py-1 text-xs rounded bg-amber-200/80 dark:bg-amber-800/60 hover:bg-amber-300/80 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-4 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 shadow"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock preview when closed and docked */}
      {!isOpen && isDocked && messages.length > 0 && (
        <div
          className="absolute bottom-16 right-0 w-72 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 cursor-pointer"
          onClick={toggleWidget}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <span className="text-[10px] text-gray-500">Preview</span>
          </div>
          <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
            {messages[messages.length - 1]?.content || "Ask me anything..."}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
