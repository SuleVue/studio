
"use client";

import { useState, useCallback } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, Language } from '@/lib/types';
import { processUserTurn } from '@/lib/actions';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/components/providers/AuthProvider';
import { DEFAULT_SESSION_NAME } from '@/lib/constants';

// Helper function to generate a concise title from AI response
function generateChatTitle(responseText: string, maxLength: number = 30): string {
  if (!responseText?.trim()) {
    return DEFAULT_SESSION_NAME;
  }
  // Remove common markdown characters for cleaner titles
  const cleanedText = responseText.replace(/[\*#_-]/g, '').trim();
  
  if (!cleanedText) { // If after cleaning, it's empty
      return DEFAULT_SESSION_NAME;
  }
  
  const words = cleanedText.split(/\s+/);
  let titleCandidate = words.slice(0, 5).join(' ');

  if (titleCandidate.length > maxLength) {
    // If the first 5 words are already too long, truncate and add ellipsis
    titleCandidate = titleCandidate.substring(0, maxLength - 3) + "...";
  } else if (words.length > 5 && titleCandidate.length > 0) { 
    // If there were more than 5 words originally, add ellipsis
    titleCandidate += "...";
  }
  
  // Capitalize first letter
  if (titleCandidate.length > 0) {
      titleCandidate = titleCandidate.charAt(0).toUpperCase() + titleCandidate.slice(1);
  }
  
  // Final check: if somehow the title is empty or just "...", revert to default.
  // This also handles cases where cleanedText might be very short.
  if (!titleCandidate.replace(/\./g, '').trim() || titleCandidate.length < 3) { 
      return DEFAULT_SESSION_NAME;
  }

  return titleCandidate;
}


export function useChat() {
  const { 
    activeSession, 
    activeSessionId, 
    addMessageToSession, 
    updateMessageInSession,
    renameSession // Get renameSession from the provider
  } = useSession();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const sendMessage = useCallback(async (text: string, imageDataUri?: string) => {
    if (!currentUser) {
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
      timestamp: Date.now(),
    };
    
    // Store the current session state *before* adding new messages for the check later
    const sessionBeforeThisInteraction = activeSession;
    
    await addMessageToSession(activeSessionId, userMessage);

    const tempAiMessageId = uuidv4();
    const loadingAiMessage: ChatMessage = {
      id: tempAiMessageId,
      role: 'ai',
      content: 'Thinking...',
      timestamp: Date.now(),
      isLoading: true,
    };
    await addMessageToSession(activeSessionId, loadingAiMessage);

    // Construct history for AI using the session state *before* this user message was added
    // (or use currentClientHistory as defined in processUserTurn which includes the user message)
    // For processUserTurn, it expects currentClientHistory to include the message it's replying to.
    // So, we need a representation of history as it is right before calling processUserTurn.
    // The activeSession passed to processUserTurn should be the one that SessionProvider manages,
    // which would include the newly added user message and loading message.
    // The currentClientHistory for processUserTurn should be derived from the latest session state.
    // The most straightforward is to rely on activeSession.messages from useSession() to be updated by the provider.
    // However, if processUserTurn needs current history *including* userMessage,
    // we need to reconstruct it or ensure activeSession in SessionProvider is up-to-date.
    //
    // Let's fetch the latest messages directly from the session *after* adding user & loading messages.
    // This is tricky because `activeSession` in this scope won't update immediately.
    // `processUserTurn` expects `currentClientHistory` to contain the message it's replying to.
    // The `addMessageToSession` updates the state. So, the history used by processUserTurn *should* include the user's message.
    // The SessionProvider's `activeSession.messages` will be updated.
    // The `currentClientHistory` for `processUserTurn` will be based on this updated state.

    // `sessionBeforeThisInteraction` will be used to check if it was a "New Chat" session
    // before this current interaction started.

    try {
      // Let's assume `activeSession.messages` will be updated by the time `processUserTurn` needs it.
      // If not, `processUserTurn` would need to accept `userMessage` separately and combine it.
      // Given current `processUserTurn` definition, it implies it receives history *including* the latest user turn.
      // The `activeSession` hook value won't immediately reflect changes made by `addMessageToSession`
      // within this same `sendMessage` execution.
      // To ensure `processUserTurn` gets the latest, it would be safer if it took the current
      // `userMessage` as a distinct parameter and internally constructed the history.
      // However, altering `processUserTurn` is a larger change.
      // The current `processUserTurn` already takes `userMessageText` and `userImageDataUri`.
      // It uses `currentClientHistory` which is supposed to be from the client *before* this current message.

      // For the rename logic: use `sessionBeforeThisInteraction`
      
      const historyForAI = [
        ...(sessionBeforeThisInteraction?.messages || []),
        userMessage // Explicitly add the current user message for AI context
      ];


      const { aiMessage: finalAiMessage, analysisMessage } = await processUserTurn({
        currentClientHistory: historyForAI, 
        userMessageText: text, 
        userImageDataUri: imageDataUri,
        language: language as Language,
      });

      if (analysisMessage) {
        await updateMessageInSession(activeSessionId, tempAiMessageId, { ...analysisMessage, isLoading: false });
        await addMessageToSession(activeSessionId, finalAiMessage);
      } else {
        await updateMessageInSession(activeSessionId, tempAiMessageId, { ...finalAiMessage, isLoading: false });
      }

      // Rename session if it's the first meaningful interaction in a "New Chat"
      if (sessionBeforeThisInteraction && sessionBeforeThisInteraction.name === DEFAULT_SESSION_NAME) {
        const previousMeaningfulMessages = sessionBeforeThisInteraction.messages.filter(
          (msg) => msg.role === 'user' || msg.role === 'ai'
        );
        if (previousMeaningfulMessages.length === 0) { // Checks if session was empty of user/ai messages before this interaction
          const newTitle = generateChatTitle(finalAiMessage.content);
          if (newTitle && newTitle !== DEFAULT_SESSION_NAME) {
            await renameSession(activeSessionId, newTitle);
          }
        }
      }

    } catch (error) {
      console.error("Error processing user turn:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to get AI response: ${errorMessage}`,
        variant: "destructive",
      });
      // Update the loading message to an error state
      await updateMessageInSession(activeSessionId, tempAiMessageId, {
        role: 'ai',
        content: "Sorry, I couldn't process your request.",
        isLoading: false,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeSessionId, activeSession, addMessageToSession, updateMessageInSession, language, toast, renameSession]);

  return {
    sendMessage,
    isLoading,
  };
}

    