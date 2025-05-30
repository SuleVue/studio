"use server";

import type { ChatMessage as ClientChatMessage, Language, AIMessage } from '@/lib/types';
import { analyzeImageObjects } from '@/ai/flows/analyze-image-objects';
import { generateImageIntegratedReply } from '@/ai/flows/image-integrated-replies';
import { contextualChatReply } from '@/ai/flows/contextual-chat-reply';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessUserTurnInput {
  currentClientHistory: ClientChatMessage[];
  userMessageText: string;
  userImageDataUri?: string;
  language: Language;
}

export interface ProcessUserTurnOutput {
  aiMessage: ClientChatMessage;
  analysisMessage?: ClientChatMessage; // Optional message for image analysis text
}

export async function processUserTurn(input: ProcessUserTurnInput): Promise<ProcessUserTurnOutput> {
  const { currentClientHistory, userMessageText, userImageDataUri, language } = input;

  let analysisMessageForClient: ClientChatMessage | undefined = undefined;

  // 1. Construct AI-compatible history from client history
  //    The AI flows expect history *before* the current user message that triggers the AI.
  const aiHistory: AIMessage[] = currentClientHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : (language === 'Amharic' && msg.role === 'ai' ? 'assistant' : 'ai'), // 'assistant' for contextualChatReply in Amharic
    content: msg.content,
    mediaUrl: msg.imageUrl,
  }));

  // 2. Handle image analysis if user uploaded an image
  // This analysis result is shown to the user as a separate message.
  if (userImageDataUri) {
    try {
      const analysisResult = await analyzeImageObjects({ photoDataUri: userImageDataUri });
      const analysisText = `Detected objects in your image: ${analysisResult.objects.join(', ')}.`;
      analysisMessageForClient = {
        id: uuidv4(),
        role: 'system',
        content: analysisText,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error analyzing image:", error);
      analysisMessageForClient = {
        id: uuidv4(),
        role: 'system',
        content: "Sorry, I couldn't analyze the uploaded image.",
        timestamp: Date.now(),
      };
    }
  }
  
  // 3. Create the current user message object to be included in history for the AI
  const currentUserMessageForAIHistory: AIMessage = {
    role: 'user',
    content: userMessageText,
    mediaUrl: userImageDataUri,
  };

  // 4. Combine existing history with current user message for AI processing
  const combinedAiHistory = [...aiHistory, currentUserMessageForAIHistory];

  let aiReplyText: string;
  let aiImageUrls: string[] | undefined = undefined;

  try {
    if (language === 'Amharic') {
      // Use contextualChatReply for Amharic, it can also return one image
      const amharicReply = await contextualChatReply({
        chatHistory: combinedAiHistory.map(m => ({...m, role: m.role === 'ai' ? 'assistant' : m.role } as any)), // Ensure role is 'user'|'assistant'
        userMessage: userMessageText, // The current user text
        language: 'Amharic',
      });
      aiReplyText = amharicReply.reply;
      if (amharicReply.image_url) {
        aiImageUrls = [amharicReply.image_url];
      }
    } else {
      // Use generateImageIntegratedReply for English, supports multiple images
      const englishReply = await generateImageIntegratedReply({
        chatHistory: combinedAiHistory.map(m => ({...m, role: m.role === 'assistant' ? 'ai' : m.role } as any)), // Ensure role is 'user'|'ai'
        userMessage: userMessageText, // The current user text
      });
      aiReplyText = englishReply.reply;
      aiImageUrls = englishReply.imageUrls;
    }
  } catch (error) {
    console.error("Error getting AI reply:", error);
    aiReplyText = "I apologize, I encountered an error trying to respond. Please try again.";
  }

  const aiResponseMessage: ClientChatMessage = {
    id: uuidv4(),
    role: 'ai',
    content: aiReplyText,
    imageUrls: aiImageUrls,
    timestamp: Date.now(),
  };

  return {
    aiMessage: aiResponseMessage,
    analysisMessage: analysisMessageForClient,
  };
}
