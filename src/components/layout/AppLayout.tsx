import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomTabs } from './BottomTabs';
import { AddPatientModal } from '../patient/AddPatientModal';

export default function AppLayout() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex flex-col">
      <Header
        onMenuToggle={() => setShowMobileSidebar(true)}
        onNewChat={() => navigate('/app/chat')}
      />

      <div className="flex flex-1 pt-[56px] pb-[64px] md:pb-0 md:pt-[56px]">
        <Sidebar
          isOpen={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
          onAddPatient={() => setShowAddPatient(true)}
        />

        <main className="flex-1 min-w-0 md:ml-[280px]">
          <Outlet context={{ showMobileSidebar, setShowMobileSidebar }} />
        </main>
      </div>

      <BottomTabs />

      {showAddPatient && (
        <AddPatientModal onClose={() => setShowAddPatient(false)} />
      )}
    </div>
  );
}
