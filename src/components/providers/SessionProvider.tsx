"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ChatSession, ChatMessage } from '@/lib/types';
import { 
  DEFAULT_SESSION_NAME, 
  LOCAL_STORAGE_SESSIONS_KEY, 
  LOCAL_STORAGE_ACTIVE_SESSION_ID_KEY,
  MAX_STORED_MESSAGES_PER_SESSION
} from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

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
        // Initial save, no need to truncate here as messages are empty
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(loadedSessions));
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_ID_KEY, newSession.id);
      } else {
        setActiveSessionId(storedActiveId && loadedSessions.some(s => s.id === storedActiveId) ? storedActiveId : loadedSessions[0].id);
      }
      setSessions(loadedSessions);
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
      const newSession = createNewSession(DEFAULT_SESSION_NAME);
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const sessionsToStore = sessions.map(session => {
        if (session.messages.length > MAX_STORED_MESSAGES_PER_SESSION) {
          return {
            ...session,
            // Keep only the last MAX_STORED_MESSAGES_PER_SESSION messages
            messages: session.messages.slice(-MAX_STORED_MESSAGES_PER_SESSION), 
          };
        }
        return session;
      });

      try {
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessionsToStore));
        if (activeSessionId) {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_ID_KEY, activeSessionId);
        }
      } catch (error) {
        console.error("Error saving sessions to localStorage:", error);
        // Potentially notify user or implement more sophisticated error handling like clearing older sessions
        // For now, logging the error is a good first step.
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
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(session => session.id !== sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
      }
      return updatedSessions.length > 0 ? updatedSessions : [createNewSession(DEFAULT_SESSION_NAME)];
    });
  }, [activeSessionId]);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, name: newName, updatedAt: Date.now() } : session
      )
    );
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const addMessageToSession = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, message], updatedAt: Date.now() }
          : session
      )
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
      )
    );
  }, []);

  const clearActiveSessionMessages = useCallback(() => {
    if (activeSessionId) {
      setSessions(prev =>
        prev.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [], updatedAt: Date.now() }
            : session
        )
      );
    }
  }, [activeSessionId]);

  const activeSession = sessions.find(session => session.id === activeSessionId) || null;
  
  if (!mounted) {
    return null;
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
