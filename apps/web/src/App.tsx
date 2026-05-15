import { useState } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { RowList } from './components/RowList.js';

export default function App(): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden font-sans">
      <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Backdrop mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar : tiroir sur mobile, fixe sur desktop */}
        <div
          className={[
            'fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-200',
            'md:relative md:translate-x-0 md:z-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-3 md:p-6">
          <RowList />
        </main>
      </div>
    </div>
  );
}
