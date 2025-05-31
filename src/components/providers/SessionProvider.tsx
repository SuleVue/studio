
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ChatSession, ChatMessage } from '@/lib/types';
import { 
  DEFAULT_SESSION_NAME, 
  MAX_STORED_MESSAGES_PER_SESSION,
  MAX_MESSAGE_CONTENT_LENGTH_STORAGE
} from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  query, 
  serverTimestamp,
  Timestamp,
  writeBatch,
  limit
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface SessionContextType {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeSession: ChatSession | null;
  createSession: (name?: string) => Promise<ChatSession | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newName: string) => Promise<void>;
  switchSession: (sessionId: string) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => Promise<void>;
  updateMessageInSession: (sessionId: string, messageId: string, updatedMessageData: Partial<ChatMessage>) => Promise<void>;
  clearActiveSessionMessages: () => Promise<void>;
  isLoadingSessions: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const getSessionsCollectionRef = useCallback(() => {
    if (!currentUser) return null;
    return collection(db, 'users', currentUser.uid, 'sessions');
  }, [currentUser]);

  // Function to prepare messages for Firestore storage
  const prepareMessagesForStorage = (messages: ChatMessage[]): ChatMessage[] => {
    const processedMessages = messages.map(message => {
      const messageCopy = { ...message };
      if (messageCopy.imageUrl && messageCopy.imageUrl.startsWith('data:')) {
        messageCopy.imageUrl = undefined; // Scrub Data URIs
      }
      if (messageCopy.imageUrls) {
        messageCopy.imageUrls = messageCopy.imageUrls
            .map(url => (typeof url === 'string' && url.startsWith('data:')) ? undefined : url)
            .filter(url => url !== undefined) as string[] | undefined;
        if (messageCopy.imageUrls && messageCopy.imageUrls.length === 0) {
            messageCopy.imageUrls = undefined;
        }
      }
      if (messageCopy.content && messageCopy.content.length > MAX_MESSAGE_CONTENT_LENGTH_STORAGE) {
        messageCopy.content = messageCopy.content.substring(0, MAX_MESSAGE_CONTENT_LENGTH_STORAGE) + "... (truncated)";
      }
      // Convert client-side number timestamp to Firestore Timestamp for new messages if needed
      // For existing messages from Firestore, they will already be Timestamps or converted on fetch
      if (typeof messageCopy.timestamp === 'number') {
         // messageCopy.timestamp = Timestamp.fromMillis(messageCopy.timestamp);
      }
      return messageCopy;
    });
  
    return processedMessages.length > MAX_STORED_MESSAGES_PER_SESSION
      ? processedMessages.slice(-MAX_STORED_MESSAGES_PER_SESSION)
      : processedMessages;
  };
  
  // Fetch sessions from Firestore
  useEffect(() => {
    if (authLoading) {
      setIsLoadingSessions(true);
      return;
    }
    if (!currentUser) {
      setSessions([]);
      setActiveSessionId(null);
      setIsLoadingSessions(false);
      return;
    }

    setIsLoadingSessions(true);
    const sessionsColRef = getSessionsCollectionRef();
    if (!sessionsColRef) {
        setIsLoadingSessions(false);
        return;
    }

    const q = query(sessionsColRef, orderBy('updatedAt', 'desc'));
    getDocs(q).then(async (snapshot) => {
      let loadedSessions: ChatSession[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          messages: data.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toMillis() : msg.timestamp,
          })),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
          userId: data.userId,
        } as ChatSession;
      });

      if (loadedSessions.length === 0) {
        const newSession = await createSessionInternal(DEFAULT_SESSION_NAME);
        if (newSession) {
          loadedSessions = [newSession];
        }
      }
      
      setSessions(loadedSessions);
      if (loadedSessions.length > 0) {
        // Try to keep active session or default to first
        const lastActiveId = localStorage.getItem(`tarikChatActiveSessionId_${currentUser.uid}`);
        if (lastActiveId && loadedSessions.some(s => s.id === lastActiveId)) {
          setActiveSessionId(lastActiveId);
        } else {
          setActiveSessionId(loadedSessions[0].id);
        }
      } else {
        setActiveSessionId(null);
      }
      setIsLoadingSessions(false);
    }).catch(error => {
      console.error("Error fetching sessions:", error);
      toast({ title: "Error", description: "Could not load your chat sessions.", variant: "destructive" });
      setIsLoadingSessions(false);
    });

  }, [currentUser, authLoading, toast]); // Removed getSessionsCollectionRef from deps as it depends on currentUser

  // Save active session ID to localStorage
  useEffect(() => {
    if (currentUser && activeSessionId) {
      localStorage.setItem(`tarikChatActiveSessionId_${currentUser.uid}`, activeSessionId);
    }
  }, [activeSessionId, currentUser]);


  const createSessionInternal = async (name?: string): Promise<ChatSession | null> => {
    if (!currentUser) return null;
    const sessionsColRef = getSessionsCollectionRef();
    if (!sessionsColRef) return null;

    const now = serverTimestamp();
    const newSessionData = {
      name: name || DEFAULT_SESSION_NAME,
      messages: [],
      createdAt: now,
      updatedAt: now,
      userId: currentUser.uid,
    };
    try {
      const docRef = await addDoc(sessionsColRef, newSessionData);
      const createdSession: ChatSession = {
        ...newSessionData,
        id: docRef.id,
        createdAt: Date.now(), // Approximate client time, Firestore will have server time
        updatedAt: Date.now(),
        messages: [], // Ensure messages is an empty array
      };
      setSessions(prev => [createdSession, ...prev].sort((a,b) => b.updatedAt - a.updatedAt));
      setActiveSessionId(createdSession.id);
      return createdSession;
    } catch (error) {
      console.error("Error creating session in Firestore:", error);
      toast({ title: "Error", description: "Failed to create new session.", variant: "destructive" });
      return null;
    }
  };
  
  const createSession = useCallback(createSessionInternal, [currentUser, getSessionsCollectionRef, toast]);


  const deleteSession = useCallback(async (sessionId: string) => {
    if (!currentUser) return;
    const sessionsColRef = getSessionsCollectionRef();
    if (!sessionsColRef) return;

    const sessionDocRef = doc(sessionsColRef, sessionId);
    try {
      await deleteDoc(sessionDocRef);
      setSessions(prev => {
        const updatedSessions = prev.filter(session => session.id !== sessionId);
        if (activeSessionId === sessionId) {
          const sortedSessions = updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
          setActiveSessionId(sortedSessions.length > 0 ? sortedSessions[0].id : null);
           if (sortedSessions.length === 0) {
            // If all sessions are deleted, create a new default one
            createSessionInternal(DEFAULT_SESSION_NAME);
          }
        }
        return updatedSessions;
      });
      toast({ title: "Session Deleted", description: "The chat session has been deleted." });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({ title: "Error", description: "Failed to delete session.", variant: "destructive" });
    }
  }, [currentUser, activeSessionId, getSessionsCollectionRef, toast]);

  const renameSession = useCallback(async (sessionId: string, newName: string) => {
    if (!currentUser) return;
    const sessionsColRef = getSessionsCollectionRef();
    if (!sessionsColRef) return;
    
    const sessionDocRef = doc(sessionsColRef, sessionId);
    try {
      await updateDoc(sessionDocRef, { name: newName, updatedAt: serverTimestamp() });
      setSessions(prev =>
        prev.map(session =>
          session.id === sessionId ? { ...session, name: newName, updatedAt: Date.now() } : session
        ).sort((a,b) => b.updatedAt - a.updatedAt)
      );
      toast({ title: "Session Renamed", description: `Session name updated to "${newName}".` });
    } catch (error) {
      console.error("Error renaming session:", error);
      toast({ title: "Error", description: "Failed to rename session.", variant: "destructive" });
    }
  }, [currentUser, getSessionsCollectionRef, toast]);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const addMessageToSession = useCallback(async (sessionId: string, message: ChatMessage) => {
    if (!currentUser) return;
    const sessionsColRef = getSessionsCollectionRef();
    if (!sessionsColRef) return;

    const sessionDocRef = doc(sessionsColRef, sessionId);
    
    setSessions(prev => {
      const sessionIndex = prev.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) return prev;
      
      const currentSession = prev[sessionIndex];
      let updatedMessages = [...currentSession.messages, message];
      
      // Apply storage preparation rules to the full message list before saving to state and firestore
      const messagesForStorage = prepareMessagesForStorage(updatedMessages);
      
      const updatedSession = {
        ...currentSession,
        messages: messagesForStorage, // Use the potentially truncated/scrubbed list for state
        updatedAt: Date.now()
      };

      // Update Firestore with the prepared messages (which might be further transformed for Firestore e.g. serverTimestamp)
      // Note: `prepareMessagesForStorage` is client-side. We need to be careful with `serverTimestamp`
      // For messages, timestamp is usually client-generated or a converted Firestore timestamp.
      const firestoreMessages = messagesForStorage.map(m => ({
        ...m,
        // Ensure timestamp is a Firestore Timestamp if it's new, or keep as is if from Firestore
        timestamp: m.timestamp instanceof Timestamp ? m.timestamp : (typeof m.timestamp === 'number' ? Timestamp.fromMillis(m.timestamp) : serverTimestamp())
      }));

      updateDoc(sessionDocRef, { 
        messages: firestoreMessages, 
        updatedAt: serverTimestamp() 
      }).catch(error => {
        console.error("Error adding message to session:", error);
        toast({ title: "Error", description: "Failed to save message.", variant: "destructive" });
      });
      
      const newSessions = [...prev];
      newSessions[sessionIndex] = updatedSession;
      return newSessions.sort((a,b) => b.updatedAt - a.updatedAt);
    });
  }, [currentUser, getSessionsCollectionRef, toast]);
  
  const updateMessageInSession = useCallback(async (sessionId: string, messageId: string, updatedMessageData: Partial<ChatMessage>) => {
    if (!currentUser) return;
    const sessionsColRef = getSessionsCollectionRef();
    if (!sessionsColRef) return;

    const sessionDocRef = doc(sessionsColRef, sessionId);

    setSessions(prev => {
        const sessionIndex = prev.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) return prev;

        const currentSession = prev[sessionIndex];
        let newMessagesArray = currentSession.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updatedMessageData, updatedAt: Date.now() } : msg
        );
        
        const messagesForStorage = prepareMessagesForStorage(newMessagesArray);

        const firestoreMessages = messagesForStorage.map(m => ({
            ...m,
            timestamp: m.timestamp instanceof Timestamp ? m.timestamp : (typeof m.timestamp === 'number' ? Timestamp.fromMillis(m.timestamp) : serverTimestamp())
        }));
        
        updateDoc(sessionDocRef, { 
            messages: firestoreMessages, 
            updatedAt: serverTimestamp() 
        }).catch(error => {
            console.error("Error updating message in session:", error);
            toast({ title: "Error", description: "Failed to update message.", variant: "destructive" });
        });

        const updatedSession = {
            ...currentSession,
            messages: messagesForStorage,
            updatedAt: Date.now()
        };
        const newSessions = [...prev];
        newSessions[sessionIndex] = updatedSession;
        return newSessions.sort((a,b) => b.updatedAt - a.updatedAt);
    });
  }, [currentUser, getSessionsCollectionRef, toast]);

  const clearActiveSessionMessages = useCallback(async () => {
    if (!currentUser || !activeSessionId) return;
    const sessionsColRef = getSessionsCollectionRef();
    if (!sessionsColRef) return;

    const sessionDocRef = doc(sessionsColRef, activeSessionId);
    try {
      await updateDoc(sessionDocRef, { messages: [], updatedAt: serverTimestamp() });
      setSessions(prev =>
        prev.map(session =>
          session.id === activeSessionId
            ? { ...session, messages: [], updatedAt: Date.now() }
            : session
        ).sort((a,b) => b.updatedAt - a.updatedAt)
      );
      toast({ title: "Messages Cleared", description: "All messages in this session have been cleared." });
    } catch (error) {
      console.error("Error clearing messages:", error);
      toast({ title: "Error", description: "Failed to clear messages.", variant: "destructive" });
    }
  }, [currentUser, activeSessionId, getSessionsCollectionRef, toast]);

  const activeSession = sessions.find(session => session.id === activeSessionId) || null;
  
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
        isLoadingSessions,
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
