
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ChatSession, ChatMessage } from '@/lib/types';
import { 
  DEFAULT_SESSION_NAME, 
  LOCAL_STORAGE_SESSIONS_KEY, 
  LOCAL_STORAGE_ACTIVE_SESSION_ID_KEY,
  MAX_STORED_MESSAGES_PER_SESSION,
  MAX_MESSAGE_CONTENT_LENGTH_STORAGE // Import new constant
} from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
// Removed useToast import as it's not used for now to keep changes minimal

interface SessionContextType {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeSession: ChatSession | null;
  createSession: (name?: string) => ChatSession;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newName: string) => void;
  switchSession: (sessionId: string) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  updateMessageInSession: (sessionId: string, messageId: string, updatedMessageData: Partial<ChatMessage>) => void;
  clearActiveSessionMessages: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
      const storedActiveId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION_ID_KEY);
      
      let loadedSessions: ChatSession[] = [];
      if (storedSessions) {
        loadedSessions = JSON.parse(storedSessions);
      }

      if (loadedSessions.length === 0) {
        const newSession = createNewSession(DEFAULT_SESSION_NAME);
        loadedSessions = [newSession];
        setActiveSessionId(newSession.id);
        // Initial save, no need to scrub/truncate here as messages are empty
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(loadedSessions));
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_ID_KEY, newSession.id);
      } else {
        setActiveSessionId(storedActiveId && loadedSessions.some(s => s.id === storedActiveId) ? storedActiveId : loadedSessions[0].id);
      }
      setSessions(loadedSessions);
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
      // Fallback to a single new session if loading fails
      const newSession = createNewSession(DEFAULT_SESSION_NAME);
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    }
    setMounted(true);
  }, []); // createNewSession is stable, no need to add to deps

  useEffect(() => {
    if (mounted) {
      const sessionsToStore = sessions.map(session => {
        // 1. Process messages: scrub Data URIs and truncate long content
        const processedMessages = session.messages.map(message => {
          const messageCopy = { ...message }; // Shallow copy to avoid mutating live state

          // Scrub imageUrl if it's a data URI
          if (messageCopy.imageUrl && messageCopy.imageUrl.startsWith('data:')) {
            messageCopy.imageUrl = undefined;
          }

          // Scrub imageUrls if they contain data URIs
          if (messageCopy.imageUrls && messageCopy.imageUrls.some(url => typeof url === 'string' && url.startsWith('data:'))) {
            messageCopy.imageUrls = messageCopy.imageUrls
              .map(url => (typeof url === 'string' && url.startsWith('data:')) ? undefined : url)
              .filter(url => url !== undefined) as string[] | undefined;
            if (messageCopy.imageUrls && messageCopy.imageUrls.length === 0) {
              messageCopy.imageUrls = undefined;
            }
          }
          
          // Truncate long content
          if (messageCopy.content && messageCopy.content.length > MAX_MESSAGE_CONTENT_LENGTH_STORAGE) {
            messageCopy.content = messageCopy.content.substring(0, MAX_MESSAGE_CONTENT_LENGTH_STORAGE) + "... (truncated)";
          }
          
          return messageCopy;
        });

        // 2. Truncate the array of processed messages if it's too long
        const finalMessagesForSession = processedMessages.length > MAX_STORED_MESSAGES_PER_SESSION
          ? processedMessages.slice(-MAX_STORED_MESSAGES_PER_SESSION)
          : processedMessages;

        return {
          ...session,
          messages: finalMessagesForSession,
        };
      });

      try {
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessionsToStore));
        if (activeSessionId) {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_ID_KEY, activeSessionId);
        }
      } catch (error) {
        console.error("Error saving sessions to localStorage:", error);
        // Potentially notify user or implement more sophisticated error handling
        // For example, using useToast hook if integrated:
        // toast({
        //   title: "Storage Warning",
        //   description: "Could not save all chat data. Some older messages or sessions might be lost if storage is full.",
        //   variant: "destructive",
        // });
      }
    }
  }, [sessions, activeSessionId, mounted]);

  const createNewSession = (name?: string): ChatSession => {
    const now = Date.now();
    return {
      id: uuidv4(),
      name: name || DEFAULT_SESSION_NAME,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
  };

  const createSession = useCallback((name?: string) => {
    const newSession = createNewSession(name);
    setSessions(prev => [newSession, ...prev].sort((a, b) => b.updatedAt - a.updatedAt)); // Keep sorted
    setActiveSessionId(newSession.id);
    return newSession;
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(session => session.id !== sessionId);
      if (activeSessionId === sessionId) {
        // Switch to the most recently updated session or null if no sessions left (then create one)
        const sortedSessions = updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
        setActiveSessionId(sortedSessions.length > 0 ? sortedSessions[0].id : null);
      }
      // If all sessions are deleted, create a new default one
      return updatedSessions.length > 0 ? updatedSessions : [createNewSession(DEFAULT_SESSION_NAME)];
    });
  }, [activeSessionId]);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, name: newName, updatedAt: Date.now() } : session
      ).sort((a,b) => b.updatedAt - a.updatedAt) // Re-sort after update
    );
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    // Bring switched session to top by updating its timestamp (optional, but common UX)
    // setSessions(prev => prev.map(s => s.id === sessionId ? {...s, updatedAt: Date.now()} : s).sort((a,b) => b.updatedAt - a.updatedAt));
  }, []);

  const addMessageToSession = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, message], updatedAt: Date.now() }
          : session
      ).sort((a,b) => b.updatedAt - a.updatedAt) // Re-sort after update
    );
  }, []);
  
  const updateMessageInSession = useCallback((sessionId: string, messageId: string, updatedMessageData: Partial<ChatMessage>) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updatedMessageData, updatedAt: Date.now() } : msg
              ),
              updatedAt: Date.now(),
            }
          : session
      ).sort((a,b) => b.updatedAt - a.updatedAt) // Re-sort after update
    );
  }, []);

  const clearActiveSessionMessages = useCallback(() => {
    if (activeSessionId) {
      setSessions(prev =>
        prev.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [], updatedAt: Date.now() }
            : session
        ).sort((a,b) => b.updatedAt - a.updatedAt) // Re-sort after update
      );
    }
  }, [activeSessionId]);

  const activeSession = sessions.find(session => session.id === activeSessionId) || (sessions.length > 0 ? sessions[0] : null);
  
  // Ensure sessions are sorted by updatedAt initially and after operations
  useEffect(() => {
    if (mounted && sessions.length > 0) {
        const sortedSessions = [...sessions].sort((a,b) => b.updatedAt - a.updatedAt);
        if (JSON.stringify(sortedSessions) !== JSON.stringify(sessions)) { // Avoid unnecessary state updates
            setSessions(sortedSessions);
        }
        // Ensure activeSessionId is valid, if not, set to the first one
        if (!activeSessionId && sortedSessions.length > 0) {
            setActiveSessionId(sortedSessions[0].id);
        } else if (activeSessionId && !sortedSessions.some(s => s.id === activeSessionId) && sortedSessions.length > 0) {
            setActiveSessionId(sortedSessions[0].id);
        } else if (sortedSessions.length === 0 && activeSessionId !== null) {
            // This case should be handled by deleteSession creating a new default session
            // but as a safeguard:
            const newSession = createNewSession(DEFAULT_SESSION_NAME);
            setSessions([newSession]);
            setActiveSessionId(newSession.id);
        }
    } else if (mounted && sessions.length === 0 && activeSessionId === null) {
        // If no sessions exist after mount (e.g. localStorage was empty/corrupt and initial load failed to set one up)
        const newSession = createNewSession(DEFAULT_SESSION_NAME);
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
    }
  }, [sessions, mounted, activeSessionId]);


  if (!mounted) {
    return null; // Prevent rendering until client-side mount and localStorage access
  }

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession,
        createSession,
        deleteSession,
        renameSession,
        switchSession,
        addMessageToSession,
        updateMessageInSession,
        clearActiveSessionMessages,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
