"use client";

import { MessageArea } from "./messageArea";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat() {
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <div className="max-w-174 flex flex-col h-screen w-full mx-auto relative">
      {/* Message Display Area */}
      <div className="w-full space-y-3 pt-4 px-3 overflow-y-auto pb-64 scrollbar-hide flex-1">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <div className={`font-semibold mb-1 ${
              message.role === 'user' ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            {message.parts.map((part, index) => {
              switch (part.type) {
                case "text":
                  return (
                    <div key={index} className="whitespace-pre-wrap">
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
        ))}
      </div>
      
      <div className="fixed bottom-3 px-3 w-full max-w-174 z-20">
        {/* Message Input Area */}
        <MessageArea onSendMessage={sendMessage} />
      </div>
    </div>
  );
}