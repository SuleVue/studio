
"use client";

import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { PlusCircle, Edit3, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from '@/components/providers/SessionProvider';
import type { ChatSession } from '@/lib/types';
import { RenameSessionDialog, DeleteSessionDialog } from './SessionDialogs';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ChatSidebar() {
  const { sessions, activeSessionId, createSession, switchSession, deleteSession, renameSession } = useSession();
  const [renamingSession, setRenamingSession] = useState<ChatSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<ChatSession | null>(null);

  const handleRename = (newName: string) => {
    if (renamingSession) {
      renameSession(renamingSession.id, newName);
      setRenamingSession(null);
    }
  };

  const handleDelete = () => {
    if (deletingSession) {
      deleteSession(deletingSession.id);
      setDeletingSession(null);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <Button onClick={() => createSession()} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          {sessions.length === 0 && (
            <p className="text-sm text-sidebar-foreground/70 text-center py-4">No chat sessions yet.</p>
          )}
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    // Base button structural classes (excluding color variants from buttonVariants)
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    // Our specific layout, sizing, and default text color for sidebar items
                    "w-full justify-start h-10 px-3 group text-sidebar-foreground",
                    // SVG styling for icons inside this custom "button"
                    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                    // Conditional styling for active/hover, using sidebar specific colors
                    activeSessionId === session.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' // Active state
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground' // Hover state for inactive items
                  )}
                  onClick={() => switchSession(session.id)}
                  onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      switchSession(session.id);
                    }
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{session.name}</span>
                  <div className="ml-auto flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); setRenamingSession(session); }}
                          aria-label="Rename session"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top"><p>Rename</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeletingSession(session); }}
                          aria-label="Delete session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top"><p>Delete</p></TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>

        {renamingSession && (
          <RenameSessionDialog
            isOpen={!!renamingSession}
            onOpenChange={() => setRenamingSession(null)}
            currentName={renamingSession.name}
            onRename={handleRename}
          />
        )}

        {deletingSession && (
          <DeleteSessionDialog
            isOpen={!!deletingSession}
            onOpenChange={() => setDeletingSession(null)}
            sessionName={deletingSession.name}
            onDelete={handleDelete}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
