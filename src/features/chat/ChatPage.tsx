import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, Check, ChevronDown } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { usePatients } from '../../contexts/PatientContext';
import { NVIDIA_MODELS, DEFAULT_MODEL } from '../../constants/models';
import { Markdown } from '../../components/markdown/Markdown';
import { Button } from '../../components/ui/Button';

const QUICK_PROMPTS = [
  'Explain Vata imbalance and its management',
  'Suggest diet for Pitta aggravation',
  'Review this treatment protocol',
  'Drug interaction check: Triphala + Metformin',
];

export default function ChatPage() {
  const {
    currentSession,
    currentSessionId,
    isLoading,
    selectedModel,
    setSelectedModel,
    sendMessage,
    createSession,
    switchSession,
    sessions,
  } = useChat();
  const { selectedPatientId, selectedPatient } = usePatients();

  const [input, setInput] = useState('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage(text, selectedPatientId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = (patientId: string | null) => {
    createSession(patientId);
    setShowNewChatDialog(false);
  };

  const messages = currentSession?.messages ?? [];
  const currentModel = NVIDIA_MODELS.find((m) => m.id === selectedModel) || NVIDIA_MODELS[0];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          {selectedPatient ? (
            <div className="min-w-0">
              <div className="text-sm font-medium text-surface-900 dark:text-white truncate">
                {selectedPatient.name}
              </div>
              <div className="text-xs text-surface-500">
                {selectedPatient.prakriti} · {selectedPatient.vikriti}
              </div>
            </div>
          ) : (
            <div className="text-sm font-medium text-surface-900 dark:text-white">
              {currentSession?.title || 'New Chat'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors min-h-[44px]"
            >
              <span className="truncate max-w-[100px]">{currentModel.name}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showModelSelector && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowModelSelector(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 z-50 py-1">
                  {NVIDIA_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelSelector(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedModel === model.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
                      }`}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-surface-500 mt-0.5">{model.description}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* New chat button */}
          <button
            onClick={() => setShowNewChatDialog(true)}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="New Chat"
          >
            <Sparkles className="w-4 h-4 text-surface-500" />
          </button>
        </div>
      </div>

      {/* New Chat Dialog */}
      {showNewChatDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-6 w-[90%] max-w-sm">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">Start New Chat</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleNewChat(null)}
                className="w-full p-3 rounded-lg border border-surface-200 dark:border-surface-700 text-left hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors min-h-[48px]"
              >
                <div className="font-medium text-surface-900 dark:text-white">General Chat</div>
                <div className="text-xs text-surface-500 mt-0.5">No patient context</div>
              </button>
              {selectedPatient && (
                <button
                  onClick={() => handleNewChat(selectedPatientId)}
                  className="w-full p-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 text-left hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors min-h-[48px]"
                >
                  <div className="font-medium text-primary-700 dark:text-primary-300">
                    Chat about {selectedPatient.name}
                  </div>
                  <div className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                    {selectedPatient.prakriti} · {selectedPatient.vikriti}
                  </div>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowNewChatDialog(false)}
              className="w-full mt-4 py-2 text-sm text-surface-500 hover:text-surface-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              How can I help you today?
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 max-w-sm">
              Ask about Ayurvedic treatments, drug interactions, dietary recommendations, or patient protocols.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="p-3 rounded-xl border border-surface-200 dark:border-surface-700 text-left text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors min-h-[48px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                </div>
                <div className="bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-surface-50 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Ayurvedic medicine..."
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none resize-none min-h-[44px] max-h-[120px]"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="rounded-xl min-w-[44px] min-h-[44px]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-surface-400 text-center mt-2">
            AI responses are for reference only. Always verify with clinical judgment.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: { role: string; content: string; timestamp: string } }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS or permission denied
      const textarea = document.createElement('textarea');
      textarea.value = message.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-surface-200 dark:bg-surface-700'
            : 'bg-primary-100 dark:bg-primary-900/30'
        }`}
      >
        {isUser ? (
          <span className="text-sm font-medium text-surface-600 dark:text-surface-400">U</span>
        ) : (
          <Sparkles className="w-4 h-4 text-primary-600" />
        )}
      </div>

      <div className={`max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-xs text-surface-400">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
              <button
                onClick={handleCopy}
                className="p-2 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-surface-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
