import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAppState, useAppDispatch } from "@/hooks/useAppContext";
import { sendChatMessage } from "@/api/apiService";
import { Bot, User, CornerDownLeft, LoaderCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

export function ChatSidebar() {
  const { sessionId, chatHistory, isChatLoading } = useAppState();
  const dispatch = useAppDispatch();
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || isChatLoading) return;

    const userMessage = { role: "user" as const, content: input };
    dispatch({ type: "ADD_USER_MESSAGE", payload: userMessage });

    dispatch({ type: "CHAT_START" });

    sendChatMessage(sessionId, input, dispatch);

    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-card border-l">
      <div className="flex items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Assistant</h2>
        </div>
      </div>

      {/* Chat History */}
      <div
        ref={scrollAreaRef}
        className="flex-grow p-4 space-y-6 overflow-y-auto"
      >
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={cn("flex items-start gap-3", {
              "justify-end": msg.role === "user",
            })}
          >
            {msg.role === "assistant" && (
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Bot className="w-5 h-5" />
              </div>
            )}
            <div
              className={cn(
                "max-w-xs md:max-w-md p-3 rounded-lg text-left",
                msg.role === "assistant"
                  ? "bg-muted"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {isChatLoading &&
              msg.role === "assistant" &&
              msg.content === "" &&
              index === chatHistory.length - 1 ? (
                <LoaderCircle className="w-5 h-5 animate-spin" />
              ) : (
                <div
                  className={cn("prose prose-sm dark:prose-invert", {
                    "prose-invert": msg.role === "user",
                  })}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="p-2 rounded-full bg-muted">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            placeholder="Ask about your data or for chart suggestions..."
            className="pr-16"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSubmit(e);
              }
            }}
            disabled={isChatLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute bottom-2.5 right-2.5"
            disabled={isChatLoading || !input.trim()}
          >
            <CornerDownLeft className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
