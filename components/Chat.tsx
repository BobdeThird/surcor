"use client";

import { MessageArea } from "./messageArea";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "./ui/button";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat() {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // Refs and state for scrolling behavior
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20px threshold
      setShowScrollToBottom(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    // Check initial position
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]); // Re-check when messages change

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (containerRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    }
  };

  return (
    <div className="max-w-174 flex flex-col h-screen w-full mx-auto relative">
      {/* Message Display Area */}
      <div 
        ref={containerRef}
        className="w-full space-y-3 pt-4 px-3 overflow-y-auto pb-64 scrollbar-hide flex-1"
      >
        {messages.map((message) => (
          <div key={message.id} className={`mb-4 ${
            message.role === 'user' ? 'flex justify-end' : 'w-full'
          }`}>
            {message.role === 'user' ? (
              // User message - gray bubble, right aligned
              <div className="max-w-[80%] bg-gray-100 rounded-2xl px-4 py-3">
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <div key={index} className="whitespace-pre-wrap text-gray-800">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                        </div>
                      );
                    default:
                      return (
                        <div key={index} className="text-gray-500">
                          [{part.type}]
                        </div>
                      );
                  }
                })}
              </div>
            ) : (
              // Assistant message - full width, no bubble
              <div className="w-full">
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <div key={index} className="whitespace-pre-wrap text-gray-800">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                        </div>
                      );
                    default:
                      return (
                        <div key={index} className="text-gray-500">
                          [{part.type}]
                        </div>
                      );
                  }
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="fixed bottom-3 px-3 w-full max-w-174 z-20">
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <div className="flex justify-center mb-5">
            <Button
              onClick={scrollToBottom}
              className="rounded-full shadow-lg bg-black hover:bg-gray-800 text-white h-8 w-8 transition-transform hover:scale-120"
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}
        {/* Message Input Area */}
        <MessageArea onSendMessage={sendMessage} />
      </div>
    </div>
  );
}