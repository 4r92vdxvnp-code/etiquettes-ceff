import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { RowList } from './components/RowList.js';

export default function App(): JSX.Element {
  return (
    <div className="flex h-screen flex-col overflow-hidden font-sans">
      {/* Bandeau haut */}
      <Header />

      {/* Corps : sidebar + contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panneau de configuration */}
        <Sidebar />

        {/* Zone principale : liste des rangees */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <RowList />
        </main>
      </div>
    </div>
  );
}
