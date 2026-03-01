"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OutputRenderer } from "@/components/renderers/output-renderer";
import { useChatStream } from "@/hooks/use-chat-stream";
import { renderMarkdown } from "@/lib/markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  skillOutput?: { type: string; data: unknown };
}

const QUICK_ACTIONS = [
  { label: "Run Content Pipeline", action: "Run the content pipeline to research trending AI topics, analyze competitor coverage, and generate a content brief." },
  { label: "Generate Brief", action: "Generate a content brief based on the latest AI and tech trends." },
  { label: "Sponsor Proposal", action: "Generate a sponsor proposal for Anthropic based on our newsletter analytics." },
  { label: "Performance Report", action: "Generate a performance report for the last month's newsletter editions." },
];

interface ChatPanelProps {
  onClose?: () => void;
}

export function ChatPanel({ onClose: _onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { status, result, error, run } = useChatStream();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Handle result from skill stream
  useEffect(() => {
    if (status === "completed" && result) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: typeof result === "string" ? result : "Here are the results:",
          skillOutput:
            typeof result === "object"
              ? { type: "auto", data: result }
              : undefined,
        },
      ]);
    } else if (status === "failed" && error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `An error occurred: ${error}`,
        },
      ]);
    }
  }, [status, result, error]);

  function handleSend(text?: string) {
    const message = text || input.trim();
    if (!message) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: message },
    ]);
    setInput("");
    run(message);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasStreamingText =
    status === "running" && typeof result === "string" && result.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4 py-8">
              <p className="text-center text-sm text-muted-foreground">
                What would you like to do?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => handleSend(qa.action)}
                    className="rounded-lg border border-border bg-secondary p-3 text-left text-xs hover:bg-card-hover transition-colors"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="prose-custom max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.skillOutput && (
                  <div className="mt-3 rounded-lg bg-card p-3">
                    <OutputRenderer
                      type={msg.skillOutput.type}
                      data={msg.skillOutput.data}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {status === "running" && !hasStreamingText && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          {status === "running" && hasStreamingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-secondary px-4 py-2.5 text-sm text-foreground">
                <div
                  className="prose-custom max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(typeof result === "string" ? result : ""),
                  }}
                />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or run a skill..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || status === "running"}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
