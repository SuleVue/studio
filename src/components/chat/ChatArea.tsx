"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from '@/components/providers/SessionProvider';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import Image from 'next/image';

export function ChatArea() {
  const { activeSession } = useSession();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground p-4">
        <Image src="https://placehold.co/300x300.png" alt="Tarik Chat Welcome" width={200} height={200} className="mb-4 rounded-full" data-ai-hint="communication chat" />
        <h2 className="text-2xl font-semibold mb-2">Welcome to Tarik Chat</h2>
        <p>Select a session or create a new one to start chatting.</p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} viewportRef={viewportRef}>
        <div className="max-w-4xl mx-auto w-full space-y-2">
          {activeSession.messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquareTextIcon size={48} className="mb-4" />
                <p className="text-lg">No messages yet in "{activeSession.name}".</p>
                <p>Send a message or upload an image to start the conversation!</p>
            </div>
          ) : (
            activeSession.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            )))}
        </div>
      </ScrollArea>
      <ChatInput />
    </div>
  );
}

function MessageSquareTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M13 8H7" />
      <path d="M17 12H7" />
    </svg>
  )
}
