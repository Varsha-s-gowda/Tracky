import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <Sidebar open={sidebarOpen} onClose={setSidebarOpen} />
      <div className="lg:pl-[276px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main key={location.pathname} className="min-h-[calc(100vh-68px)] animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
