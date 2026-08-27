import { useState, useEffect } from 'react';
import Navbar from './components/Header/Navbar';
import Sidebar from './components/Navigation/Sidebar';
import ChatStudio from './components/Chat/ChatStudio';
import IngestionHub from './components/Ingestion/IngestionHub';
import CommandPalette from './components/CommandPalette/CommandPalette';
import AuthModal from './components/Auth/AuthModal';
import { ThemeType, DocumentItem, ChatSession, UserProfile } from './types';
import './App.css';

function getInitialTheme(): ThemeType {
  const saved = localStorage.getItem('app-theme') as ThemeType | null;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function App() {
  const [theme, setTheme] = useState<ThemeType>(getInitialTheme);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('documind_auth');
    return saved !== 'false'; // Default to authenticated for instant preview
  });
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  
  // Shared Live Document State across App, IngestionHub & ChatStudio
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc-1',
      name: 'Tesla_2025_Annual_Report_10K.pdf',
      format: 'PDF',
      size: '4.8 MB',
      status: 'ready',
      date: 'Aug 27, 2026',
      summary: 'Annual 10-K filing containing FY2025 financial statements, automotive delivery margins, and energy storage performance.',
      previewText: 'ITEM 7. MANAGEMENT DISCUSSION AND ANALYSIS OF FINANCIAL CONDITION. Automotive gross margin expanded to 19.8% with total revenues reaching $96.77B.'
    },
    {
      id: 'doc-2',
      name: 'Q4_Cloud_Infrastructure_Costs.xlsx',
      format: 'Excel',
      size: '1.2 MB',
      status: 'ready',
      date: 'Aug 27, 2026',
      summary: 'Quarterly compute infrastructure budget across AWS, GCP, and specialized GPU clusters.',
      previewText: 'Cluster US-EAST-VA-09: 64x H100 GPU compute burn rate $41,200/mo. Average utilization 94.2%.'
    },
    {
      id: 'doc-3',
      name: 'System_Architecture_Overview.md',
      format: 'Markdown',
      size: '340 KB',
      status: 'ready',
      date: 'Aug 26, 2026',
      summary: 'Core engineering specification for microservices, API contracts, and message queues.',
      previewText: 'Architecture spec detailing distributed ingestion workers, semantic chunking boundaries, and fault-tolerant resumes.'
    }
  ]);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    { id: 'sess-1', title: 'Tesla FY2025 Revenue Analysis' },
    { id: 'sess-2', title: 'Cloud Infrastructure Spend' }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('sess-1');

  // Apply theme attribute to html document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Listen for system theme changes if no manual preference is stored
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('app-theme');
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Global keyboard shortcuts (Ctrl+K for search, Ctrl+B for sidebar toggle)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next: ThemeType = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app-theme', next);
      return next;
    });
  };

  const handleLogin = (user: UserProfile) => {
    setIsAuthenticated(true);
    localStorage.setItem('documind_auth', 'true');
    if (user) {
      localStorage.setItem('documind_user', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('documind_auth', 'false');
  };

  const handleNewSession = () => {
    const newId = `sess-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation'
    };
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setActiveTab('chat');
  };

  const handleDeleteSession = (id: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== id));
  };

  // If user is logged out, display the Authentication / Login screen
  if (!isAuthenticated) {
    return <AuthModal onLogin={handleLogin} theme={theme} />;
  }

  return (
    <div className="app-container-root">
      {/* ChatGPT Sidebar */}
      <Sidebar 
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id: string) => {
          setCurrentSessionId(id);
          setActiveTab('chat');
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onOpenDocManager={() => setActiveTab('documents')}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        docCount={documents.length}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        onLogout={handleLogout}
      />

      {/* Main Viewport */}
      <div className="main-viewport-pane">
        <Navbar 
          theme={theme} 
          onToggleTheme={handleToggleTheme}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          docCount={documents.length}
        />

        <main className="main-content-scroll">
          {activeTab === 'chat' && (
            <ChatStudio 
              key={currentSessionId}
              onNavigateToIngestion={() => setActiveTab('documents')}
              docCount={documents.length}
              documents={documents}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />
          )}

          {activeTab === 'documents' && (
            <IngestionHub 
              documents={documents}
              setDocuments={setDocuments}
            />
          )}
        </main>
      </div>

      {/* Spotlight Command Palette (Ctrl+K) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSession={(id: string) => {
          setCurrentSessionId(id);
          setActiveTab('chat');
        }}
        onNewSession={handleNewSession}
        chatSessions={chatSessions}
        onOpenDocManager={() => setActiveTab('documents')}
      />
    </div>
  );
}

export default App;
