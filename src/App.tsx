import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PatientProvider } from './contexts/PatientContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProtocolProvider } from './contexts/ProtocolContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './components/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import SelectionPage from './features/home/SelectionPage';
import ChatPage from './features/chat/ChatPage';
import ProtocolPage from './features/protocol/ProtocolPage';
import { Spinner } from './components/ui/Spinner';

// HIMS imports
import HimsLayout from './features/hims/layout/HimsLayout';
import { ToastProvider } from './contexts/ToastContext';
import { GoogleCalendarProvider } from './contexts/GoogleCalendarContext';
import HimsDashboard from './features/hims/pages/HimsDashboard';
import HimsPatients from './features/hims/pages/HimsPatients';
import HimsPatientDetail from './features/hims/pages/HimsPatientDetail';
import HimsOPD from './features/hims/pages/HimsOPD';
import HimsBilling from './features/hims/pages/HimsBilling';
import HimsPharmacy from './features/hims/pages/HimsPharmacy';
import HimsIPD from './features/hims/pages/HimsIPD';
import HimsTherapy from './features/hims/pages/HimsTherapy';
import HimsTreatmentPlan from './features/hims/pages/HimsTreatmentPlan';

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
          <ToastProvider>
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<SelectionPage />} />
              <Route path="/ayurgpt" element={
                <PatientProvider>
                  <ChatProvider>
                    <ProtocolProvider>
                      <AppLayout />
                    </ProtocolProvider>
                  </ChatProvider>
                </PatientProvider>
              }>
                <Route index element={<Navigate to="/ayurgpt/chat" replace />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="protocol" element={<ProtocolPage />} />
              </Route>
              <Route path="/hims" element={
                <GoogleCalendarProvider>
                  <HimsLayout />
                </GoogleCalendarProvider>
              }>
                <Route index element={<Navigate to="/hims/dashboard" replace />} />
                <Route path="dashboard" element={<HimsDashboard />} />
                <Route path="patients" element={<HimsPatients />} />
                <Route path="patients/:id" element={<HimsPatientDetail />} />
                <Route path="opd" element={<HimsOPD />} />
                <Route path="ipd" element={<HimsIPD />} />
                <Route path="therapy" element={<HimsTherapy />} />
                <Route path="treatment" element={<HimsTreatmentPlan />} />
                <Route path="billing" element={<HimsBilling />} />
                <Route path="pharmacy" element={<HimsPharmacy />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ProtectedRoute>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
