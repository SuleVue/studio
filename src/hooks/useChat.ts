
"use client";

import { useState, useCallback } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, Language } from '@/lib/types';
import { processUserTurn } from '@/lib/actions';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/components/providers/AuthProvider'; // Import useAuth

export function useChat() {
  const { activeSession, activeSessionId, addMessageToSession, updateMessageInSession } = useSession();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth(); // Get current user

  const sendMessage = useCallback(async (text: string, imageDataUri?: string) => {
    if (!currentUser) { // Check if user is logged in
      toast({
        title: "Authentication Required",
        description: "Please log in to send messages.",
        variant: "destructive",
      });
      return;
    }

    if (!activeSessionId || (!text.trim() && !imageDataUri)) {
      return;
    }

    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      imageUrl: imageDataUri,
      timestamp: Date.now(), // Client-side timestamp for immediate display
    };
    
    // Add message to local state immediately, then persist
    // addMessageToSession will handle Firestore persistence.
    await addMessageToSession(activeSessionId, userMessage);


    const currentClientHistory = activeSession?.messages || []; 
    // Ensure currentClientHistory includes the user message just added for context to AI
    // The processUserTurn function expects history *before* the current user message,
    // but since we want the AI to react *to* this message, it *should* be part of its context.
    // However, the current processUserTurn expects history *before* the user's current turn.
    // So, we pass the history *before* adding the new userMessage locally for AI processing.
    // The local addMessageToSession handles UI update.
    
    // Let's adjust: The history passed to AI *should* logically include the message it's replying to.
    // The current structure of addMessageToSession adds to local state then calls firestore.
    // The activeSession.messages might not be updated yet for processUserTurn.
    // Let's use the state *before* adding the current user message for AI context if processUserTurn needs that.
    // OR, if processUserTurn expects the message its replying to, pass currentClientHistory *after* local add.
    // Based on current processUserTurn, it expects history *before* current turn.

    const historyForAI = [...(activeSession?.messages || [])]; // This now contains userMessage

    // Add a temporary loading AI message
    const tempAiMessageId = uuidv4();
    const loadingAiMessage: ChatMessage = {
      id: tempAiMessageId,
      role: 'ai',
      content: 'Thinking...',
      timestamp: Date.now(),
      isLoading: true,
    };
    await addMessageToSession(activeSessionId, loadingAiMessage);


    try {
      // Pass history including the latest user message for the AI to process
      const { aiMessage: finalAiMessage, analysisMessage } = await processUserTurn({
        currentClientHistory: historyForAI, // History INCLUDES the user message that triggered this
        userMessageText: text, // This is a bit redundant if historyForAI is complete
        userImageDataUri: imageDataUri,
        language: language as Language,
      });

      if (analysisMessage) {
        // If analysis message exists, update the loading placeholder with it first
        await updateMessageInSession(activeSessionId, tempAiMessageId, { ...analysisMessage, isLoading: false });
        // Then add the final AI reply as a new message
        await addMessageToSession(activeSessionId, finalAiMessage);
      } else {
        // If no analysis message, just update the loading message with the final AI reply
        await updateMessageInSession(activeSessionId, tempAiMessageId, { ...finalAiMessage, isLoading: false });
      }

    } catch (error) {
      console.error("Error processing user turn:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to get AI response: ${errorMessage}`,
        variant: "destructive",
      });
      await updateMessageInSession(activeSessionId, tempAiMessageId, {
        role: 'ai',
        content: "Sorry, I couldn't process your request.",
        isLoading: false,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeSessionId, activeSession, addMessageToSession, updateMessageInSession, language, toast]);

  return {
    sendMessage,
    isLoading,
  };
}
