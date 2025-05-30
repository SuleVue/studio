"use client";

import { useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Paperclip, SendHorizonal, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/hooks/useChat';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ChatInput() {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isLoading } = useChat();

  const handleSendMessage = () => {
    if (message.trim() || imageDataUri) {
      sendMessage(message, imageDataUri);
      setMessage("");
      setImagePreview(null);
      setImageDataUri(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageDataUri(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <TooltipProvider>
      <div className="p-4 border-t bg-background">
        {imagePreview && (
          <div className="mb-2 relative w-32 h-32 group">
            <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="preview uploaded" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload-input"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading} aria-label="Upload image">
                <ImagePlus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Attach Image</p></TooltipContent>
          </Tooltip>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or upload an image..."
            className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm"
            rows={1}
            disabled={isLoading}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleSendMessage} disabled={isLoading || (!message.trim() && !imageDataUri)} size="icon" aria-label="Send message">
                <SendHorizonal className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Send</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
