
export type MessageRole = 'user' | 'ai' | 'system';

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  imageUrl?: string; // URL for images displayed in chat
  imageUrls?: string[]; // For AI messages that might include multiple images
  timestamp: number; // Should be a server timestamp in Firestore, number for client
  isLoading?: boolean; // For AI messages that are being generated
};

export type ChatSession = {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number; // Should be a server timestamp in Firestore, number for client
  updatedAt: number; // Should be a server timestamp in Firestore, number for client
  userId?: string; // To associate with a user
};

export type Language = 'English' | 'Amharic';

// For AI flow history
export type AIMessage = {
  role: 'user' | 'ai' | 'assistant'; // 'assistant' is used by contextualChatReply
  content: string;
  mediaUrl?: string;
};

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  country?: string;
}

export interface AuthContextType {
  currentUser: User | null;
  firebaseUser: import('firebase/auth').User | null;
  loading: boolean;
  error: string | null;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileDisplayName: (newName: string) => Promise<boolean>;
  updateUserPasswordInAuth: (newPassword: string) => Promise<boolean>;
}

export interface SignUpData {
  fullName: string;
  email: string;
  passwordOne: string;
  country: string;
}

export interface SignInData {
  email: string;
  passwordOne: string;
}
