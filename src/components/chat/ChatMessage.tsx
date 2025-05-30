"use client";

import type { ChatMessage as MessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Info } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatMessageProps {
  message: MessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAI = message.role === 'ai';

  const imageSources = message.imageUrl ? [message.imageUrl] : (message.imageUrls || []);

  return (
    <div
      className={cn(
        "flex items-start space-x-3 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={isAI ? "/ai-avatar.png" : "/system-avatar.png"} alt={isAI ? "AI" : "System"} data-ai-hint="robot abstract" />
          <AvatarFallback>
            {isAI ? <Bot size={18} /> : <Info size={18} />}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3 shadow-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : isSystem
            ? "bg-muted text-muted-foreground"
            : "bg-card text-card-foreground border"
        )}
      >
        {message.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        )}

        {imageSources.length > 0 && (
          <div className={cn("mt-2 grid gap-2", imageSources.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {imageSources.map((src, index) => (
              <Image
                key={index}
                src={src.startsWith('data:') ? src : `https://placehold.co/300x200.png?url=${encodeURIComponent(src)}`} // Placeholder for external URLs
                alt={`Chat image ${index + 1}`}
                width={300}
                height={200}
                className="rounded-md object-cover aspect-video"
                data-ai-hint={src.startsWith('data:') ? "uploaded image" : "illustration drawing"}
              />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src="/user-avatar.png" alt="User" data-ai-hint="person silhouette" />
          <AvatarFallback>
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
