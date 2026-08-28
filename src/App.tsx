import { useState, useEffect } from 'react';
import Navbar from './components/Header/Navbar';
import Sidebar from './components/Navigation/Sidebar';
import ChatStudio from './components/Chat/ChatStudio';
import IngestionHub from './components/Ingestion/IngestionHub';
import CommandPalette from './components/CommandPalette/CommandPalette';
import AuthModal from './components/Auth/AuthModal';
import { authApi } from './services/authApi';
import { ThemeType, DocumentItem, ChatSession, UserProfile } from './types';
import './App.css';

function getSystemTheme(): ThemeType {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function getStoredUserTheme(): ThemeType {
  const saved = localStorage.getItem('app-theme') as ThemeType | null;
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return getSystemTheme();
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('noesis_auth') === 'true';
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('noesis_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [systemTheme, setSystemTheme] = useState<ThemeType>(getSystemTheme);
  const [userTheme, setUserTheme] = useState<ThemeType>(getStoredUserTheme);

  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  
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

  useEffect(() => {
    const verifySession = async () => {
      try {
        const user = await authApi.getMe();
        if (user) {
          setIsAuthenticated(true);
          setUserProfile(user);
          localStorage.setItem('noesis_auth', 'true');
          localStorage.setItem('noesis_user', JSON.stringify(user));
        } else {
          setIsAuthenticated(false);
          setUserProfile(null);
          localStorage.removeItem('noesis_auth');
          localStorage.removeItem('noesis_user');
        }
      } catch (err) {
        setIsAuthenticated(false);
        setUserProfile(null);
        localStorage.removeItem('noesis_auth');
        localStorage.removeItem('noesis_user');
      }
    };
    verifySession();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const nextTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(nextTheme);
      if (!localStorage.getItem('app-theme')) {
        setUserTheme(nextTheme);
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const activeTheme = isAuthenticated ? userTheme : systemTheme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(activeTheme);
  }, [activeTheme]);

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

  const handleLogin = (user: UserProfile) => {
    setUserProfile(user);
    setIsAuthenticated(true);
    localStorage.setItem('noesis_auth', 'true');
    localStorage.setItem('noesis_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    setUserProfile(null);
    localStorage.removeItem('noesis_auth');
    localStorage.removeItem('noesis_user');
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeType = userTheme === 'dark' ? 'light' : 'dark';
    setUserTheme(nextTheme);
    localStorage.setItem('app-theme', nextTheme);
  };

  const handleNewSession = () => {
    const newId = `sess-${Date.now()}`;
    setChatSessions(prev => [{ id: newId, title: 'New Analysis Session' }, ...prev]);
    setCurrentSessionId(newId);
    setActiveTab('chat');
  };

  return (
    <div className={`app-root ${activeTheme}`}>
      {!isAuthenticated && (
        <AuthModal onLogin={handleLogin} />
      )}

      <div className={`app-workspace-container ${!isAuthenticated ? 'workspace-inert' : ''}`}>
        <Sidebar 
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewSession={handleNewSession}
          onDeleteSession={(id) => setChatSessions(prev => prev.filter(s => s.id !== id))}
          onOpenDocManager={() => setActiveTab('documents')}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          docCount={documents.length}
          theme={userTheme}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          userProfile={userProfile}
        />

        <main className="app-main-viewport">
          <Navbar 
            theme={userTheme}
            onToggleTheme={handleToggleTheme}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            docCount={documents.length}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          />

          <div className="app-content-stage">
            {activeTab === 'chat' ? (
              <ChatStudio 
                onNavigateToIngestion={() => setActiveTab('documents')}
                docCount={documents.length}
                documents={documents}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              />
            ) : (
              <IngestionHub 
                documents={documents}
                setDocuments={setDocuments}
              />
            )}
          </div>
        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          setActiveTab('chat');
          setIsCommandPaletteOpen(false);
        }}
        onNewSession={() => {
          handleNewSession();
          setIsCommandPaletteOpen(false);
        }}
        chatSessions={chatSessions}
        onOpenDocManager={() => {
          setActiveTab('documents');
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}

export default App;
