import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { HimsHeader } from './HimsHeader';
import { HimsSidebar } from './HimsSidebar';
import { HimsBottomTabs } from './HimsBottomTabs';

export default function HimsLayout() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex flex-col">
      <HimsHeader
        onMenuToggle={() => setShowMobileSidebar(true)}
        onCollapseToggle={() => setCollapsed((c) => !c)}
        collapsed={collapsed}
      />

      <div className="flex flex-1 pt-[56px] pb-[64px] md:pb-0">
        <HimsSidebar
          isOpen={showMobileSidebar}
          collapsed={collapsed}
          onClose={() => setShowMobileSidebar(false)}
          onNavigate={(path) => {
            navigate(path);
            setShowMobileSidebar(false);
          }}
        />

        <main
          className={`flex-1 min-w-0 transition-all duration-200 ${
            collapsed ? 'md:ml-[64px]' : 'md:ml-[240px]'
          }`}
        >
          <Outlet />
        </main>
      </div>

      <HimsBottomTabs />
    </div>
  );
}
