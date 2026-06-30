import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { DEFAULT_MODEL } from '../constants/models';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  patientId: string | null;
  messages: ChatMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentSession: ChatSession | undefined;
  isLoading: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  createSession: (patientId?: string | null) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  sendMessage: (content: string, patientId?: string | null) => Promise<void>;
  getSessionsForPatient: (patientId: string | null) => ChatSession[];
}

const ChatContext = createContext<ChatContextType | null>(null);

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateTitle(content: string): string {
  const words = content.split(' ').slice(0, 6).join(' ');
  return words.length > 40 ? words.slice(0, 40) + '...' : words;
}

/**
 * Truncate message content for display in error messages to avoid leaking
 * potentially sensitive clinical data in error UI.
 */
function sanitizeErrorContent(content: string): string {
  return content.length > 200 ? content.slice(0, 200) + '...' : content;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>('ayurscribe_chat_sessions', []);
  const [currentSessionId, setCurrentSessionId] = useLocalStorage<string | null>('ayurscribe_current_session', null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useLocalStorage('ayurscribe_model', DEFAULT_MODEL);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const createSession = useCallback((patientId?: string | null): string => {
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const session: ChatSession = {
      id,
      title: 'New Chat',
      patientId: patientId ?? null,
      messages: [],
      model: selectedModel,
      createdAt: now,
      updatedAt: now,
    };
    setSessions((prev) => [session, ...prev]);
    setCurrentSessionId(id);
    return id;
  }, [selectedModel, setSessions, setCurrentSessionId]);

  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, [setCurrentSessionId]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [setSessions, currentSessionId, setCurrentSessionId]);

  const getSessionsForPatient = useCallback((patientId: string | null) => {
    return sessions.filter((s) => s.patientId === (patientId ?? null));
  }, [sessions]);

  const sendMessage = useCallback(async (content: string, patientId?: string | null) => {
    let sessionId = currentSessionId;

    if (!sessionId) {
      sessionId = createSession(patientId);
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const isFirstMessage = s.messages.length === 0;
        return {
          ...s,
          title: isFirstMessage ? generateTitle(content) : s.title,
          messages: [...s.messages, userMessage],
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setIsLoading(true);

    try {
      const session = sessions.find((s) => s.id === sessionId);

      // Send last 20 messages for context (increased from 10)
      const existingMessages = (session?.messages ?? []).slice(-20).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));
      const history = [
        ...existingMessages,
        { role: 'user' as const, content },
      ];

      // Determine the effective patientId: explicit param > session patientId
      const effectivePatientId = patientId ?? session?.patientId;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: content,
          model: selectedModel,
          history,
          patientId: effectivePatientId,
          sessionId: sessionId,
        },
      });

      if (error) {
        // Parse Supabase edge function error for better messaging
        const errMsg = error.message || error.error || String(error);
        if (errMsg.includes('not configured')) {
          throw new Error('AI service is temporarily unavailable. Please try again later.');
        }
        if (errMsg.includes('rate limit')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error(errMsg || 'Failed to get response');
      }

      // Handle various response shapes
      const responseText = data?.text || data?.reply || data?.choices?.[0]?.message?.content || '';
      if (!responseText) {
        throw new Error('Received empty response from AI. Please try rephrasing your query.');
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: [...s.messages, assistantMessage],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    } catch (err) {
      let errorText: string;
      if (err instanceof Error) {
        errorText = err.message;
      } else if (typeof err === 'string') {
        errorText = err;
      } else {
        errorText = 'An unexpected error occurred. Please try again.';
      }

      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorText}`,
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: [...s.messages, errorMessage],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, sessions, selectedModel, createSession, setSessions]);

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSessionId,
        currentSession,
        isLoading,
        selectedModel,
        setSelectedModel,
        createSession,
        switchSession,
        deleteSession,
        sendMessage,
        getSessionsForPatient,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
