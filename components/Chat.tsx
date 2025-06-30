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
    <div className="flex flex-col items-center justify-center h-screen p-5">
      {/* Message Display Area */}
      <div className="flex-1 w-full max-w-2xl overflow-y-auto mb-4">
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
      
      {/* Message Input Area */}
      <MessageArea onSendMessage={sendMessage} />
    </div>
  );
}