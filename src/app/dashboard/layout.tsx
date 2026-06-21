import AuthGuard from '@/components/AuthGuard';
import { SidebarNav } from '@/components/SidebarNav';
import { DataProvider } from '@/providers/DataProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DataProvider>
        <div className="flex h-screen overflow-hidden bg-slate-950">
          {/* Sidebar */}
          <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col hidden md:flex">
            <div className="p-6 border-b border-slate-800">
              <h1 className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                <img src="/logo.png" alt="CodeMentorAI Logo" className="h-6 w-auto" />
                CodeMentor AI
              </h1>
            </div>
            <SidebarNav />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-slate-950/50">
            {children}
          </main>
        </div>
      </DataProvider>
    </AuthGuard>
  );
}
