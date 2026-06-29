import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PatientProvider } from './contexts/PatientContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProtocolProvider } from './contexts/ProtocolContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './components/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import ChatPage from './features/chat/ChatPage';
import ProtocolPage from './features/protocol/ProtocolPage';
import { Spinner } from './components/ui/Spinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <PatientProvider>
              <ChatProvider>
                <ProtocolProvider>
                  <Routes>
                    <Route path="/" element={<Navigate to="/app/chat" replace />} />
                    <Route path="/app" element={<AppLayout />}>
                      <Route index element={<Navigate to="/app/chat" replace />} />
                      <Route path="chat" element={<ChatPage />} />
                      <Route path="protocol" element={<ProtocolPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/app/chat" replace />} />
                  </Routes>
                </ProtocolProvider>
              </ChatProvider>
            </PatientProvider>
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
