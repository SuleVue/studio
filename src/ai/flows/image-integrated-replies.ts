'use server';

/**
 * @fileOverview AI flow that allows the AI to include relevant images in its replies based on the ongoing conversation.
 *
 * - generateImageIntegratedReply - A function that generates a context-aware reply, potentially including relevant images.
 * - ImageIntegratedReplyInput - The input type for the generateImageIntegratedReply function.
 * - ImageIntegratedReplyOutput - The return type for the generateImageIntegratedReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageIntegratedReplyInputSchema = z.object({
  chatHistory: z.array(
    z.object({
      role: z.enum(['user', 'ai']),
      content: z.string(),
      mediaUrl: z.string().optional(), // Allow for image URLs in chat history
    })
  ).describe('The history of the chat session, including previous messages and media URLs.'),
  userMessage: z.string().describe('The current message from the user.'),
});

export type ImageIntegratedReplyInput = z.infer<typeof ImageIntegratedReplyInputSchema>;

const ImageIntegratedReplyOutputSchema = z.object({
  reply: z.string().describe('The AI-generated reply to the user message.'),
  imageUrls: z.array(z.string()).optional().describe('URLs of any images included in the reply.'),
});

export type ImageIntegratedReplyOutput = z.infer<typeof ImageIntegratedReplyOutputSchema>;

export async function generateImageIntegratedReply(input: ImageIntegratedReplyInput): Promise<ImageIntegratedReplyOutput> {
  return imageIntegratedReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageIntegratedReplyPrompt',
  input: {schema: ImageIntegratedReplyInputSchema},
  output: {schema: ImageIntegratedReplyOutputSchema},
  prompt: `You are an AI assistant engaged in a conversation. Generate a relevant and informative reply to the user's message, taking into account the chat history. If relevant to the conversation, include image URLs to enhance your response.

Chat History:
{{#each chatHistory}}
  {{#if (eq role \"user\")}}User:{{else}}AI:{{/if}} {{content}} {{#if mediaUrl}}(Image: {{media url=mediaUrl}}){{/if}}
{{/each}}

User Message: {{userMessage}}

Reply with the following structure:
{
  "reply": "Your text reply here",
  "imageUrls": ["url1", "url2"]
}

If no images are relevant, the imageUrls array should be empty.`, // Use {{media url=mediaUrl}} for images
});

const imageIntegratedReplyFlow = ai.defineFlow(
  {
    name: 'imageIntegratedReplyFlow',
    inputSchema: ImageIntegratedReplyInputSchema,
    outputSchema: ImageIntegratedReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
