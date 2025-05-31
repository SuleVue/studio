
// use server'

/**
 * @fileOverview implements a Genkit flow for the ContextualChatReply story.
 *
 * - contextualChatReply - A function that provides context-aware replies based on chat history.
 * - ContextualChatReplyInput - The input type for the contextualChatReply function.
 * - ContextualChatReplyOutput - The return type for the contextualChatReply function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualChatReplyInputSchema = z.object({
  chatHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      mediaUrl: z.string().optional(),
    })
  ).describe('The history of the chat session.'),
  userMessage: z.string().describe('The current user message.'),
  language: z.enum(['Amharic', 'English']).default('English').describe('The language for the AI response.'),
});

export type ContextualChatReplyInput = z.infer<typeof ContextualChatReplyInputSchema>;

const ContextualChatReplyOutputSchema = z.object({
  reply: z.string().describe('The AI generated reply.'),
});

export type ContextualChatReplyOutput = z.infer<typeof ContextualChatReplyOutputSchema>;

export async function contextualChatReply(input: ContextualChatReplyInput): Promise<ContextualChatReplyOutput> {
  return contextualChatReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualChatReplyPrompt',
  input: {schema: ContextualChatReplyInputSchema},
  output: {schema: ContextualChatReplyOutputSchema},
  prompt: `You are a helpful AI assistant. The user is expecting detailed explanations and comprehensive information in your responses. You should:

  - Provide thorough, in-depth, informative, and relevant responses.
  - Maintain coherence with the ongoing conversation where appropriate.
  - Reference previous messages and any images shared if they are relevant to the current user message.
  - If the user's current message seems to introduce a new topic or ask a distinct question, focus on providing a comprehensive and detailed answer to this new message. Your primary goal is to fully address the user's most recent input with detail.
  - Do not generate images to be included in the response.

  Current Language: {{{language}}}
  When responding in Amharic, it is absolutely critical that you:
  1. Use ONLY Amharic (Ethiopic) script/characters. Do NOT use English transliteration under any circumstances.
  2. Ensure your Amharic response is natural, grammatically correct, and exceptionally detailed, providing comprehensive explanations.
  3. Focus on fulfilling the user's need for in-depth information regarding their current message.

  Chat History:
  {{#each chatHistory}}
  {{#if mediaUrl}}
  {{role}}: {{{content}}} (Image: {{media url=mediaUrl}})
  {{else}}
  {{role}}: {{{content}}}
  {{/if}}
  {{/each}}

  User Message: {{{userMessage}}}

  Assistant: `,
});

const contextualChatReplyFlow = ai.defineFlow(
  {
    name: 'contextualChatReplyFlow',
    inputSchema: ContextualChatReplyInputSchema,
    outputSchema: ContextualChatReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

