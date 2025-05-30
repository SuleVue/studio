"use client";

import { useState, useCallback } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, Language } from '@/lib/types';
import { processUserTurn } from '@/lib/actions';
import { v4 as uuidv4 } from 'uuid';

export function useChat() {
  const { activeSession, activeSessionId, addMessageToSession, updateMessageInSession } = useSession();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text: string, imageDataUri?: string) => {
    if (!activeSessionId || (!text.trim() && !imageDataUri)) {
      return;
    }

    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      imageUrl: imageDataUri,
      timestamp: Date.now(),
    };
    addMessageToSession(activeSessionId, userMessage);

    const currentClientHistory = activeSession?.messages || [];
    
    // Add a temporary loading AI message
    const tempAiMessageId = uuidv4();
    addMessageToSession(activeSessionId, {
      id: tempAiMessageId,
      role: 'ai',
      content: 'Thinking...',
      timestamp: Date.now(),
      isLoading: true,
    });

    try {
      const { aiMessage: finalAiMessage, analysisMessage } = await processUserTurn({
        currentClientHistory, // Send history *before* the current user message
        userMessageText: text,
        userImageDataUri: imageDataUri,
        language: language as Language, // Cast as Language type
      });

      // If there was an analysis message (e.g., from image upload), add it first
      if (analysisMessage) {
         // If an analysis message exists, update the loading message to be the analysis message
        updateMessageInSession(activeSessionId, tempAiMessageId, { ...analysisMessage, isLoading: false });
        // Then add the final AI message as a new message
        addMessageToSession(activeSessionId, finalAiMessage);
      } else {
        // If no analysis message, just update the loading message with the final AI reply
        updateMessageInSession(activeSessionId, tempAiMessageId, { ...finalAiMessage, isLoading: false });
      }

    } catch (error) {
      console.error("Error processing user turn:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to get AI response: ${errorMessage}`,
        variant: "destructive",
      });
      updateMessageInSession(activeSessionId, tempAiMessageId, {
        role: 'ai',
        content: "Sorry, I couldn't process your request.",
        isLoading: false,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, activeSession, addMessageToSession, updateMessageInSession, language, toast]);

  return {
    sendMessage,
    isLoading,
  };
}
